# 🚀 COMPLETE SETUP GUIDE - Django + React + SQLite

## Water Usage Monitoring System

This guide will help you set up the complete application with Django backend and React frontend.

---

## 📁 Project Structure

```
/app/
├── venv/                      # Python virtual environment
├── django_backend/            # Django backend (NEW)
│   ├── manage.py
│   ├── backend_django/        # Project configuration
│   ├── api/                   # Main app
│   ├── db.sqlite3            # SQLite database
│   ├── requirements.txt
│   ├── .env                  # Configuration (ADD EMAIL PASSWORD HERE)
│   └── README.md
├── frontend/                  # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
└── backend/                   # Old FastAPI backend (can be archived)
```

---

## 🎯 STEP-BY-STEP SETUP

### STEP 1: Gmail App Password Setup (REQUIRED for OTP)

**Before starting, you MUST configure Gmail for sending OTPs:**

1. **Go to Google Account Security**:
   - Visit: https://myaccount.google.com/security

2. **Enable 2-Step Verification**:
   - Scroll to "2-Step Verification"
   - Click and follow the setup process
   - This is REQUIRED for App Passwords

3. **Generate App Password**:
   - Visit: https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → 2-Step Verification → App passwords
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Enter name: **Water Usage Monitoring**
   - Click **Generate**
   - You'll see a 16-character password (e.g., `abcd efgh ijkl mnop`)
   - **IMPORTANT**: Copy this password immediately (shown only once)

4. **Add to .env file**:
   ```bash
   cd /app/django_backend
   nano .env  # or use any text editor
   ```
   
   Update this line:
   ```env
   EMAIL_HOST_PASSWORD=abcdefghijklmnop  # Remove spaces, paste your 16-char password
   ```

   Save and exit (Ctrl+X, then Y, then Enter in nano)

---

### STEP 2: Backend Setup (Django)

```bash
# 1. Navigate to django_backend
cd /app/django_backend

# 2. Activate virtual environment
source /app/venv/bin/activate

# 3. Install dependencies (if not already installed)
pip install -r requirements.txt

# 4. Run migrations (if not already done)
python manage.py makemigrations
python manage.py migrate

# 5. Create superuser for Django Admin
python manage.py createsuperuser
# Enter:
#   Email: admin@example.com
#   Name: Admin User
#   Password: (your secure password)

# 6. Start Django server
python manage.py runserver 0.0.0.0:8001
```

**Backend will be running at**: `http://localhost:8001`

**Django Admin Portal**: `http://localhost:8001/admin/`

---

### STEP 3: Frontend Setup (React)

Open a new terminal:

```bash
# 1. Navigate to frontend
cd /app/frontend

# 2. Install dependencies (if not already installed)
yarn install

# 3. Update environment variables
nano .env  # or create if doesn't exist
```

Add this line:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

```bash
# 4. Start React development server
yarn start
```

**Frontend will be running at**: `http://localhost:3000`

---

## ✅ VERIFICATION CHECKLIST

### Backend Verification:

1. **Server Running**:
   ```bash
   curl http://localhost:8001/api/auth/me/
   ```
   Should return: `{"detail":"Authentication credentials were not provided."}`

2. **Django Admin Accessible**:
   - Open browser: http://localhost:8001/admin/
   - Login with superuser credentials
   - You should see Users, OTPs, Water Usage, Alerts

3. **Database Created**:
   ```bash
   ls -lh /app/django_backend/db.sqlite3
   ```
   Should show the database file

### Frontend Verification:

1. **React Dev Server Running**:
   - Open browser: http://localhost:3000
   - Should load the application

2. **API Connection**:
   - Open browser console (F12)
   - Check for any CORS or connection errors

---

## 🧪 TESTING THE SYSTEM

### Test 1: OTP Registration Flow

1. **Navigate to Register Page**:
   - Go to: http://localhost:3000/register

2. **Enter Details**:
   - Name: Test User
   - Email: (your actual email that you can access)
   - Password: test123456

