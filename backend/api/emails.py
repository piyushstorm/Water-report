from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def send_otp_email(email, otp, purpose='registration'):
    """
    Send OTP email to user
    
    Args:
        email: Recipient email address
        otp: OTP code
        purpose: Purpose of OTP (registration or password_reset)
    """
    
    if purpose == 'registration':
        subject = 'Verify Your Email - Water Usage Monitoring'
        message = f"""
Hello,

Thank you for registering with Water Usage Monitoring System.

Your OTP for email verification is: {otp}

This OTP is valid for {settings.OTP_EXPIRY_MINUTES} minutes.

If you didn't request this, please ignore this email.

Best regards,
Water Usage Monitoring Team
        """
    else:  # password_reset
        subject = 'Reset Your Password - Water Usage Monitoring'
        message = f"""
Hello,

You have requested to reset your password.

Your OTP for password reset is: {otp}

This OTP is valid for {settings.OTP_EXPIRY_MINUTES} minutes.

If you didn't request this, please ignore this email and your password will remain unchanged.

Best regards,
Water Usage Monitoring Team
        """
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        logger.info(f"OTP email sent successfully to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send OTP email to {email}: {str(e)}")
        return False


def send_welcome_email(email, name):
    """Send welcome email after successful registration"""
    
    subject = 'Welcome to Water Usage Monitoring System'
    message = f"""
Hello {name},

Welcome to Water Usage Monitoring System!

Your account has been successfully created. You can now log in and start monitoring your water usage.

Features available:
- Track your daily water usage
- Get alerts for unusual consumption patterns
- Detect potential leaks
- Generate usage reports
- View statistics and trends

Thank you for joining us!

Best regards,
Water Usage Monitoring Team
    """
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=True,
        )
        logger.info(f"Welcome email sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send welcome email to {email}: {str(e)}")
