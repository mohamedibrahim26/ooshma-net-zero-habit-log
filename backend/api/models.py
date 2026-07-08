from django.db import models
from django.conf import settings


class Activity(models.Model):
    CATEGORY_CHOICES = [
        ('transport', 'Transport'),
        ('energy', 'Energy'),
        ('food', 'Food'),
        ('shopping', 'Shopping'),
        ('waste', 'Waste'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activities')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    activity_type = models.CharField(max_length=50)
    quantity = models.FloatField(help_text='Amount in relevant unit (km, kWh, kg, units)')
    unit = models.CharField(max_length=20, default='units')
    kg_co2 = models.FloatField(help_text='Calculated kg CO2e')
    severity = models.CharField(max_length=10, default='low')
    notes = models.TextField(blank=True)
    logged_at = models.DateTimeField(auto_now_add=True)
    activity_date = models.DateField()

    class Meta:
        ordering = ['-activity_date', '-logged_at']

    def __str__(self):
        return f"{self.user.email} | {self.category}/{self.activity_type} | {self.kg_co2}kg CO2"


class Goal(models.Model):
    PERIOD_CHOICES = [('monthly', 'Monthly'), ('yearly', 'Yearly')]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=100)
    target_kg = models.FloatField()
    period = models.CharField(max_length=10, choices=PERIOD_CHOICES, default='monthly')
    start_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} | {self.title} | {self.target_kg}kg"


class Streak(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='streak')
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_logged_date = models.DateField(null=True, blank=True)
    total_days_logged = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user.email} | streak={self.current_streak}"


class Achievement(models.Model):
    ACHIEVEMENT_TYPES = [
        ('first_log', 'First Step'),
        ('streak_3', '3-Day Streak'),
        ('streak_7', 'Week Warrior'),
        ('streak_30', 'Month Master'),
        ('low_impact_week', 'Green Week'),
        ('logged_10', 'Consistent Logger'),
        ('logged_50', 'Carbon Conscious'),
        ('goal_achieved', 'Goal Crusher'),
        ('food_scanner', 'Food Detective'),
        ('report_sent', 'Report Sender'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='achievements')
    achievement_type = models.CharField(max_length=30)
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'achievement_type']
        ordering = ['-unlocked_at']

    def __str__(self):
        return f"{self.user.email} | {self.achievement_type}"
