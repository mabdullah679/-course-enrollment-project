# CEGM LMS - Complete Learning Management System

A full-stack Learning Management System built with Spring Boot (Java 21) backend and Vite + React TypeScript frontend, configured via Single Source of Truth (SSoT) YAML files.

## 🏗️ Architecture

### Backend (Spring Boot Java 21)
- **Configuration**: SSoT-driven configuration loading and validation
- **Security**: JWT-based authentication with role-based access control
- **Database**: PostgreSQL with JPA/Hibernate
- **API**: RESTful endpoints for all LMS operations
- **Error Handling**: Centralized error handling with audit logging

### Frontend (Vite + React TypeScript)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query for server state
- **Authentication**: JWT token management with context
- **Routing**: Role-based routing (Student/Admin views)

### Configuration (SSoT)
- **ssot.dev.yaml**: Single source of truth for all configuration
- **ssot.schema.json**: JSON Schema validation for configuration
- **Environment-specific**: Development, staging, production configs

## 🚀 Quick Start

### Prerequisites
- Java 21+
- Node.js 18+
- PostgreSQL 15+
- Maven 3.8+

### Option 1: Automated Setup (Recommended)
```bash
# Clone the repository
git clone <repository-url>
cd cegm

# Make scripts executable and start everything
chmod +x scripts/*.sh
./scripts/start-dev.sh
```

This will:
1. Set up the PostgreSQL database
2. Start the backend on http://localhost:8080
3. Start the frontend on http://localhost:3000

### Option 2: Manual Setup

#### 1. Database Setup
```bash
./scripts/setup-database.sh
```

#### 2. Backend Setup
```bash
cd backend
export DEV_COOKIE_NAME="cegm_session_dev"
export DEV_JWT_STUDENT_SECRET="cegm_student_jwt_secret_dev_12345"
export DEV_JWT_ADMIN_SECRET="cegm_admin_jwt_secret_dev_67890"
./mvnw spring-boot:run
```

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Option 3: Docker Setup
```bash
# Build and start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:8080
# Database: localhost:5432
```

## 📊 Application Features

### Student Features
- **Authentication**: Sign up, login, logout
- **Course Browsing**: View available courses
- **Enrollment**: Enroll in courses (enrollment window permitting)
- **Grades**: View grades and feedback
- **Profile**: Manage personal information

### Admin Features
- **User Management**: Approve/reject user signups, promote/demote users
- **Course Management**: Create, update, archive courses
- **Enrollment Control**: Toggle enrollment windows
- **Grade Assignment**: Assign grades with feedback
- **System Monitoring**: View audit logs and error tracking

### System Features
- **Enrollment Windows**: Admin-controlled enrollment periods
- **Audit Logging**: Complete action and error tracking
- **Error Handling**: Student-friendly error messages with admin tracking
- **Role-based Security**: JWT tokens with role enforcement
- **SSoT Configuration**: All settings loaded from YAML files

## 🔧 Configuration

All configuration is managed through SSoT files:

### SSoT Structure
```yaml
environment: dev
services:
  SignUpService:
    defaultAccountType: STUDENT
    adminApprovalRequired: true
  # ... other services
database:
  type: postgres
  host: localhost
  port: 5432
security:
  jwt:
    student:
      secret: ${DEV_JWT_STUDENT_SECRET}
      expiresIn: "24h"
```

### Environment Variables
Required environment variables (set in scripts):
- `DEV_COOKIE_NAME`: Session cookie name
- `DEV_JWT_STUDENT_SECRET`: JWT secret for student tokens
- `DEV_JWT_ADMIN_SECRET`: JWT secret for admin tokens

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Courses
- `GET /api/courses` - Get active courses
- `GET /api/courses/all` - Get all courses (admin)
- `POST /api/courses` - Create course (admin)
- `PUT /api/courses/{id}` - Update course (admin)
- `PUT /api/courses/{id}/archive` - Archive course (admin)

### Enrollments
- `GET /api/enrollments` - Get user enrollments
- `POST /api/enrollments` - Enroll in course
- `PUT /api/enrollments/{id}/status` - Update enrollment status

### Grades
- `GET /api/grades` - Get user grades
- `POST /api/grades` - Assign grade (admin)
- `PUT /api/grades/{id}` - Update grade (admin)

### Admin
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/{id}/approve` - Approve user
- `PUT /api/admin/users/{id}/promote` - Promote to admin
- `GET /api/admin/enrollment-window` - Get enrollment window status
- `PUT /api/admin/enrollment-window` - Toggle enrollment window

## 🗂️ Project Structure

```
cegm/
├── backend/                 # Spring Boot backend
│   ├── src/main/java/com/cegm/lms/
│   │   ├── config/         # Configuration classes
│   │   ├── controller/     # REST controllers
│   │   ├── model/          # JPA entities
│   │   ├── repository/     # Data repositories
│   │   ├── service/        # Business logic
│   │   ├── security/       # Security configuration
│   │   ├── exception/      # Exception handling
│   │   └── dto/           # Data transfer objects
│   ├── src/main/resources/ # Application properties
│   ├── pom.xml            # Maven configuration
│   └── Dockerfile         # Backend container
├── frontend/               # React TypeScript frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   └── lib/          # Utilities
│   ├── package.json       # Node dependencies
│   └── Dockerfile        # Frontend container
├── ssot/                  # Single Source of Truth
│   ├── ssot.dev.yaml     # Development configuration
│   └── ssot.schema.json  # Configuration schema
├── scripts/               # Development scripts
│   ├── start-dev.sh      # Complete environment setup
│   ├── start-backend.sh  # Backend startup
│   ├── start-frontend.sh # Frontend startup
│   └── setup-database.sh # Database setup
├── docker-compose.yml    # Container orchestration
└── README.md            # This file
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
./mvnw test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
# Start services
./scripts/start-dev.sh

# Run integration tests
# (Add your integration test commands here)
```

## 🚀 Deployment

### Development
Use the provided scripts for local development.

### Production
1. Update SSoT files for production environment
2. Set production environment variables
3. Build and deploy using Docker Compose or Kubernetes

### Environment Variables (Production)
- Update JWT secrets to secure values
- Configure database connection
- Set appropriate CORS origins
- Configure logging levels

## 🐛 Troubleshooting

### Common Issues

**Database Connection Issues**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Reset database
./scripts/setup-database.sh
```

**Backend Startup Issues**
```bash
# Check Java version
java -version

# Clean and rebuild
cd backend
./mvnw clean install
```

**Frontend Build Issues**
```bash
# Clear node modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Logs
- Backend logs: `cegm_dev.log`
- Frontend logs: Browser console
- Database logs: PostgreSQL logs

## 📄 License

[Add your license information here]

## 🤝 Contributing

[Add contributing guidelines here]

---

## 📋 Development Checklist

- [x] Backend scaffolding complete
- [x] Frontend scaffolding complete
- [x] SSoT configuration files
- [x] Database setup scripts
- [x] Docker configuration
- [x] Development scripts
- [x] Documentation

Ready for development! 🎉
