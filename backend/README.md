# Water Usage Monitoring System - Django Backend

A comprehensive Django REST API backend for the Water Usage Monitoring System with OTP-based authentication.

## 🏗️ Architecture

This is a **pure Django** project with the following structure:

```
django_backend/
├── manage.py                   # Django management script
├── backend_django/             # Main project configuration
│   ├── __init__.py
│   ├── settings.py            # Django settings (DATABASE, EMAIL, JWT, etc.)
│   ├── urls.py                # Main URL configuration
│   ├── wsgi.py                # WSGI application
│   └── asgi.py                # ASGI application
├── api/                        # Main application
│   ├── __init__.py
│   ├── models.py              # Database models (User, OTP, WaterUsage, Alert)
│   ├── views.py               # API endpoints
│   ├── urls.py                # API URL routing
│   ├── admin.py               # Django Admin configuration
│   ├── serializers.py         # DRF serializers
│   ├── emails.py              # Email utilities
│   ├── utils.py               # Helper functions (LeakageDetector, ReportGenerator)
│   └── migrations/            # Database migrations
├── db.sqlite3                  # SQLite database (auto-generated)
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables
└── setup.sh                    # Setup script

```

## 🚀 Features

### Authentication System with OTP
- ✅ **Registration with Email OTP** (6-digit, 10 minutes expiry, 3 max attempts)
- ✅ **Login** (JWT-based authentication)
- ✅ **Forgot Password with OTP** (Email verification + password reset)
- ✅ **User Roles** (user/admin - configurable via Django admin)

### Water Usage Monitoring
- ✅ Track water usage with automatic categorization (Normal/High/Critical)
- ✅ Leakage detection algorithm
- ✅ Usage statistics and trends
- ✅ Historical data analysis

### Alert System
- ✅ Real-time alerts for leakage detection
- ✅ High usage notifications
- ✅ Alert status management (new/read/resolved)

### Reporting
- ✅ Generate PDF reports
- ✅ Generate CSV exports
- ✅ Daily, weekly, and monthly reports

### Admin Features
- ✅ Django Admin portal for user management
- ✅ Change user roles (user ↔ admin)
- ✅ System-wide statistics
- ✅ Monitor all users' usage and alerts

## 📋 Prerequisites

- Python 3.8+
- Virtual environment (venv)
- Gmail account with App Password (for OTP emails)

## ⚙️ Installation & Setup

### 1. Activate Virtual Environment

```bash
cd /app
source venv/bin/activate
```

### 2. Install Dependencies

```bash
cd /app/django_backend
pip install -r requirements.txt
```

### 3. Configure Email Settings

**IMPORTANT:** Add your Gmail App Password to `.env` file:

1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to https://myaccount.google.com/apppasswords
4. Select 'Mail' and 'Other (Custom name)'
5. Enter 'Water Usage App'
6. Click 'Generate'
7. Copy the 16-character password
8. Edit `/app/django_backend/.env`:

```env
EMAIL_HOST_USER=piyubedekar13@gmail.com
EMAIL_HOST_PASSWORD=your-app-password-here
```

### 4. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Superuser (Admin)

```bash
python manage.py createsuperuser
```

Enter:
- Email: admin@example.com (or your preferred email)
- Name: Admin User
- Password: (your secure password)

### 6. Start Development Server

```bash
python manage.py runserver 0.0.0.0:8001
```

The API will be available at: `http://localhost:8001/api/`

### 7. Access Django Admin

Navigate to: `http://localhost:8001/admin/`

Login with your superuser credentials.

## 📡 API Endpoints

### Authentication

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/send-otp/` | POST | Send OTP to email | No |
| `/api/auth/verify-otp/` | POST | Verify OTP code | No |
| `/api/auth/register/` | POST | Complete registration | No |
| `/api/auth/login/` | POST | User login | No |
| `/api/auth/reset-password/` | POST | Reset password with OTP | No |
| `/api/auth/me/` | GET | Get current user | Yes |

### Water Usage

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/usage/` | POST | Create usage record | Yes |
| `/api/usage/list/` | GET | Get usage history | Yes |
| `/api/usage/stats/` | GET | Get usage statistics | Yes |

### Alerts

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/alerts/` | GET | Get user alerts | Yes |
| `/api/alerts/<id>/` | PATCH | Update alert status | Yes |

### Reports

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/reports/generate/` | GET | Generate PDF/CSV report | Yes |

### Demo/Simulation

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/demo/simulate-usage/` | POST | Generate test data | Yes |

### Admin (Admin Only)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/admin/users/` | GET | Get all users | Yes (Admin) |
| `/api/admin/stats/` | GET | System statistics | Yes (Admin) |
| `/api/admin/usage/all/` | GET | All users' usage | Yes (Admin) |
| `/api/admin/alerts/all/` | GET | All alerts | Yes (Admin) |

## 📝 API Usage Examples

### 1. Registration Flow (with OTP)

