#!/bin/bash
# CEGM LMS Database Setup Script

echo "🗄️  Setting up CEGM LMS Development Database"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is required but not found."
    echo "Please install PostgreSQL and try again."
    exit 1
fi

# Database configuration from SSoT
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="cegm_lms_dev"
DB_USER="devuser"
DB_PASSWORD="devpassword"

echo "📋 Database Configuration:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"

# Create database user
echo "👤 Creating database user..."
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "User may already exist"

# Create database
echo "🗃️  Creating database..."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || echo "Database may already exist"

# Grant privileges
echo "🔐 Granting privileges..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"

echo "✅ Database setup complete!"
echo "   Connection string: postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

# Test connection
echo "🔍 Testing database connection..."
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed. Please check the setup."
    exit 1
fi
