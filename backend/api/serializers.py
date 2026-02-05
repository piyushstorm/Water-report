from rest_framework import serializers
from .models import User, OTP, WaterUsage, Alert, IssueReport


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'role', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserRegistrationSerializer(serializers.Serializer):
    """Serializer for user registration"""
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(choices=['user', 'admin'], default='user')


class SendOTPSerializer(serializers.Serializer):
    """Serializer for sending OTP"""
    email = serializers.EmailField()
    purpose = serializers.ChoiceField(choices=['registration', 'password_reset'], default='registration')


class VerifyOTPSerializer(serializers.Serializer):
    """Serializer for verifying OTP"""
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6, min_length=6)
    purpose = serializers.ChoiceField(choices=['registration', 'password_reset'])


class CompleteRegistrationSerializer(serializers.Serializer):
    """Serializer for completing registration after OTP verification"""
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6, min_length=6)
    name = serializers.CharField(max_length=255)
    password = serializers.CharField(write_only=True, min_length=6)


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class PasswordResetSerializer(serializers.Serializer):
    """Serializer for password reset"""
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6, min_length=6)
    new_password = serializers.CharField(write_only=True, min_length=6)


class WaterUsageSerializer(serializers.ModelSerializer):
    """Serializer for WaterUsage model"""
    
    class Meta:
        model = WaterUsage
        fields = ['id', 'user', 'usage', 'category', 'timestamp', 'location', 'created_at']
        read_only_fields = ['id', 'user', 'category', 'created_at']


class WaterUsageCreateSerializer(serializers.Serializer):
    """Serializer for creating water usage record"""
    usage = serializers.FloatField(min_value=0.01)
    timestamp = serializers.DateTimeField(required=False)
    location = serializers.CharField(max_length=255, required=False, allow_blank=True)


class AlertSerializer(serializers.ModelSerializer):
    """Serializer for Alert model"""
    
    class Meta:
        model = Alert
        fields = ['id', 'user', 'alert_type', 'severity', 'message', 'status', 'created_at', 'resolved_at']
        read_only_fields = ['id', 'user', 'created_at']


class AlertUpdateSerializer(serializers.Serializer):
    """Serializer for updating alert status"""
    status = serializers.ChoiceField(choices=['read', 'resolved'])




class IssueReportSerializer(serializers.ModelSerializer):
    """Serializer for IssueReport model"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    
    class Meta:
        model = IssueReport
        fields = ['id', 'user', 'user_email', 'user_name', 'problem_description', 
                  'problem_level', 'status', 'created_at', 'resolved_at']
        read_only_fields = ['id', 'user', 'status', 'created_at', 'resolved_at']


class IssueReportCreateSerializer(serializers.Serializer):
    """Serializer for creating issue report"""
    problem_description = serializers.CharField()
    problem_level = serializers.ChoiceField(choices=['Low', 'Medium', 'High'])


class IssueReportUpdateSerializer(serializers.Serializer):
    """Serializer for updating issue report status"""
    status = serializers.ChoiceField(choices=['Pending', 'Resolved'])
