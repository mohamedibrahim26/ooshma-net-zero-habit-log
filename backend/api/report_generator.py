"""
PDF Report Generator + Email sender for EcoTrack weekly reports.
Uses reportlab for PDF and Django's SMTP email backend.
"""
from datetime import date, timedelta
from io import BytesIO
from django.db.models import Sum, Count
from django.core.mail import EmailMessage
from django.conf import settings


def generate_pdf_report(user):
    """Generate a weekly PDF report for the user. Returns bytes."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
    except ImportError:
        raise ImportError("reportlab is not installed. Run: pip install reportlab")

    from .models import Activity, Goal, Streak, Achievement

    today = date.today()
    week_ago = today - timedelta(days=7)
    month_start = today.replace(day=1)

    # Data
    week_activities = Activity.objects.filter(user=user, activity_date__gte=week_ago)
    month_activities = Activity.objects.filter(user=user, activity_date__gte=month_start)

    week_total = week_activities.aggregate(t=Sum('kg_co2'))['t'] or 0
    month_total = month_activities.aggregate(t=Sum('kg_co2'))['t'] or 0

    by_category = list(
        week_activities.values('category').annotate(total=Sum('kg_co2')).order_by('-total')
    )

    streak, _ = Streak.objects.get_or_create(user=user)
    achievements = Achievement.objects.filter(user=user)
    active_goals = Goal.objects.filter(user=user, is_active=True)

    # PDF setup
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            rightMargin=2*cm, leftMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()
    green = colors.HexColor('#16a34a')
    dark = colors.HexColor('#1f2937')
    gray = colors.HexColor('#6b7280')
    light_green = colors.HexColor('#f0fdf4')

    title_style = ParagraphStyle('title', parent=styles['Title'],
                                  textColor=green, fontSize=24, spaceAfter=4)
    subtitle_style = ParagraphStyle('subtitle', parent=styles['Normal'],
                                     textColor=gray, fontSize=11, spaceAfter=20)
    section_style = ParagraphStyle('section', parent=styles['Heading2'],
                                    textColor=dark, fontSize=13, spaceBefore=16, spaceAfter=8)
    body_style = ParagraphStyle('body', parent=styles['Normal'],
                                 textColor=dark, fontSize=10, spaceAfter=6)

    story = []

    # Header
    story.append(Paragraph("🌿 EcoTrack Weekly Report", title_style))
    story.append(Paragraph(f"Week of {week_ago.strftime('%B %d')} – {today.strftime('%B %d, %Y')}  |  {user.username}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=green, spaceAfter=16))

    # Summary stats
    story.append(Paragraph("📊 Summary", section_style))
    global_weekly = 4800 / 52
    vs_global = round(((week_total - global_weekly) / global_weekly) * 100, 1) if global_weekly else 0
    vs_text = f"{'+' if vs_global > 0 else ''}{vs_global}% vs global average"

    stats_data = [
        ['Metric', 'Value'],
        ['This week total', f'{round(week_total, 2)} kg CO₂e'],
        ['This month total', f'{round(month_total, 2)} kg CO₂e'],
        ['Global weekly average', f'{round(global_weekly, 1)} kg CO₂e'],
        ['Your vs global', vs_text],
        ['Current streak', f'{streak.current_streak} days 🔥'],
        ['Total days logged', f'{streak.total_days_logged} days'],
    ]

    stats_table = Table(stats_data, colWidths=[8*cm, 8*cm])
    stats_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), green),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 1), (-1, -1), light_green),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, light_green]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1fae5')),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(stats_table)

    # By category
    if by_category:
        story.append(Paragraph("🗂️ Breakdown by Category", section_style))
        cat_data = [['Category', 'CO₂ (kg)', 'Share']]
        for row in by_category:
            share = round((row['total'] / week_total) * 100, 1) if week_total else 0
            cat_data.append([row['category'].capitalize(), f"{round(row['total'], 2)}", f"{share}%"])
        cat_table = Table(cat_data, colWidths=[6*cm, 5*cm, 5*cm])
        cat_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), green),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, light_green]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1fae5')),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(cat_table)

    # Goals
    if active_goals.exists():
        story.append(Paragraph("🎯 Active Goals", section_style))
        for goal in active_goals:
            current = month_activities.aggregate(t=Sum('kg_co2'))['t'] or 0
            pct = min(round((current / goal.target_kg) * 100, 1), 100) if goal.target_kg else 0
            status_text = "✅ On track" if pct < 80 else ("⚠️ Warning" if pct < 100 else "🚨 Exceeded")
            story.append(Paragraph(
                f"<b>{goal.title}</b> — Target: {goal.target_kg} kg | Current: {round(current, 1)} kg | {pct}% used {status_text}",
                body_style
            ))

    # Recent activities
    recent = week_activities.order_by('-activity_date')[:10]
    if recent.exists():
        story.append(Paragraph("📋 This Week's Activities", section_style))
        act_data = [['Date', 'Category', 'Activity', 'CO₂ (kg)', 'Severity']]
        for act in recent:
            act_data.append([
                act.activity_date.strftime('%b %d'),
                act.category.capitalize(),
                act.activity_type.replace('_', ' ').capitalize(),
                str(round(act.kg_co2, 2)),
                act.severity.upper(),
            ])
        act_table = Table(act_data, colWidths=[3*cm, 3*cm, 5*cm, 3*cm, 3*cm])
        act_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), green),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, light_green]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1fae5')),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(act_table)

    # Achievements
    if achievements.exists():
        story.append(Paragraph("🏆 Your Achievements", section_style))
        from .models import Achievement as AchModel
        ach_text = '  |  '.join([AchModel.TYPE_DICT.get(a.achievement_type, a.achievement_type) for a in achievements])
        story.append(Paragraph(ach_text, body_style))

    # Tips
    story.append(Spacer(1, 0.5*cm))
    story.append(HRFlowable(width="100%", thickness=1, color=green))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("💡 Tip of the week", section_style))
    story.append(Paragraph(
        "The single highest-impact action most people can take is reducing flights. "
        "One transatlantic flight produces more CO₂ than 3 months of driving. "
        "When you must fly, offset your emissions through Gold Standard certified projects.",
        body_style
    ))
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph(
        f"Generated by EcoTrack on {today.strftime('%B %d, %Y')} · Keep tracking, keep reducing 🌍",
        ParagraphStyle('footer', parent=styles['Normal'], textColor=gray, fontSize=9, alignment=TA_CENTER)
    ))

    doc.build(story)
    return buffer.getvalue()


def send_report_email(user, pdf_bytes):
    """Send the weekly report PDF via Gmail SMTP."""
    today = date.today()
    subject = f"🌿 Your EcoTrack Weekly Report — {today.strftime('%B %d, %Y')}"
    body = f"""Hi {user.username},

Your weekly carbon footprint report is attached! 📊

Keep logging your activities to stay on track and hit your goals.

A few quick reminders:
• Small habits add up — one meat-free day saves ~400 kg CO₂/year
• Check the Action Center for personalized reduction tips
• Set a monthly goal to stay motivated

Keep it green! 🌱
The EcoTrack Team
"""
    email = EmailMessage(
        subject=subject,
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    email.attach(
        f'ecotrack-report-{today}.pdf',
        pdf_bytes,
        'application/pdf'
    )
    email.send(fail_silently=False)
