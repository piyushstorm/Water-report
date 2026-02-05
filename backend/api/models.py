from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from datetime import timedelta
import uuid


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication"""
    
    def create_user(self, email, name, password=None, **extra_fields):
        """Create and return a regular user"""
        if not email:
            raise ValueError('Users must have an email address')
        
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, name, password=None, **extra_fields):
        """Create and return a superuser"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model"""
    
    ROLE_CHOICES = [
        ('user', 'User'),
        ('admin', 'Admin'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, max_length=255)
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.email
    
    @property
    def is_admin(self):
        return self.role == 'admin'


class OTP(models.Model):
    """OTP model for email verification"""
    
    PURPOSE_CHOICES = [
        ('registration', 'Registration'),
        ('password_reset', 'Password Reset'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(max_length=255)
    otp = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)
    attempts = models.IntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        db_table = 'otps'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.email} - {self.otp} ({self.purpose})"
    
    def is_expired(self):
        """Check if OTP is expired"""
        return timezone.now() > self.expires_at
    
    def is_valid(self):
        """Check if OTP is valid"""
        return not self.is_expired() and not self.is_verified and self.attempts < 3
    
    @classmethod
    def create_otp(cls, email, purpose='registration'):
        """Create a new OTP"""
        from django.conf import settings
        import random
        
        # Generate 6-digit OTP
        otp = ''.join([str(random.randint(0, 9)) for _ in range(settings.OTP_LENGTH)])
        
        # Set expiry time
        expires_at = timezone.now() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
        
        # Deactivate old OTPs for this email and purpose
        cls.objects.filter(email=email, purpose=purpose, is_verified=False).update(is_verified=True)
        
        # Create new OTP
        return cls.objects.create(
            email=email,
            otp=otp,
            purpose=purpose,
            expires_at=expires_at
        )


class WaterUsage(models.Model):
    """Water usage records"""
    
    CATEGORY_CHOICES = [
        ('Normal', 'Normal'),
        ('High', 'High'),
        ('Critical', 'Critical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='water_usage')
    usage = models.FloatField()  # in liters
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES, default='Normal')
    timestamp = models.DateTimeField(default=timezone.now)
    location = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'water_usage'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['category']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.usage}L ({self.category})"


class Alert(models.Model):
    """Alert notifications"""
    
    ALERT_TYPE_CHOICES = [
        ('leakage', 'Leakage'),
        ('high_usage', 'High Usage'),
        ('monthly_summary', 'Monthly Summary'),
    ]
    
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('new', 'New'),
        ('read', 'Read'),
        ('resolved', 'Resolved'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='alerts')
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPE_CHOICES)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    message = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='new')
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'alerts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['alert_type']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.alert_type} ({self.severity})"



class IssueReport(models.Model):
    """User issue reports"""
    
    LEVEL_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
    ]
    
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Resolved', 'Resolved'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='issue_reports')
    problem_description = models.TextField()
    problem_level = models.CharField(max_length=10, choices=LEVEL_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'issue_reports'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['problem_level']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.problem_level} ({self.status})"
