const { createPaths } = require('./paths.cjs')

const paths = createPaths()

module.exports = {
  isDev: paths.isDev,
  ports: {
    frontendDev: 5173,
    backend: 5771,
  },
  backend: {
    port: 5771,
    healthUrl: 'http://127.0.0.1:5771/api/health',
    /** Always start bundled JAR when present (standalone desktop product). */
    autoStart: true,
    jarPath: null,
    springProfile: 'desktop',
    javaOpts: ['-Xms256m', '-Xmx512m'],
    /** Max wait ~90s for Spring Boot cold start */
    startupAttempts: 90,
    startupIntervalMs: 1000,
    /** When autoStart is false (rare), wait for manual backend */
    externalWaitAttempts: 30,
    externalWaitIntervalMs: 1000,
  },
  paths,
  window: {
    width: 1366,
    height: 864,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#0f1419',
    title: 'CRM Desktop',
  },
}
