from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from datetime import timedelta, date
import urllib.request
import urllib.parse
import json

from .models import Activity, Goal, Streak, Achievement
from .serializers import (
    ActivitySerializer, GoalSerializer, StreakSerializer, AchievementSerializer
)
from core.calculator import calculate_emission, get_severity, get_equivalents
from core.suggestions import get_suggestions
from core.emission_factors import GLOBAL_AVERAGE_ANNUAL_KG
from core.chat_engine import get_response as chat_response


# Helpers

def update_streak(user):
    today = date.today()
    streak, _ = Streak.objects.get_or_create(user=user)
    if streak.last_logged_date == today:
        return streak
    if streak.last_logged_date == today - timedelta(days=1):
        streak.current_streak += 1
    else:
        streak.current_streak = 1
    streak.last_logged_date = today
    streak.total_days_logged += 1
    if streak.current_streak > streak.longest_streak:
        streak.longest_streak = streak.current_streak
    streak.save()
    check_achievements(user, streak)
    return streak


def check_achievements(user, streak=None):
    if streak is None:
        streak, _ = Streak.objects.get_or_create(user=user)
    total_activities = Activity.objects.filter(user=user).count()
    unlocked = set(Achievement.objects.filter(user=user).values_list('achievement_type', flat=True))
    to_unlock = []
    if total_activities >= 1 and 'first_log' not in unlocked:
        to_unlock.append('first_log')
    if streak.current_streak >= 3 and 'streak_3' not in unlocked:
        to_unlock.append('streak_3')
    if streak.current_streak >= 7 and 'streak_7' not in unlocked:
        to_unlock.append('streak_7')
    if streak.current_streak >= 30 and 'streak_30' not in unlocked:
        to_unlock.append('streak_30')
    if total_activities >= 10 and 'logged_10' not in unlocked:
        to_unlock.append('logged_10')
    if total_activities >= 50 and 'logged_50' not in unlocked:
        to_unlock.append('logged_50')
    week_ago = date.today() - timedelta(days=7)
    this_week = Activity.objects.filter(user=user, activity_date__gte=week_ago)
    if this_week.exists() and not this_week.filter(severity__in=['high', 'critical']).exists():
        if 'low_impact_week' not in unlocked:
            to_unlock.append('low_impact_week')
    for atype in to_unlock:
        Achievement.objects.get_or_create(user=user, achievement_type=atype)
    return to_unlock


# Activity ViewSet

