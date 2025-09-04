FROM openjdk:21-jdk-slim

WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY backend/mvnw backend/mvnw.cmd backend/pom.xml ./
COPY backend/.mvn .mvn/

# Copy source code
COPY backend/src ./src/

# Copy SSoT files
COPY ssot/ ./ssot/

# Build the application
RUN ./mvnw clean package -DskipTests

# Set environment variables
ENV DEV_COOKIE_NAME=cegm_session_dev
ENV DEV_JWT_STUDENT_SECRET=cegm_student_jwt_secret_dev_12345
ENV DEV_JWT_ADMIN_SECRET=cegm_admin_jwt_secret_dev_67890
# WARNING: Secrets are hardcoded for local dev only. For prod/staging, inject via AWS SSM Parameter Store as per project security policy.

# Expose port
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "target/cegm-backend-0.0.1-SNAPSHOT.jar"]
