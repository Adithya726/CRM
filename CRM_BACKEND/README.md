# CRM Backend

Spring Boot REST API for CRM Desktop and web development.

**Main documentation:** [../README.md](../README.md)

## Profiles

| Profile | Database | Used by |
|---------|----------|---------|
| *(default)* | MySQL `crm_db` | `mvnw spring-boot:run` (web dev) |
| `desktop` | SQLite (`CRM_DB_PATH`) | Electron bundled JAR |

## Run (MySQL dev)

```bash
mvnw.cmd spring-boot:run
```

API: http://localhost:5771

## Build fat JAR (desktop)

From `CRM_FRONTEND`:

```bash
npm run build:backend
```

Or from this directory:

```bash
mvnw.cmd clean package -DskipTests
```
