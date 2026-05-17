/**
 * Backend process lifecycle (standalone desktop)
 * --------------------------------------------
 * 1. Electron prepares userData folders + optional DB snapshot
 * 2. Resolve bundled JRE (resources/jre) — no system Java required
 * 3. Spawn: java -jar crm-backend.jar --spring.profiles.active=desktop
 *    Env: CRM_USER_DATA, CRM_DB_PATH → SQLite in app data
 * 4. Poll GET /api/health until status=UP and database=UP
 * 5. On app quit → taskkill child process tree (Windows)
 */
const { spawn, execSync } = require('child_process')
const { EventEmitter } = require('events')
const fs = require('fs')
const net = require('net')
const path = require('path')
const config = require('./config.cjs')
const { createLogger } = require('./logger.cjs')

const STATUS = {
  IDLE: 'idle',
  STARTING: 'starting',
  READY: 'ready',
  FAILED: 'failed',
  STOPPING: 'stopping',
}

class BackendManager extends EventEmitter {
  constructor() {
    super()
    this.process = null
    this.spawnedByApp = false
    this.status = STATUS.IDLE
    this.lastError = null
    this.log = createLogger(config.paths.logs)
  }

  getStatus() {
    return {
      status: this.status,
      lastError: this.lastError,
      port: config.backend.port,
      jarPath: this.getBundledJarPath(),
      javaPath: this.findJavaExecutable({ silent: true }),
      dbPath: config.paths.sqlite,
      spawnedByApp: this.spawnedByApp,
    }
  }

  setStatus(status, message, meta) {
    this.status = status
    if (message) {
      if (status === STATUS.FAILED) {
        this.lastError = message
        this.log.error(message, meta)
      } else {
        this.log.info(message, meta)
      }
    }
    this.emit('status', { status, message, ...meta })
  }

