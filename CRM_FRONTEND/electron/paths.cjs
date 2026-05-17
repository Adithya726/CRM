const path = require('path')
const { app } = require('electron')

/**
 * Packaged layout (after NSIS install):
 *   <install>/CRM Desktop.exe
 *   <install>/resources/app.asar
 *   <install>/resources/backend/crm-backend.jar
 *   <install>/resources/jre/bin/java.exe
 *
 * User data (writable):
 *   %APPDATA%/crm-desktop/data/crm-desktop.db
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
    userData,
    dataDir,
    sqlite: path.join(dataDir, 'crm-desktop.db'),
    backups: path.join(userData, 'backups'),
    logs: path.join(userData, 'logs'),
    backendResources,
    backendJar: path.join(backendResources, 'crm-backend.jar'),
    devBackendJar,
    jreRoot,
    bundledJava: path.join(
      jreRoot,
      'bin',
      process.platform === 'win32' ? 'java.exe' : 'java',
    ),
  }
}

module.exports = { createPaths }
