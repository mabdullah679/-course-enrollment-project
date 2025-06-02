# ---------- Build Stage ----------
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Build with dev profile, skipping tests
RUN ./mvnw clean package -DskipTests

# ---------- Runtime Stage ----------
FROM eclipse-temurin:17-jdk-alpine

# Set working directory
WORKDIR /app

# Copy the built JAR
COPY --from=builder /app/target/*.jar app.jar

# Expose port using ARG/ENV fallback
ARG GATEWAYAPP_PORT=8080
ENV GATEWAYAPP_PORT=$GATEWAYAPP_PORT
EXPOSE ${GATEWAYAPP_PORT}

# Enable Spring Boot dev profile
ARG SPRING_PROFILES_ACTIVE=dev
ENV SPRING_PROFILES_ACTIVE=$SPRING_PROFILES_ACTIVE

# Start application with injected profile
ENTRYPOINT ["sh", "-c", "java -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE} -jar app.jar"]
