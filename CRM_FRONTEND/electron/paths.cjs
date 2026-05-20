const fs = require('fs')
const path = require('path')
const { app } = require('electron')

/**
 * Bundled JRE binary path:
 * - Windows: resources/jre/bin/java.exe
 * - macOS:   resources/jre/Contents/Home/bin/java (Temurin .jdk layout)
 * - Linux:   resources/jre/bin/java
 */
function resolveBundledJava(jreRoot) {
  if (process.platform === 'darwin') {
    const macHomeJava = path.join(jreRoot, 'Contents', 'Home', 'bin', 'java')
    if (fs.existsSync(macHomeJava)) return macHomeJava
  }
  const name = process.platform === 'win32' ? 'java.exe' : 'java'
  return path.join(jreRoot, 'bin', name)
}

/**
 * Packaged layout:
 *   Windows: <install>/resources/{backend,jre}
 *   macOS:     CRM Desktop.app/Contents/Resources/{backend,jre}
 *
 * User data:
 *   Windows: %APPDATA%/crm-desktop/
 *   macOS:   ~/Library/Application Support/crm-desktop/
 */
function createPaths() {
  const isDev = !app.isPackaged
  const appRoot = path.join(__dirname, '..')
  const userData = app.getPath('userData')

  const backendResources = isDev
    ? path.join(appRoot, 'resources', 'backend')
    : path.join(process.resourcesPath, 'backend')

  const jreRoot = isDev
    ? path.join(appRoot, 'resources', 'jre')
    : path.join(process.resourcesPath, 'jre')

  const devBackendJar = path.join(
    appRoot,
    '..',
    'CRM_BACKEND',
    'target',
    'CRM_BACKEND-0.0.1-SNAPSHOT.jar',
  )

  const dataDir = path.join(userData, 'data')

  return {
    isDev,
    appRoot,
    dist: path.join(appRoot, 'dist'),
    splash: path.join(__dirname, 'splash.html'),
    preload: path.join(__dirname, 'preload.cjs'),
    icon: path.join(appRoot, 'build', 'icon.png'),
    iconIco: path.join(appRoot, 'build', 'icon.ico'),
    iconIcns: path.join(appRoot, 'build', 'icon.icns'),
    userData,
    dataDir,
    sqlite: path.join(dataDir, 'crm-desktop.db'),
    backups: path.join(userData, 'backups'),
    logs: path.join(userData, 'logs'),
    backendResources,
    backendJar: path.join(backendResources, 'crm-backend.jar'),
    devBackendJar,
    jreRoot,
    bundledJava: resolveBundledJava(jreRoot),
  }
}

module.exports = { createPaths, resolveBundledJava }
