from rest_framework import serializers
from django.db.models import Sum
from django.utils import timezone
from datetime import date
from .models import Activity, Goal, Streak, Achievement
from core.calculator import calculate_emission, get_severity


class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = [
            'id', 'category', 'activity_type', 'quantity', 'unit',
            'kg_co2', 'severity', 'notes', 'logged_at', 'activity_date'
        ]
        read_only_fields = ['id', 'kg_co2', 'severity', 'logged_at']

    def validate(self, data):
        try:
            kg = calculate_emission(data['category'], data['activity_type'], data['quantity'])
        except ValueError as e:
            raise serializers.ValidationError(str(e))
        data['kg_co2'] = kg
        data['severity'] = get_severity(kg)
        return data

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


ACHIEVEMENT_LABELS = {
    'first_log': 'First Step',
    'streak_3': '3-Day Streak',
    'streak_7': 'Week Warrior',
    'streak_30': 'Month Master',
    'low_impact_week': 'Green Week',
    'logged_10': 'Consistent Logger',
    'logged_50': 'Carbon Conscious',
    'goal_achieved': 'Goal Crusher',
    'food_scanner': 'Food Detective',
    'report_sent': 'Report Sender',
}

ACHIEVEMENT_ICONS = {
    'first_log': 'plant',
    'streak_3': 'fire',
    'streak_7': 'lightning',
    'streak_30': 'trophy',
    'low_impact_week': 'leaf',
    'logged_10': 'clipboard',
    'logged_50': 'muscle',
    'goal_achieved': 'target',
    'food_scanner': 'magnifier',
    'report_sent': 'email',
}


class AchievementSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()
    icon = serializers.SerializerMethodField()

    class Meta:
        model = Achievement
        fields = ['id', 'achievement_type', 'label', 'icon', 'unlocked_at']

    def get_label(self, obj):
        return ACHIEVEMENT_LABELS.get(obj.achievement_type, obj.achievement_type)

    def get_icon(self, obj):
        return ACHIEVEMENT_ICONS.get(obj.achievement_type, 'star')


class StreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = Streak
        fields = ['current_streak', 'longest_streak', 'last_logged_date', 'total_days_logged']


class GoalSerializer(serializers.ModelSerializer):
    current_kg = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()
    remaining_kg = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Goal
        fields = [
            'id', 'title', 'target_kg', 'period', 'start_date', 'is_active', 'created_at',
            'current_kg', 'progress_percent', 'remaining_kg', 'status'
        ]
        read_only_fields = ['id', 'created_at']

    def _get_current_kg(self, obj):
        today = date.today()
        if obj.period == 'monthly':
            start = today.replace(day=1)
        else:
            start = today.replace(month=1, day=1)
        result = Activity.objects.filter(
            user=obj.user,
            activity_date__gte=start,
            activity_date__lte=today
        ).aggregate(t=Sum('kg_co2'))['t'] or 0
        return round(result, 2)

    def get_current_kg(self, obj):
        return self._get_current_kg(obj)

    def get_progress_percent(self, obj):
        current = self._get_current_kg(obj)
        if obj.target_kg == 0:
            return 0
        return round(min((current / obj.target_kg) * 100, 100), 1)

    def get_remaining_kg(self, obj):
        current = self._get_current_kg(obj)
        return round(max(obj.target_kg - current, 0), 2)

    def get_status(self, obj):
        pct = self.get_progress_percent(obj)
        if pct >= 100:
            return 'exceeded'
        if pct >= 75:
            return 'warning'
        return 'on_track'
