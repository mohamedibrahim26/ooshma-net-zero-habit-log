from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ActivityViewSet, GoalViewSet, StreakView,
    chat, food_scan, send_weekly_report, download_report
)

router = DefaultRouter()
router.register('activities', ActivityViewSet, basename='activity')
router.register('goals', GoalViewSet, basename='goal')
router.register('streak', StreakView, basename='streak')

urlpatterns = [
    path('', include(router.urls)),
    path('chat/', chat, name='chat'),
    path('food-scan/', food_scan, name='food_scan'),
    path('report/send/', send_weekly_report, name='send_report'),
    path('report/download/', download_report, name='download_report'),
]