#### Step 1: Send OTP
```bash
curl -X POST http://localhost:8001/api/auth/send-otp/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "purpose": "registration"
  }'
```

#### Step 2: Verify OTP
```bash
curl -X POST http://localhost:8001/api/auth/verify-otp/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "123456",
    "purpose": "registration"
  }'
```

#### Step 3: Complete Registration
```bash
curl -X POST http://localhost:8001/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "123456",
    "name": "John Doe",
    "password": "securepass123"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:8001/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepass123"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "tokens": {
    "access": "jwt-access-token",
    "refresh": "jwt-refresh-token"
  }
}
```

### 3. Create Water Usage (Authenticated)

```bash
curl -X POST http://localhost:8001/api/usage/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "usage": 45.5,
    "location": "Kitchen"
  }'
```

### 4. Forgot Password Flow

#### Step 1: Send OTP
```bash
curl -X POST http://localhost:8001/api/auth/send-otp/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "purpose": "password_reset"
  }'
```

#### Step 2: Verify OTP
```bash
curl -X POST http://localhost:8001/api/auth/verify-otp/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "123456",
    "purpose": "password_reset"
  }'
```

#### Step 3: Reset Password
```bash
curl -X POST http://localhost:8001/api/auth/reset-password/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "123456",
    "new_password": "newsecurepass123"
  }'
```

## 🔐 Django Admin Portal

Access: `http://localhost:8001/admin/`

### Features:
- **User Management**: View, edit, and manage all users
- **Role Management**: Change user role from 'user' to 'admin'
- **OTP Management**: View OTP history and verification status
- **Usage Monitoring**: View all water usage records
- **Alert Management**: Manage and resolve alerts
- **Bulk Actions**: Mark multiple alerts as read/resolved

### Changing User to Admin:
1. Login to Django Admin
2. Go to "Users"
3. Click on the user
4. Change "Role" dropdown to "Admin"
5. Check "Staff status" checkbox
6. Save

## 🗄️ Database Models

### User Model
- UUID-based primary key
- Email-based authentication
- Roles: user/admin
- Password hashing with bcrypt

### OTP Model
- Purpose: registration/password_reset
- 6-digit code
- 10-minute expiration
- 3 max attempts
- Auto-invalidation of old OTPs

### WaterUsage Model
- User relationship
- Usage in liters
- Category: Normal/High/Critical
- Timestamp and location

### Alert Model
- User relationship
- Alert types: leakage/high_usage/monthly_summary
- Severity levels: low/medium/high/critical
- Status: new/read/resolved

## 🧪 Testing

### Test Registration with OTP:
1. Start the server
2. Send OTP to your email
3. Check your email for the OTP code
4. Verify and complete registration
5. Login with credentials

### Test Water Usage:
1. Login to get access token
2. Create usage records
3. Check for leakage detection
4. View statistics

### Test Admin Features:
1. Login to Django Admin
2. Create additional users
3. Change user roles
4. View system statistics

## 📊 OTP Configuration

In `settings.py`:

```python
# OTP Configuration
OTP_EXPIRY_MINUTES = 10
OTP_LENGTH = 6
OTP_MAX_ATTEMPTS = 3
```

## 🔧 Troubleshooting

### Email not sending:
- Verify Gmail App Password is correct
- Check if 2-Step Verification is enabled
- Ensure no spaces in the app password
- Check `.env` file format

### Database errors:
```bash
python manage.py migrate --run-syncdb
```

### Port already in use:
```bash
python manage.py runserver 0.0.0.0:8002  # Use different port
```

## 📦 Dependencies

- Django 5.0.1
- Django REST Framework 3.14.0
- djangorestframework-simplejwt 5.3.1
- django-cors-headers 4.3.1
- Pillow 10.2.0
- reportlab 4.1.0
- python-dotenv 1.0.1

## 🌐 CORS Configuration

CORS is configured to allow all origins in development. For production:

Edit `settings.py`:
```python
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'https://your-frontend-domain.com',
]
```

## 🔒 Security Notes

1. **Change Django SECRET_KEY** in production
2. Set **DEBUG = False** in production
3. Use environment variables for sensitive data
4. Implement rate limiting for OTP endpoints
5. Use HTTPS in production
6. Regularly rotate JWT secrets

## 📄 License

This project is part of the Water Usage Monitoring System.

## 👨‍💻 Developer Notes

- All models use UUID as primary key (no MongoDB ObjectId issues)
- JWT tokens expire after 24 hours
- OTP emails are sent via Gmail SMTP
- SQLite database is used (easily portable)
- Django admin is fully configured
- All endpoints return consistent JSON responses

## 🆘 Support

For issues or questions:
1. Check logs: Django automatically logs to console
2. Check database: `python manage.py dbshell`
3. Check migrations: `python manage.py showmigrations`
4. Reset database: Delete `db.sqlite3` and run migrations again

---

**Built with Django + DRF + SQLite + Python** 🐍
