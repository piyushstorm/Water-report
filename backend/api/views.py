from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db.models import Sum, Avg, Count, Q
from django.conf import settings
from datetime import timedelta, datetime
import logging

from .models import User, OTP, WaterUsage, Alert, IssueReport
from .serializers import (
    UserSerializer, SendOTPSerializer, VerifyOTPSerializer,
    CompleteRegistrationSerializer, LoginSerializer, PasswordResetSerializer,
    WaterUsageSerializer, WaterUsageCreateSerializer, AlertSerializer, AlertUpdateSerializer,
    IssueReportSerializer, IssueReportCreateSerializer, IssueReportUpdateSerializer
)
from .emails import send_otp_email, send_welcome_email
from .utils import categorize_usage, LeakageDetector, ReportGenerator

logger = logging.getLogger(__name__)


# ==================== HELPER FUNCTIONS ====================

def get_tokens_for_user(user):
    """Generate JWT tokens for user"""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


def create_alert(user, alert_type, severity, message):
    """Create an alert for user"""
    return Alert.objects.create(
        user=user,
        alert_type=alert_type,
        severity=severity,
        message=message
    )


# ==================== AUTH ENDPOINTS ====================

@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    """
    Send OTP to email for registration or password reset
    POST /api/auth/send-otp/
    Body: { "email": "user@example.com", "purpose": "registration" }
    """
    serializer = SendOTPSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    purpose = serializer.validated_data['purpose']
    
    # For registration, check if user already exists
    if purpose == 'registration':
        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'User with this email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # For password reset, check if user exists
    if purpose == 'password_reset':
        if not User.objects.filter(email=email).exists():
            return Response(
                {'error': 'No user found with this email'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    # Create OTP
    otp_obj = OTP.create_otp(email, purpose)
    
    # Send email
    email_sent = send_otp_email(email, otp_obj.otp, purpose)
    
    if not email_sent:
        return Response(
            {'error': 'Failed to send OTP email. Please check email configuration.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return Response({
        'success': True,
        'message': f'OTP sent to {email}',
        'expires_in_minutes': settings.OTP_EXPIRY_MINUTES
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    """
    Verify OTP without completing registration
    POST /api/auth/verify-otp/
    Body: { "email": "user@example.com", "otp": "123456", "purpose": "registration" }
    """
    serializer = VerifyOTPSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    otp_code = serializer.validated_data['otp']
    purpose = serializer.validated_data['purpose']
    
    otp_obj = OTP.objects.filter(
        email=email,
        purpose=purpose,
        is_verified=False
        ).order_by('-created_at').first()
    
    if not otp_obj:
        return Response(
            {'error': 'OTP not found. Please request a new OTP.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    
    # Check if OTP is expired
    if otp_obj.is_expired():
        return Response(
            {'error': 'OTP has expired. Please request a new one.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check max attempts
    if otp_obj.attempts >= settings.OTP_MAX_ATTEMPTS:
        return Response(
            {'error': 'Maximum verification attempts exceeded. Please request a new OTP.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Increment attempts
    otp_obj.attempts += 1
    otp_obj.save()

    # 🔥 ALWAYS compare as string
    if str(otp_obj.otp) != str(otp_code):
        return Response(
            {
                'error': f'Invalid OTP. {settings.OTP_MAX_ATTEMPTS - otp_obj.attempts} attempts remaining.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    
    # Mark as verified
    otp_obj.is_verified = True
    otp_obj.save()

    
    return Response({
        'success': True,
        'message': 'OTP verified successfully',
        'email': email
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = CompleteRegistrationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email']
    otp_code = serializer.validated_data['otp']
    name = serializer.validated_data['name']
    password = serializer.validated_data['password']

    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'User already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )

    otp_obj = OTP.objects.filter(
        email=email,
        purpose='registration',
        is_verified=True
    ).order_by('-created_at').first()

    if not otp_obj or str(otp_obj.otp) != str(otp_code):
        return Response(
            {'error': 'Invalid or unverified OTP. Please verify OTP first.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if timezone.now() > otp_obj.expires_at:
        return Response(
            {'error': 'OTP has expired. Please request a new one.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = User.objects.create_user(
        email=email,
        name=name,
        password=password,
        role='user'
    )

    send_welcome_email(email, name)

    tokens = get_tokens_for_user(user)

    return Response(
        {
            'success': True,
            'message': 'Registration successful',
            'user': UserSerializer(user).data,
            'tokens': tokens
        },
        status=status.HTTP_201_CREATED
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    User login
    POST /api/auth/login/
    Body: { "email": "user@example.com", "password": "pass123" }
    """
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    password = serializer.validated_data['password']
    
    # Get user
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'Invalid email or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Check password
    if not user.check_password(password):
        return Response(
            {'error': 'Invalid email or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Check if user is active
    if not user.is_active:
        return Response(
            {'error': 'Account is disabled'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Generate tokens
    tokens = get_tokens_for_user(user)
    
    return Response({
        'success': True,
        'message': 'Login successful',
        'user': UserSerializer(user).data,
        'tokens': tokens
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    serializer = PasswordResetSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email']
    otp_code = serializer.validated_data['otp']
    new_password = serializer.validated_data['new_password']

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    otp_obj = OTP.objects.filter(
        email=email,
        purpose='password_reset',
        is_verified=True
    ).order_by('-created_at').first()

    if not otp_obj or str(otp_obj.otp) != str(otp_code):
        return Response(
            {'error': 'Invalid or unverified OTP'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if timezone.now() > otp_obj.expires_at:
        return Response(
            {'error': 'OTP has expired. Please request a new one.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Update password
    user.set_password(new_password)
    user.save()

    # 🔥 Invalidate OTP after use
    otp_obj.delete()

    return Response(
        {
            'success': True,
            'message': 'Password reset successful'
        },
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """
    Get current authenticated user
    GET /api/auth/me/
    """
    return Response({
        'user': UserSerializer(request.user).data
    }, status=status.HTTP_200_OK)


# ==================== WATER USAGE ENDPOINTS ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_water_usage(request):
    """
    Create water usage record
    POST /api/usage/
    Body: { "usage": 50.5, "timestamp": "2024-01-01T10:00:00Z", "location": "Kitchen" }
    """
    serializer = WaterUsageCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    usage_value = serializer.validated_data['usage']
    timestamp = serializer.validated_data.get('timestamp', timezone.now())
    location = serializer.validated_data.get('location', '')
    
    # Get historical average
    historical_usage = WaterUsage.objects.filter(user=request.user)
    avg_usage = historical_usage.aggregate(Avg('usage'))['usage__avg'] or 100.0
    
    # Categorize usage
    category = categorize_usage(usage_value, avg_usage)
    
    # Create usage record
    water_usage = WaterUsage.objects.create(
        user=request.user,
        usage=usage_value,
        category=category,
        timestamp=timestamp,
        location=location
    )
    
    # Run leakage detection
    recent_usage = WaterUsage.objects.filter(user=request.user).order_by('-timestamp')[:24]
    analysis = LeakageDetector.analyze_usage(
        user_id=str(request.user.id),
        current_usage=usage_value,
        recent_usage=list(recent_usage),
        historical_avg=avg_usage
    )
    
    # Create alerts if issues detected
    if analysis['has_issues']:
        for issue in analysis['issues']:
            create_alert(
                user=request.user,
                alert_type='leakage' if 'leak' in issue.lower() else 'high_usage',
                severity=analysis['severity'],
                message=issue
            )
    
    return Response({
        'success': True,
        'usage': WaterUsageSerializer(water_usage).data,
        'analysis': analysis
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_water_usage(request):
    """
    Get user's water usage history
    GET /api/usage/?limit=100&days=30
    """
    limit = int(request.GET.get('limit', 100))
    days = request.GET.get('days')
    
    queryset = WaterUsage.objects.filter(user=request.user).order_by('-timestamp')
    
    # Filter by days if specified
    if days:
        start_date = timezone.now() - timedelta(days=int(days))
        queryset = queryset.filter(timestamp__gte=start_date)
    
    usage_records = queryset[:limit]
    
    return Response({
        'usage': WaterUsageSerializer(usage_records, many=True).data,
        'count': usage_records.count()
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_usage_stats(request):
    """
    Get usage statistics
    GET /api/usage/stats/
    """
    user_usage = WaterUsage.objects.filter(user=request.user)
    
    if not user_usage.exists():
        return Response({
            'total_usage': 0,
            'average_daily': 0,
            'current_month': 0,
            'last_month': 0,
            'trend': 'stable',
            'total_records': 0
        }, status=status.HTTP_200_OK)
    
    # Total usage
    total_usage = user_usage.aggregate(Sum('usage'))['usage__sum'] or 0
    
    # Current month
    now = timezone.now()
    current_month_usage = user_usage.filter(
        timestamp__year=now.year,
        timestamp__month=now.month
    ).aggregate(Sum('usage'))['usage__sum'] or 0
    
    # Last month
    last_month = now.month - 1 if now.month > 1 else 12
    last_month_year = now.year if now.month > 1 else now.year - 1
    last_month_usage = user_usage.filter(
        timestamp__year=last_month_year,
        timestamp__month=last_month
    ).aggregate(Sum('usage'))['usage__sum'] or 0
    
    # Calculate trend
    if last_month_usage > 0:
        change = ((current_month_usage - last_month_usage) / last_month_usage) * 100
        if change > 10:
            trend = "increasing"
        elif change < -10:
            trend = "decreasing"
        else:
            trend = "stable"
    else:
        trend = "stable"
    
    # Average daily
    total_days = (now - user_usage.order_by('timestamp').first().timestamp).days + 1
    average_daily = total_usage / total_days if total_days > 0 else 0
    
    return Response({
        'total_usage': round(total_usage, 2),
        'average_daily': round(average_daily, 2),
        'current_month': round(current_month_usage, 2),
        'last_month': round(last_month_usage, 2),
        'trend': trend,
        'total_records': user_usage.count()
    }, status=status.HTTP_200_OK)


# ==================== ALERT ENDPOINTS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_alerts(request):
    """
    Get user's alerts
    GET /api/alerts/?status=new
    """
    status_filter = request.GET.get('status')
    
    queryset = Alert.objects.filter(user=request.user).order_by('-created_at')
    
    if status_filter:
        queryset = queryset.filter(status=status_filter)
    
    alerts = queryset[:100]
    
    return Response({
        'alerts': AlertSerializer(alerts, many=True).data,
        'count': alerts.count()
    }, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_alert(request, alert_id):
    """
    Update alert status
    PATCH /api/alerts/<alert_id>/
    Body: { "status": "read" or "resolved" }
    """
    try:
        alert = Alert.objects.get(id=alert_id, user=request.user)
    except Alert.DoesNotExist:
        return Response(
            {'error': 'Alert not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = AlertUpdateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    alert.status = serializer.validated_data['status']
    if alert.status == 'resolved':
        alert.resolved_at = timezone.now()
    alert.save()
    
    return Response({
        'success': True,
        'message': 'Alert updated successfully',
        'alert': AlertSerializer(alert).data
    }, status=status.HTTP_200_OK)


# ==================== REPORT ENDPOINTS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_report(request):
    """
    Generate usage report
    GET /api/reports/generate/?report_type=monthly&format=pdf
    """
    from django.http import HttpResponse

    report_type = request.GET.get('report_type', 'monthly')
    format_type = request.GET.get('format', 'pdf')

    # Determine range
    days_map = {
        'daily': 1,
        'weekly': 7,
        'monthly': 30
    }
    days = days_map.get(report_type, 30)

    start_date = timezone.now() - timedelta(days=days)

    usage_data = WaterUsage.objects.filter(
        user=request.user,
        timestamp__gte=start_date
    ).order_by('-timestamp')
    
    if not usage_data.exists():
        if format_type == 'pdf':
            response = HttpResponse(
                b"No usage data available for this period.",
                content_type='application/pdf'
            )
            response['Content-Disposition'] = (
                f'attachment; filename="water_usage_{report_type}.pdf"'
            )
            return response

        response = HttpResponse(
            "No usage data available for this period.",
            content_type='text/csv'
        )
        response['Content-Disposition'] = (
            f'attachment; filename="water_usage_{report_type}.csv"'
        )
        return response


    user_data = {
        'name': request.user.name,
        'email': request.user.email
    }

    # ---------- PDF ----------
    if format_type == 'pdf':
        pdf_buffer = ReportGenerator.generate_pdf_report(
            user_data=user_data,
            usage_data=list(usage_data),
            report_type=report_type
        )

        response = HttpResponse(
            pdf_buffer.getvalue(),
            content_type='application/pdf'
        )
        response['Content-Disposition'] = (
            f'attachment; filename="water_usage_{report_type}.pdf"'
        )
        response['Content-Length'] = len(pdf_buffer.getvalue())
        return response

    # ---------- CSV ----------
    csv_content = ReportGenerator.generate_csv_report(list(usage_data))

    response = HttpResponse(csv_content, content_type='text/csv')
    response['Content-Disposition'] = (
        f'attachment; filename="water_usage_{report_type}.csv"'
    )
    return response


# ==================== DEMO/SIMULATION ENDPOINTS ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def simulate_usage(request):
    """
    Simulate water usage data for testing
    POST /api/demo/simulate-usage/?days=7
    """
    import random
    
    days = int(request.GET.get('days', 7))
    records_created = []
    
    for day in range(days):
        # Generate 4 readings per day (every 6 hours)
        for hour in [0, 6, 12, 18]:
            timestamp = timezone.now() - timedelta(days=days-day, hours=24-hour)
            
            # Simulate realistic usage patterns
            base_usage = random.uniform(15, 35)
            
            # Add night spike for leak simulation (occasionally)
            if hour == 0 and random.random() < 0.2:
                base_usage = random.uniform(40, 80)
            
            # Random high usage
            if random.random() < 0.1:
                base_usage = random.uniform(80, 150)
            
            water_usage = WaterUsage.objects.create(
                user=request.user,
                usage=round(base_usage, 2),
                category=categorize_usage(base_usage,100),
                timestamp=timestamp,
                location='Main Meter'
            )
            records_created.append(water_usage)
    
    return Response({
        'success': True,
        'message': f'Simulated {len(records_created)} usage records',
        'records': len(records_created)
    }, status=status.HTTP_201_CREATED)


# ==================== ADMIN ENDPOINTS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_users(request):
    """
    Get all users (admin only)
    GET /api/admin/users/
    """
    if not request.user.is_admin and not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    users = User.objects.all().order_by('-created_at')
    return Response({
        'users': UserSerializer(users, many=True).data,
        'count': users.count()
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_admin_stats(request):
    """
    Get system-wide statistics (admin only)
    GET /api/admin/stats/
    """
    if not request.user.is_admin and not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Total users
    total_users = User.objects.count()
    
    # Total usage
    total_usage = WaterUsage.objects.aggregate(Sum('usage'))['usage__sum'] or 0
    
    # Active alerts
    active_alerts = Alert.objects.filter(~Q(status='resolved')).count()
    
    # Leakage reports
    leak_alerts = Alert.objects.filter(alert_type='leakage').count()
    
    # Usage by category
    usage_distribution = WaterUsage.objects.values('category').annotate(count=Count('id'))
    distribution_dict = {item['category']: item['count'] for item in usage_distribution}
    
    return Response({
        'total_users': total_users,
        'total_water_usage': round(total_usage, 2),
        'active_alerts': active_alerts,
        'leak_reports': leak_alerts,
        'usage_distribution': {
            'critical': distribution_dict.get('Critical', 0),
            'high': distribution_dict.get('High', 0),
            'normal': distribution_dict.get('Normal', 0)
        },
        'total_records': WaterUsage.objects.count()
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_usage(request):
    """
    Get all users' usage (admin only)
    GET /api/admin/usage/all/?limit=100
    """
    if not request.user.is_admin and not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    limit = int(request.GET.get('limit', 100))
    usage_records = WaterUsage.objects.all().order_by('-timestamp')[:limit]
    
    return Response({
        'usage': WaterUsageSerializer(usage_records, many=True).data,
        'count': usage_records.count()
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_alerts(request):
    """
    Get all alerts (admin only)
    GET /api/admin/alerts/all/
    """
    if not request.user.is_admin and not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    alerts = Alert.objects.all().order_by('-created_at')[:500]
    
    return Response({
        'alerts': AlertSerializer(alerts, many=True).data,
        'count': alerts.count()
    }, status=status.HTTP_200_OK)



# ==================== ISSUE REPORT ENDPOINTS ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_issue_report(request):
    """
    Create a new issue report
    POST /api/issues/
    Body: { "problem_description": "...", "problem_level": "Low|Medium|High" }
    """
    serializer = IssueReportCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    issue_report = IssueReport.objects.create(
        user=request.user,
        problem_description=serializer.validated_data['problem_description'],
        problem_level=serializer.validated_data['problem_level']
    )
    
    logger.info(f"Issue report created by user {request.user.email}: {issue_report.id}")
    
    return Response({
        'success': True,
        'message': 'Issue report submitted successfully',
        'report': IssueReportSerializer(issue_report).data
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_issue_reports(request):
    """
    Get all issue reports for the current user
    GET /api/issues/
    """
    reports = IssueReport.objects.filter(user=request.user).order_by('-created_at')
    
    return Response({
        'reports': IssueReportSerializer(reports, many=True).data,
        'count': reports.count()
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_issue_reports(request):
    """
    Get all issue reports (admin only)
    GET /api/admin/issues/
    """
    if not request.user.is_admin and not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    reports = IssueReport.objects.all().order_by('-created_at')
    
    # Filter by status if provided
    status_filter = request.query_params.get('status')
    if status_filter:
        reports = reports.filter(status=status_filter)
    
    return Response({
        'reports': IssueReportSerializer(reports, many=True).data,
        'count': reports.count(),
        'pending_count': IssueReport.objects.filter(status='Pending').count(),
        'resolved_count': IssueReport.objects.filter(status='Resolved').count()
    }, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_issue_report(request, report_id):
    """
    Update issue report status (admin only)
    PATCH /api/admin/issues/<report_id>/
    Body: { "status": "Pending|Resolved" }
    """
    if not request.user.is_admin and not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        report = IssueReport.objects.get(id=report_id)
    except IssueReport.DoesNotExist:
        return Response(
            {'error': 'Issue report not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = IssueReportUpdateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    new_status = serializer.validated_data['status']
    report.status = new_status
    
    # Set resolved_at timestamp if marking as resolved
    if new_status == 'Resolved' and not report.resolved_at:
        report.resolved_at = timezone.now()
    elif new_status == 'Pending':
        report.resolved_at = None
    
    report.save()
    
    logger.info(f"Issue report {report_id} updated to {new_status} by {request.user.email}")
    
    return Response({
        'success': True,
        'message': f'Issue report marked as {new_status}',
        'report': IssueReportSerializer(report).data
    }, status=status.HTTP_200_OK)

