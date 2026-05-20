/**
 * Electron main process — startup lifecycle
 * ----------------------------------------
 * 1. Register app:// protocol (production)
 * 2. Show splash window
 * 3. BackendManager.ensureRunning() → spawn JAR or detect existing API
 * 4. On success → open React window; on failure → open UI with error state
 * 5. before-quit → BackendManager.stop() kills child Java process
 */
const {
  app,
  BrowserWindow,
  protocol,
  net,
  ipcMain,
  nativeImage,
  shell,
} = require('electron')
const path = require('path')
const fs = require('fs')
const { pathToFileURL } = require('url')
const config = require('./config.cjs')
const { BackendManager } = require('./backendManager.cjs')
const { prepareUserData, validateDatabaseFile } = require('./userData.cjs')

const backendManager = new BackendManager()
let startupResult = { ok: true, reason: 'pending' }

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
])

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

app.setName(config.window.title)

let splashWindow = null
let mainWindow = null

function broadcastBackendStatus(payload) {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send('backend:status', payload)
    }
  })
}

backendManager.on('status', (payload) => {
  broadcastBackendStatus(payload)
  if (payload.message) {
    setSplashStatus(payload.message)
  }
})

function getIcon() {
  if (process.platform === 'darwin' && fs.existsSync(config.paths.iconIcns)) {
    return nativeImage.createFromPath(config.paths.iconIcns)
  }
  if (fs.existsSync(config.paths.icon)) {
    return nativeImage.createFromPath(config.paths.icon)
  }
  return undefined
}

function setSplashStatus(message) {
  if (!splashWindow || splashWindow.isDestroyed()) return
  const safe = JSON.stringify(message)
  splashWindow.webContents
    .executeJavaScript(
      `(() => { const el = document.getElementById('status'); if (el) el.textContent = ${safe}; })()`,
    )
    .catch(() => {})
}

function registerAppProtocol() {
  protocol.handle('app', (request) => {
    const url = new URL(request.url)
    let pathname = decodeURIComponent(url.pathname)
    if (pathname === '/' || pathname === '') {
      pathname = '/index.html'
    }

    let filePath = path.normalize(
      path.join(config.paths.dist, pathname.replace(/^\//, '')),
    )

    const distRoot = path.normalize(config.paths.dist)
    if (!filePath.startsWith(distRoot)) {
      filePath = path.join(distRoot, 'index.html')
    } else if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distRoot, 'index.html')
    }

    return net.fetch(pathToFileURL(filePath).toString())
  })
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 440,
    height: 360,
    frame: false,
    resizable: false,
    center: true,
    show: true,
    backgroundColor: config.window.backgroundColor,
    icon: getIcon(),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  splashWindow.loadFile(config.paths.splash)
  splashWindow.on('closed', () => {
    splashWindow = null
  })
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: config.window.width,
    height: config.window.height,
    minWidth: config.window.minWidth,
    minHeight: config.window.minHeight,
    show: false,
    backgroundColor: config.window.backgroundColor,
    title: config.window.title,
    icon: getIcon(),
    autoHideMenuBar: true,
    webPreferences: {
      preload: config.paths.preload,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: true,
    },
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close()
    }
    mainWindow.show()
    mainWindow.focus()
  })

  if (config.isDev) {
    mainWindow.loadURL(`http://localhost:${config.ports.frontendDev}`)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadURL('app://./index.html')
  }

  mainWindow.webContents.once('did-finish-load', () => {
    broadcastBackendStatus({
      ...backendManager.getStatus(),
      startup: startupResult,
    })
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function registerIpcHandlers() {
  ipcMain.handle('app:get-info', () => ({
    name: app.getName(),
    version: app.getVersion(),
    isPackaged: app.isPackaged,
    isDev: config.isDev,
    platform: process.platform,
    userData: config.paths.userData,
    sqlitePath: config.paths.sqlite,
    backendResources: config.paths.backendResources,
    logsPath: config.paths.logs,
    dbPath: config.paths.sqlite,
    backupsPath: config.paths.backups,
  }))

  ipcMain.handle('backend:status', async () => ({
    healthy: await backendManager.isHealthy(),
    ...backendManager.getStatus(),
    autoStart: config.backend.autoStart,
    port: config.backend.port,
    jarFound: Boolean(backendManager.getBundledJarPath()),
  }))

  ipcMain.handle('backend:startup', () => ({
    ...startupResult,
    ...backendManager.getStatus(),
  }))

  ipcMain.handle('backend:restart', async () => {
    await backendManager.stop()
    startupResult = await backendManager.ensureRunning()
    broadcastBackendStatus({
      ...backendManager.getStatus(),
      startup: startupResult,
    })
    return startupResult
  })
}

function runStartupValidation() {
  const log = backendManager.log
  prepareUserData(config.paths, log)
  if (!validateDatabaseFile(config.paths, log)) {
    return {
      ok: false,
      reason: 'db_invalid',
      message: 'Local database could not be accessed',
    }
  }
  return null
}

async function bootstrapBackend() {
  const validationError = runStartupValidation()
  if (validationError) {
    startupResult = validationError
    return validationError
  }

  setSplashStatus('Starting backend...')
  startupResult = await backendManager.ensureRunning()
  return startupResult
}

app.whenReady().then(async () => {
  if (!config.isDev) {
    registerAppProtocol()
  }

  registerIpcHandlers()
  createSplashWindow()
  setSplashStatus('Loading CRM Desktop…')

  const result = await bootstrapBackend()

  if (result.ok) {
    setSplashStatus('Backend ready — opening workspace…')
  } else {
    setSplashStatus(result.message || 'Backend failed to start')
    await new Promise((r) => setTimeout(r, 1200))
  }

  createMainWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  backendManager.stop()
})

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createSplashWindow()
    startupResult = await bootstrapBackend()
    createMainWindow()
  }
})
