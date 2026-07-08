from django.contrib import admin
from .models import Activity


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ['user', 'category', 'activity_type', 'quantity', 'unit', 'kg_co2', 'severity', 'activity_date']
    list_filter = ['category', 'severity', 'activity_date']
    search_fields = ['user__email', 'activity_type']