class ActivityViewSet(viewsets.ModelViewSet):
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Activity.objects.filter(user=self.request.user)
        category = self.request.query_params.get('category')
        severity = self.request.query_params.get('severity')
        days = self.request.query_params.get('days')
        if category:
            qs = qs.filter(category=category)
        if severity:
            qs = qs.filter(severity=severity)
        if days:
            since = date.today() - timedelta(days=int(days))
            qs = qs.filter(activity_date__gte=since)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        update_streak(self.request.user)

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        user = request.user
        today = date.today()
        month_start = today.replace(day=1)
        year_start = today.replace(month=1, day=1)
        activities = Activity.objects.filter(user=user)

        total_year = activities.filter(activity_date__gte=year_start).aggregate(t=Sum('kg_co2'))['t'] or 0
        total_month = activities.filter(activity_date__gte=month_start).aggregate(t=Sum('kg_co2'))['t'] or 0
        total_today = activities.filter(activity_date=today).aggregate(t=Sum('kg_co2'))['t'] or 0

        by_category = list(
            activities.filter(activity_date__gte=month_start)
            .values('category').annotate(total=Sum('kg_co2')).order_by('-total')
        )
        thirty_days_ago = today - timedelta(days=30)
        daily_trend = list(
            activities.filter(activity_date__gte=thirty_days_ago)
            .values('activity_date').annotate(total=Sum('kg_co2')).order_by('activity_date')
        )
        one_year_ago = today - timedelta(days=365)
        monthly_trend = list(
            activities.filter(activity_date__gte=one_year_ago)
            .annotate(month=TruncMonth('activity_date'))
            .values('month').annotate(total=Sum('kg_co2')).order_by('month')
        )
        severity_breakdown = list(
            activities.filter(activity_date__gte=month_start)
            .values('severity').annotate(count=Count('id'))
        )
        global_monthly = GLOBAL_AVERAGE_ANNUAL_KG / 12
        vs_global = round(((total_month - global_monthly) / global_monthly) * 100, 1) if global_monthly else 0
        streak, _ = Streak.objects.get_or_create(user=user)

        return Response({
            'totals': {
                'today_kg': round(total_today, 2),
                'month_kg': round(total_month, 2),
                'year_kg': round(total_year, 2),
            },
            'comparison': {
                'global_monthly_avg_kg': round(global_monthly, 1),
                'vs_global_percent': vs_global,
            },
            'by_category': by_category,
            'daily_trend': daily_trend,
            'monthly_trend': monthly_trend,
            'severity_breakdown': severity_breakdown,
            'streak': {
                'current': streak.current_streak,
                'longest': streak.longest_streak,
                'total_days': streak.total_days_logged,
            },
        })

    @action(detail=False, methods=['post'])
    def calculate(self, request):
        category = request.data.get('category')
        activity_type = request.data.get('activity_type')
        quantity = request.data.get('quantity')
        if not all([category, activity_type, quantity]):
            return Response({'error': 'category, activity_type, and quantity are required.'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            kg = calculate_emission(category, activity_type, float(quantity))
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        severity = get_severity(kg)
        equivalents = get_equivalents(kg)
        suggestions = get_suggestions(category, activity_type, kg, severity)
        return Response({'kg_co2': kg, 'severity': severity, 'equivalents': equivalents, 'suggestions': suggestions})

    @action(detail=True, methods=['get'])
    def suggestions(self, request, pk=None):
        activity = self.get_object()
        suggestions = get_suggestions(activity.category, activity.activity_type, activity.kg_co2, activity.severity)
        equivalents = get_equivalents(activity.kg_co2)
        return Response({'activity': ActivitySerializer(activity).data, 'equivalents': equivalents, 'suggestions': suggestions})

    @action(detail=False, methods=['get'])
    def emission_factors(self, request):
        from core.emission_factors import TRANSPORT, ENERGY, FOOD, SHOPPING, WASTE
        return Response({
            'transport': list(TRANSPORT.keys()),
            'energy': list(ENERGY.keys()),
            'food': list(FOOD.keys()),
            'shopping': list(SHOPPING.keys()),
            'waste': list(WASTE.keys()),
        })


# Goals ViewSet

class GoalViewSet(viewsets.ModelViewSet):
    serializer_class = GoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# Streak & Achievements

class StreakView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        streak, _ = Streak.objects.get_or_create(user=request.user)
        achievements = Achievement.objects.filter(user=request.user)
        new_achievements = check_achievements(request.user, streak)
        return Response({
            'streak': StreakSerializer(streak).data,
            'achievements': AchievementSerializer(achievements, many=True).data,
            'newly_unlocked': new_achievements,
        })


# AI Chat

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def chat(request):
    message = request.data.get('message', '').strip()
    if not message:
        return Response({'error': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)
    result = chat_response(message)
    return Response(result)


# Food Scanner

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def food_scan(request):
    query = request.query_params.get('q', '').strip()
    barcode = request.query_params.get('barcode', '').strip()
    if not query and not barcode:
        return Response({'error': 'Provide q (search term) or barcode.'}, status=400)

    try:
        if barcode:
            url = "https://world.openfoodfacts.org/api/v0/product/{}.json".format(barcode)
        else:
            encoded = urllib.parse.quote(query)
            url = "https://world.openfoodfacts.org/cgi/search.pl?search_terms={}&search_simple=1&action=process&json=1&page_size=5".format(encoded)

        req = urllib.request.Request(url, headers={'User-Agent': 'EcoTrack/1.0'})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode())
    except Exception as e:
        return Response({'error': 'Food database unavailable: {}'.format(str(e))}, status=503)

    results = []
    if barcode:
        product = data.get('product', {})
        if product:
            results = [_format_food_product(product)]
    else:
        products = data.get('products', [])[:5]
        results = [_format_food_product(p) for p in products if p.get('product_name')]

    return Response({'results': results})


def _format_food_product(product):
    from core.emission_factors import FOOD
    from core.calculator import calculate_emission, get_severity

    name = product.get('product_name', 'Unknown product')
    categories = product.get('categories', '').lower()
    nutriscore = product.get('nutriscore_grade', '').upper()
    ecoscore_raw = product.get('ecoscore_grade', '').upper()
    ecoscore = '' if ecoscore_raw in ('', 'UNKNOWN', 'NOT-APPLICABLE', 'EN:UNKNOWN') else ecoscore_raw
    image = product.get('image_front_small_url', '')
    brands = product.get('brands', '')

    co2_per_kg = None
    category_map = {
        'beef': FOOD['beef'],
        'lamb': FOOD['lamb'],
        'chicken': FOOD['chicken'],
        'pork': FOOD['pork'],
        'fish': FOOD['fish'],
        'cheese': FOOD['cheese'],
        'milk': FOOD['dairy_milk'],
        'coffee': FOOD['coffee'],
        'rice': FOOD['rice'],
        'bread': FOOD['bread'],
        'vegetable': FOOD['vegetables'],
        'fruit': FOOD['fruits'],
        'tofu': FOOD['tofu'],
        'egg': FOOD['eggs'],
    }

    matched_type = 'vegetables'
    for keyword, co2 in category_map.items():
        if keyword in categories or keyword in name.lower():
            co2_per_kg = co2
            matched_type = keyword
            break

    if co2_per_kg is None:
        co2_per_kg = FOOD.get('vegetables', 2.0)

    kg_co2_per_100g = round(co2_per_kg * 0.1, 3)
    sev = get_severity(co2_per_kg)

    return {
        'name': name,
        'brand': brands,
        'nutriscore': nutriscore,
        'ecoscore': ecoscore,
        'image': image,
        'co2_per_kg': co2_per_kg,
        'co2_per_100g': kg_co2_per_100g,
        'matched_type': matched_type,
        'severity': sev,
        'tip': "Swap for legumes or vegetables to save up to {} kg CO2 per kg".format(round(co2_per_kg - 0.9, 1)) if co2_per_kg > 2 else "Good low-carbon choice!",
    }


# Weekly Report

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_weekly_report(request):
    from .report_generator import generate_pdf_report, send_report_email
    user = request.user
    try:
        pdf_bytes = generate_pdf_report(user)
        send_report_email(user, pdf_bytes)
        Achievement.objects.get_or_create(user=user, achievement_type='report_sent')
        return Response({'message': 'Weekly report sent to {}!'.format(user.email)})
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def download_report(request):
    from .report_generator import generate_pdf_report
    from django.http import HttpResponse
    user = request.user
    try:
        pdf_bytes = generate_pdf_report(user)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="ecotrack-report-{}.pdf"'.format(date.today())
        return response
    except Exception as e:
        return Response({'error': str(e)}, status=500)