  getBundledJarPath() {
    const candidates = [
      config.backend.jarPath,
      config.paths.backendJar,
      path.join(config.paths.backendResources, 'crm-backend.jar'),
      config.paths.devBackendJar,
    ].filter(Boolean)

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return candidate
    }
    return null
  }

  /**
   * Prefer bundled JRE (production). Fall back to JAVA_HOME / PATH in development.
   */
  findJavaExecutable(options = {}) {
    const { silent = false } = options
    const bin = process.platform === 'win32' ? 'java.exe' : 'java'
    const candidates = []

    if (fs.existsSync(config.paths.bundledJava)) {
      candidates.push(config.paths.bundledJava)
    }

    if (config.paths.isDev) {
      if (process.env.JAVA_HOME) {
        candidates.push(path.join(process.env.JAVA_HOME, 'bin', bin))
      }
      candidates.push(bin)
    }

    for (const java of candidates) {
      try {
        execSync(`"${java}" -version`, { stdio: 'pipe' })
        if (!silent) {
          this.log.info('Using Java runtime', { java })
        }
        return java
      } catch {
        /* try next */
      }
    }
    return null
  }

  isPortInUse(port) {
    return new Promise((resolve) => {
      const tester = net.createServer()
      tester.once('error', (err) => {
        resolve(err.code === 'EADDRINUSE')
      })
      tester.once('listening', () => {
        tester.close(() => resolve(false))
      })
      tester.listen(port, '127.0.0.1')
    })
  }

  async isHealthy(timeoutMs = 3000) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(config.backend.healthUrl, {
        method: 'GET',
        signal: controller.signal,
      })
      const data = await res.json().catch(() => ({}))
      const apiUp = res.ok && data.status === 'UP'
      const dbUp = data.database === undefined || data.database === 'UP'
      return apiUp && dbUp
    } catch {
      return false
    } finally {
      clearTimeout(timer)
    }
  }

  async waitForReady(maxAttempts, intervalMs) {
    for (let i = 0; i < maxAttempts; i++) {
      if (await this.isHealthy(2000)) return true
      await new Promise((r) => setTimeout(r, intervalMs))
    }
    return false
  }

  async ensureRunning() {
    this.setStatus(STATUS.STARTING, 'Starting backend...')

    if (await this.isHealthy(2000)) {
      this.setStatus(STATUS.READY, 'Backend ready', { reason: 'already_running' })
      return { ok: true, reason: 'already_running' }
    }

    const portBusy = await this.isPortInUse(config.backend.port)
    if (portBusy) {
      const msg = 'Port already in use'
      this.setStatus(STATUS.FAILED, msg, {
        reason: 'port_in_use',
        port: config.backend.port,
      })
      return { ok: false, reason: 'port_in_use', message: msg }
    }

    if (!config.backend.autoStart) {
      const ready = await this.waitForReady(
        config.backend.externalWaitAttempts,
        config.backend.externalWaitIntervalMs,
      )
      if (ready) {
        this.setStatus(STATUS.READY, 'Backend ready')
        return { ok: true, reason: 'external' }
      }
      const msg = 'Backend failed to respond'
      this.setStatus(STATUS.FAILED, msg, { reason: 'timeout' })
      return { ok: false, reason: 'timeout', message: msg }
    }

    return this.start()
  }

  async start() {
    const jarPath = this.getBundledJarPath()
    if (!jarPath) {
      const msg = 'Backend package missing — reinstall CRM Desktop'
      this.setStatus(STATUS.FAILED, msg, { reason: 'jar_not_found' })
      return { ok: false, reason: 'jar_not_found', message: msg }
    }

    const java = this.findJavaExecutable()
    if (!java) {
      const msg = config.paths.isDev
        ? 'Java runtime missing — run npm run download:jre or install JDK 17+'
        : 'Application runtime missing — reinstall CRM Desktop'
      this.setStatus(STATUS.FAILED, msg, { reason: 'java_not_found' })
      return { ok: false, reason: 'java_not_found', message: msg }
    }

    if (this.process) {
      this.setStatus(STATUS.READY, 'Backend ready', { reason: 'already_running' })
      return { ok: true, reason: 'already_running' }
    }

    fs.mkdirSync(config.paths.dataDir, { recursive: true })
    fs.mkdirSync(config.paths.logs, { recursive: true })

    const backendLogPath = path.join(config.paths.logs, 'backend.log')
    const logFd = fs.openSync(backendLogPath, 'a')
    fs.writeSync(
      logFd,
      `\n--- CRM backend start ${new Date().toISOString()} ---\nDB: ${config.paths.sqlite}\n`,
    )

    const args = [
      ...config.backend.javaOpts,
      '-jar',
      jarPath,
      `--server.port=${config.backend.port}`,
      `--spring.profiles.active=${config.backend.springProfile}`,
    ]

    this.log.info('Spawning backend', {
      java,
      jarPath,
      db: config.paths.sqlite,
    })

    let exitedEarly = false
    this.process = spawn(java, args, {
      cwd: path.dirname(jarPath),
      stdio: ['ignore', logFd, logFd],
      windowsHide: true,
      detached: false,
      env: {
        ...process.env,
        CRM_USER_DATA: config.paths.userData,
        CRM_DB_PATH: config.paths.sqlite,
      },
    })

    this.spawnedByApp = true
    this.process.on('exit', (code) => {
      exitedEarly = true
      this.log.warn('Backend process exited', { code })
      this.process = null
      this.spawnedByApp = false
    })

    this.process.on('error', (err) => {
      this.log.error('Backend spawn error', { error: err.message })
    })

    const ready = await this.waitForReady(
      config.backend.startupAttempts,
      config.backend.startupIntervalMs,
    )

    if (ready) {
      this.setStatus(STATUS.READY, 'Backend ready')
      return { ok: true, reason: 'started' }
    }

    if (exitedEarly || !this.process) {
      const msg = 'Backend failed — see backend.log in app data'
      this.setStatus(STATUS.FAILED, msg, { reason: 'process_exited' })
      await this.stop()
      return { ok: false, reason: 'process_exited', message: msg }
    }

    const portStillBusy = await this.isPortInUse(config.backend.port)
    const msg = portStillBusy
      ? 'Port already in use'
      : 'Backend startup timeout'
    this.setStatus(STATUS.FAILED, msg, {
      reason: portStillBusy ? 'port_in_use' : 'timeout',
    })
    await this.stop()
    return {
      ok: false,
      reason: portStillBusy ? 'port_in_use' : 'timeout',
      message: msg,
    }
  }

  async stop() {
    if (!this.process || !this.spawnedByApp) {
      this.process = null
      this.spawnedByApp = false
      return
    }

    this.setStatus(STATUS.STOPPING, 'Stopping backend...')
    const pid = this.process.pid

    await new Promise((resolve) => {
      if (process.platform === 'win32') {
        const killer = spawn('taskkill', ['/pid', String(pid), '/f', '/t'], {
          windowsHide: true,
        })
        killer.on('close', resolve)
        killer.on('error', resolve)
      } else {
        this.process.once('exit', resolve)
        this.process.kill('SIGTERM')
        setTimeout(resolve, 5000)
      }
    })

    this.process = null
    this.spawnedByApp = false
    this.setStatus(STATUS.IDLE, 'Backend stopped')
    this.log.info('Backend process stopped')
  }
}

module.exports = { BackendManager, STATUS }
