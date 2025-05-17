# gatewayApp

This application was generated using JHipster 8.11.0. You can find documentation and help at:
👉 [https://www.jhipster.tech/documentation-archive/v8.11.0](https://www.jhipster.tech/documentation-archive/v8.11.0)

This is a **gateway** application intended to be part of a microservice architecture. See:
👉 [https://www.jhipster.tech/documentation-archive/v8.11.0/microservices-architecture/](https://www.jhipster.tech/documentation-archive/v8.11.0/microservices-architecture/)

It uses **Consul** for Service Discovery and Configuration. On launch, it must be able to connect to Consul at:
👉 [http://localhost:8500](http://localhost:8500)

---

## 🗂️ Project Structure

* `.yo-rc.json`: Yeoman config (includes JHipster-specific generator settings)
* `.yo-resolve` *(optional)*: Conflict resolution patterns for file generation
* `.jhipster/*.json`: JHipster entity configurations
* `/src/main/docker/`: Docker setup files for services used by this app
* `package.json`: Node-based development tools (Prettier, ESLint, etc.)

JHipster also sets up:

* Pre-configured **Prettier**, **ESLint**, **Husky** hooks, and other developer tools
* Standard **Java** structure under `/src` for backend services

---

## 🚀 Development

To launch the app in **dev** mode:

```bash
./mvnw
```

More info:
👉 [https://www.jhipster.tech/documentation-archive/v8.11.0/development/](https://www.jhipster.tech/documentation-archive/v8.11.0/development/)

---

## 📦 Building for Production

### JAR Packaging

```bash
./mvnw -Pprod clean verify
```

Then run:

```bash
java -jar target/*.jar
```

### WAR Packaging

```bash
./mvnw -Pprod,war clean verify
```

---

## 🛠 JHipster Control Center

Launch JHipster Control Center locally:

```bash
docker compose -f src/main/docker/jhipster-control-center.yml up
```

Accessible at:
👉 [http://localhost:7419](http://localhost:7419)

---

## ✅ Testing

### Spring Boot Tests

```bash
./mvnw verify
```

---

## 🧪 Code Quality: SonarQube

Launch Sonar locally:

```bash
docker compose -f src/main/docker/sonar.yml up -d
```

Then run a full analysis:

```bash
./mvnw -Pprod clean verify sonar:sonar -Dsonar.login=admin -Dsonar.password=admin
```

Or rerun just the analysis:

```bash
./mvnw initialize sonar:sonar -Dsonar.login=admin -Dsonar.password=admin
```

Alternatively, configure `sonar-project.properties`:

```properties
sonar.login=admin
sonar.password=admin
```

More info:
👉 [https://www.jhipster.tech/documentation-archive/v8.11.0/code-quality/](https://www.jhipster.tech/documentation-archive/v8.11.0/code-quality/)

---

## 🐳 Docker Compose Support

To start backend dependencies (e.g., Consul, PostgreSQL):

```bash
docker compose -f src/main/docker/services.yml up -d
```

To stop and clean up:

```bash
docker compose -f src/main/docker/services.yml down
```

To disable Spring Docker Compose support (optional):

```yaml
spring:
  docker:
    compose:
      enabled: false
```

### Full App Dockerization

To build Docker image:

```bash
npm run java:docker
```

On M1/ARM Mac:

```bash
npm run java:docker:arm64
```

Then launch everything:

```bash
docker compose -f src/main/docker/app.yml up -d
```

More info:
👉 [https://www.jhipster.tech/documentation-archive/v8.11.0/docker-compose](https://www.jhipster.tech/documentation-archive/v8.11.0/docker-compose)

---

## 🔄 Continuous Integration (Optional)

Run:

```bash
jhipster ci-cd
```

Follow the prompts to generate GitHub Actions, GitLab CI, Jenkins, etc.

More info:
👉 [https://www.jhipster.tech/documentation-archive/v8.11.0/setting-up-ci/](https://www.jhipster.tech/documentation-archive/v8.11.0/setting-up-ci/)

---

## 📚 Helpful Docs

* [JHipster 8.11.0 Documentation](https://www.jhipster.tech/documentation-archive/v8.11.0)
* [Service Discovery with Consul](https://www.jhipster.tech/documentation-archive/v8.11.0/microservices-architecture/#consul)
* [Using Docker Compose](https://www.jhipster.tech/documentation-archive/v8.11.0/docker-compose)
* [Using JHipster in Production](https://www.jhipster.tech/documentation-archive/v8.11.0/production/)
* [Running Tests](https://www.jhipster.tech/documentation-archive/v8.11.0/running-tests/)
* [Code Quality](https://www.jhipster.tech/documentation-archive/v8.11.0/code-quality/)
* [Setting Up CI](https://www.jhipster.tech/documentation-archive/v8.11.0/setting-up-ci/)