3. **Request OTP**:
   - Click "Send OTP" or similar button
   - Check terminal/logs for OTP sending confirmation

4. **Check Your Email**:
   - Look for email from piyubedekar13@gmail.com
   - Subject: "Verify Your Email - Water Usage Monitoring"
   - Note the 6-digit OTP

5. **Enter OTP**:
   - Enter the OTP in the verification field
   - Click "Verify" or "Register"

6. **Success**:
   - You should be registered and logged in
   - JWT token should be stored
   - Redirected to dashboard

### Test 2: Login

1. Navigate to login page
2. Enter email and password
3. Click login
4. Should redirect to dashboard with user data

### Test 3: Forgot Password

1. **Send OTP**:
   - Click "Forgot Password"
   - Enter email
   - Click "Send OTP"

2. **Check Email**:
   - Look for password reset email
   - Note the OTP

3. **Reset Password**:
   - Enter OTP
   - Enter new password
   - Submit
   - Try logging in with new password

### Test 4: Django Admin

1. **Access Admin**:
   - http://localhost:8001/admin/
   - Login with superuser credentials

2. **View Users**:
   - Click "Users"
   - You should see registered users

3. **Change User to Admin**:
   - Click on a user
   - Change "Role" to "Admin"
   - Check "Staff status"
   - Save
   - User now has admin access

4. **View Other Data**:
   - Check OTPs (should see verification history)
   - Check Water Usage (after creating usage records)
   - Check Alerts (after system generates alerts)

---

## 🔧 TROUBLESHOOTING

### Issue 1: Email Not Sending

**Symptoms**: OTP email not received

**Solutions**:
1. Check if App Password is correct in `.env`
2. Verify 2-Step Verification is enabled
3. Check spam/junk folder
4. Look at Django logs for email errors:
   ```bash
   tail -f /tmp/django_server.log
   ```
5. Test email configuration:
   ```bash
   cd /app/django_backend
   python manage.py shell
   ```
   ```python
   from django.core.mail import send_mail
   send_mail('Test', 'Test message', 'piyubedekar13@gmail.com', ['your-email@example.com'])
   exit()
   ```

### Issue 2: Port Already in Use

**Symptoms**: "That port is already in use"

**Solutions**:
```bash
# Find process on port 8001
lsof -i :8001

# Kill process
kill -9 <PID>

# Or use different port
python manage.py runserver 0.0.0.0:8002
```

### Issue 3: CORS Errors

**Symptoms**: Browser console shows CORS errors

**Solutions**:
1. Check `settings.py` has `corsheaders` in INSTALLED_APPS
2. Verify `CORS_ALLOW_ALL_ORIGINS = True` in settings
3. Restart Django server

### Issue 4: Database Errors

**Symptoms**: "no such table" errors

**Solutions**:
```bash
cd /app/django_backend
python manage.py migrate --run-syncdb
```

### Issue 5: Module Not Found

**Symptoms**: "ModuleNotFoundError: No module named 'X'"

**Solutions**:
```bash
source /app/venv/bin/activate
pip install -r requirements.txt
```

---

## 📡 API ENDPOINTS REFERENCE

### Base URL: `http://localhost:8001/api/`

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/auth/send-otp/` | POST | Send OTP to email | No |
| `/auth/verify-otp/` | POST | Verify OTP code | No |
| `/auth/register/` | POST | Complete registration | No |
| `/auth/login/` | POST | User login | No |
| `/auth/reset-password/` | POST | Reset password | No |
| `/auth/me/` | GET | Get current user | Yes |
| `/usage/` | POST | Create usage record | Yes |
| `/usage/list/` | GET | Get usage history | Yes |
| `/usage/stats/` | GET | Get statistics | Yes |
| `/alerts/` | GET | Get alerts | Yes |
| `/alerts/<id>/` | PATCH | Update alert | Yes |
| `/reports/generate/` | GET | Generate report | Yes |
| `/demo/simulate-usage/` | POST | Simulate data | Yes |
| `/admin/users/` | GET | Get all users | Admin |
| `/admin/stats/` | GET | System stats | Admin |

---

## 🔐 AUTHENTICATION FLOW

### Registration:
```
1. POST /api/auth/send-otp/ 
   Body: { email, purpose: "registration" }
   
