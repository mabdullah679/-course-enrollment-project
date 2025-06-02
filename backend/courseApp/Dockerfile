# ---------- Build Stage ----------
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

# Set working directory
WORKDIR /app

# Copy all project files into the image
COPY . .

# Build using default profile and skip tests
RUN ./mvnw clean package -DskipTests

# ---------- Runtime Stage ----------
FROM eclipse-temurin:17-jdk-alpine

# Declare port and Spring profile as build args (optional future use)
ARG COURSEAPP_PORT=8082
ARG SPRING_PROFILES_ACTIVE=dev

# Set working directory
WORKDIR /app

# Copy built JAR from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Expose port (can be overridden via ARG or ENV if needed)
EXPOSE ${COURSEAPP_PORT}

# Set environment variable for use in ENTRYPOINT
ENV SPRING_PROFILES_ACTIVE=${SPRING_PROFILES_ACTIVE}
ENV SERVER_PORT=${COURSEAPP_PORT}

# Start the application
ENTRYPOINT ["sh", "-c", "java -Dspring.profiles.active=$SPRING_PROFILES_ACTIVE -Dserver.port=$SERVER_PORT -jar app.jar"]