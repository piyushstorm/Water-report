from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, OTP, WaterUsage, Alert, IssueReport


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User admin"""
    
    list_display = ['email', 'name', 'role', 'is_active', 'is_staff', 'created_at']
    list_filter = ['role', 'is_active', 'is_staff', 'created_at']
    search_fields = ['email', 'name']
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('name', 'role')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password1', 'password2', 'role'),
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at', 'last_login']
    
    # Allow changing user role to admin from Django admin
    def save_model(self, request, obj, form, change):
        # If role is changed to admin, set is_staff to True
        if obj.role == 'admin':
            obj.is_staff = True
        super().save_model(request, obj, form, change)


@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):
    """OTP admin"""
    
    list_display = ['email', 'otp', 'purpose', 'is_verified', 'attempts', 'created_at', 'expires_at']
    list_filter = ['purpose', 'is_verified', 'created_at']
    search_fields = ['email', 'otp']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
    
    def has_add_permission(self, request):
        # Prevent manual OTP creation from admin
        return False


@admin.register(WaterUsage)
class WaterUsageAdmin(admin.ModelAdmin):
    """Water Usage admin"""
    
    list_display = ['user', 'usage', 'category', 'timestamp', 'location']
    list_filter = ['category', 'timestamp']
    search_fields = ['user__email', 'user__name', 'location']
    ordering = ['-timestamp']
    readonly_fields = ['created_at']
    date_hierarchy = 'timestamp'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('user')


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    """Alert admin"""
    
    list_display = ['user', 'alert_type', 'severity', 'status', 'created_at']
    list_filter = ['alert_type', 'severity', 'status', 'created_at']
    search_fields = ['user__email', 'user__name', 'message']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('user')
    
    actions = ['mark_as_read', 'mark_as_resolved']
    
    def mark_as_read(self, request, queryset):
        updated = queryset.update(status='read')
        self.message_user(request, f'{updated} alert(s) marked as read.')
    mark_as_read.short_description = 'Mark selected alerts as read'
    
    def mark_as_resolved(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(status='resolved', resolved_at=timezone.now())
        self.message_user(request, f'{updated} alert(s) marked as resolved.')
    mark_as_resolved.short_description = 'Mark selected alerts as resolved'




@admin.register(IssueReport)
class IssueReportAdmin(admin.ModelAdmin):
    """Issue Report admin"""
    
    list_display = ['user', 'problem_level', 'status', 'created_at', 'resolved_at']
    list_filter = ['problem_level', 'status', 'created_at']
    search_fields = ['user__email', 'user__name', 'problem_description']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'resolved_at']
    date_hierarchy = 'created_at'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('user')
    
    actions = ['mark_as_resolved', 'mark_as_pending']
    
    def mark_as_resolved(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(status='Resolved', resolved_at=timezone.now())
        self.message_user(request, f'{updated} issue report(s) marked as resolved.')
    mark_as_resolved.short_description = 'Mark selected reports as resolved'
    
    def mark_as_pending(self, request, queryset):
        updated = queryset.update(status='Pending', resolved_at=None)
        self.message_user(request, f'{updated} issue report(s) marked as pending.')
    mark_as_pending.short_description = 'Mark selected reports as pending'


# Customize admin site
admin.site.site_header = 'Water Usage Monitoring Admin'
admin.site.site_title = 'Water Usage Admin'
admin.site.index_title = 'Welcome to Water Usage Monitoring Administration'
