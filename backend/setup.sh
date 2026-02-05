#!/bin/bash

# Django Backend Setup Script
echo "=========================================="
echo "Water Usage Monitoring - Django Backend Setup"
echo "=========================================="
echo ""

# Navigate to django_backend directory
cd /app/django_backend

# Activate virtual environment
echo "Activating virtual environment..."
source /app/venv/bin/activate

# Install dependencies
echo ""
echo "Installing Django dependencies..."
pip install -r requirements.txt

# Make migrations
echo ""
echo "Creating database migrations..."
python manage.py makemigrations

# Apply migrations
echo ""
echo "Applying migrations to database..."
python manage.py migrate

# Create superuser prompt
echo ""
echo "=========================================="
echo "Create Django Admin Superuser"
echo "=========================================="
echo ""
echo "You will be prompted to create a superuser account."
echo "This account will have full admin access."
echo ""
python manage.py createsuperuser --noinput --email admin@example.com || echo "Superuser creation skipped or already exists"

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Add your Gmail App Password to /app/django_backend/.env"
echo "2. Start the development server:"
echo "   cd /app/django_backend"
echo "   source /app/venv/bin/activate"
echo "   python manage.py runserver 0.0.0.0:8001"
echo ""
echo "3. Access Django Admin at: http://localhost:8001/admin/"
echo "4. Default superuser email: admin@example.com (change password after first login)"
echo ""
echo "=========================================="
