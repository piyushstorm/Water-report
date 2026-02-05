from django.urls import path, re_path
from . import views

urlpatterns = [
    # Authentication endpoints
    path('auth/send-otp/', views.send_otp, name='send_otp'),
    path('auth/verify-otp/', views.verify_otp, name='verify_otp'),
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
    path('auth/reset-password/', views.reset_password, name='reset_password'),
    path('auth/me/', views.get_current_user, name='current_user'),
    
    # Water usage endpoints
    path('usage/', views.create_water_usage, name='create_usage'),
    path('usage/list/', views.get_water_usage, name='get_usage'),
    path('usage/stats/', views.get_usage_stats, name='usage_stats'),
    
    # Alert endpoints
    path('alerts/', views.get_alerts, name='get_alerts'),
    path('alerts/<uuid:alert_id>/', views.update_alert, name='update_alert'),
    
    # With these two lines:
    path('reports/generate/', views.generate_report, name='generate_report_slash'),
    path('reports/generate', views.generate_report, name='generate_report_no_slash'),
    
    # Demo/simulation endpoints
    path('demo/simulate-usage/', views.simulate_usage, name='simulate_usage'),
    
    # Admin endpoints
    path('admin/users/', views.get_all_users, name='admin_users'),
    path('admin/stats/', views.get_admin_stats, name='admin_stats'),
    path('admin/usage/all/', views.get_all_usage, name='admin_all_usage'),
    path('admin/alerts/all/', views.get_all_alerts, name='admin_all_alerts'),
    path('admin/issues/', views.get_all_issue_reports, name='admin_all_issues'),
    path('admin/issues/<uuid:report_id>/', views.update_issue_report, name='update_issue'),
    
    # Issue report endpoints
    path('issues/', views.create_issue_report, name='create_issue'),
    path('issues/list/', views.get_user_issue_reports, name='user_issues'),
]