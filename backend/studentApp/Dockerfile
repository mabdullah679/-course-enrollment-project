# ---------- Build Stage ----------
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

# Set working directory
WORKDIR /app

# Copy all project files into the image
COPY . .

# Build using default (dev) profile and skip tests
RUN ./mvnw clean package -DskipTests

# ---------- Runtime Stage ----------
FROM eclipse-temurin:17-jdk-alpine

# Set working directory
WORKDIR /app

# Copy only the built artifact
COPY --from=builder /app/target/*.jar app.jar

# Expose dynamic port via build-time ARG (default fallback is 8081)
ARG STUDENTAPP_PORT=8081
ENV STUDENTAPP_PORT=$STUDENTAPP_PORT
EXPOSE ${STUDENTAPP_PORT}

# Use a runtime Spring profile set by env var
ARG SPRING_PROFILES_ACTIVE=dev
ENV SPRING_PROFILES_ACTIVE=$SPRING_PROFILES_ACTIVE

ENTRYPOINT ["sh", "-c", "java -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE} -jar app.jar"]