2. User receives OTP email

3. POST /api/auth/verify-otp/
   Body: { email, otp, purpose: "registration" }
   
4. POST /api/auth/register/
   Body: { email, otp, name, password }
   
5. Returns: { user, tokens: { access, refresh } }
```

### Login:
```
POST /api/auth/login/
Body: { email, password }
Returns: { user, tokens: { access, refresh } }
```

### Authenticated Requests:
```
Headers: { "Authorization": "Bearer <access_token>" }
```

---

## 📊 KEY FEATURES

### OTP System:
- ✅ 6-digit OTP
- ✅ 10-minute expiration
- ✅ 3 maximum attempts
- ✅ Auto-invalidation of old OTPs
- ✅ Email notifications

### User Management:
- ✅ Email-based authentication
- ✅ Role-based access (user/admin)
- ✅ Django Admin portal
- ✅ Change roles via admin interface

### Water Usage:
- ✅ Track usage with timestamps
- ✅ Automatic categorization
- ✅ Leakage detection
- ✅ Usage statistics
- ✅ Trend analysis

### Alerts:
- ✅ Real-time leakage detection
- ✅ High usage notifications
- ✅ Alert status management

### Reports:
- ✅ PDF generation
- ✅ CSV exports
- ✅ Daily/Weekly/Monthly reports

---

## 🎓 DJANGO ADMIN FEATURES

### User Management:
1. View all users
2. Search by email/name
3. Filter by role, status
4. Edit user details
5. **Change user role (user ↔ admin)**
6. Activate/deactivate users

### Data Management:
1. View all water usage records
2. View all alerts
3. View OTP history
4. Bulk actions on alerts (mark read/resolved)
5. Filter and search capabilities

### Security:
1. Staff users can access admin
2. Superusers have full access
3. Regular users cannot access admin
4. Admin role = staff + superuser permissions

---

## 🚀 PRODUCTION DEPLOYMENT TIPS

### Security:
1. Change `DJANGO_SECRET_KEY` in `.env`
2. Set `DEBUG = False` in `settings.py`
3. Update `ALLOWED_HOSTS` in `settings.py`
4. Use environment variables for all secrets
5. Implement rate limiting

### Database:
1. SQLite is fine for small-medium apps
2. For production, consider PostgreSQL:
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': 'water_monitoring',
           'USER': 'your_user',
           'PASSWORD': 'your_password',
           'HOST': 'localhost',
           'PORT': '5432',
       }
   }
   ```

### CORS:
```python
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    'https://your-frontend-domain.com',
]
```

### Static Files:
```bash
python manage.py collectstatic
```

---

## 📞 SUPPORT

### Check Logs:
```bash
# Django logs
tail -f /tmp/django_server.log

# Or if running in foreground, logs appear in terminal
```

### Database Shell:
```bash
python manage.py dbshell
```

### Django Shell:
```bash
python manage.py shell
```

### Migration Issues:
```bash
# Show migrations
python manage.py showmigrations

# Reset database (CAUTION: Deletes all data)
rm db.sqlite3
python manage.py migrate
```

---

## ✨ NEXT STEPS

1. ✅ Setup Django backend
2. ✅ Configure Gmail App Password
3. ✅ Test OTP flow
4. ✅ Create admin user
5. ⬜ Update React frontend (see FRONTEND_UPDATE_GUIDE.md)
6. ⬜ Test full integration
7. ⬜ Deploy to production

---

## 📝 NOTES

- SQLite database file: `/app/django_backend/db.sqlite3`
- Email configuration: `/app/django_backend/.env`
- Default role for new users: **user**
- Admin role can be set via Django Admin portal
- JWT tokens expire after 24 hours
- OTP expires after 10 minutes
- Maximum 3 OTP verification attempts

---

**🎉 Your Django + React + SQLite application is ready!**

For detailed API documentation, see `/app/django_backend/README.md`
