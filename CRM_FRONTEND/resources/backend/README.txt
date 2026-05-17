Bundled Spring Boot backend
===========================

Place the fat JAR here before building with auto-start:

  crm-backend.jar

Build from CRM_BACKEND:

  mvnw.cmd clean package -DskipTests

Copy:

  CRM_BACKEND\target\CRM_BACKEND-0.0.1-SNAPSHOT.jar
    -> resources\backend\crm-backend.jar

Then set in electron/config.cjs:

  backend.autoStart: true

Rebuild installer:

  npm run dist

See CRM_FRONTEND/DESKTOP.md for full packaging guide.
