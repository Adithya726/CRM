/**
 * User data layout (per Windows install):
 *   %APPDATA%/crm-desktop/
 *     data/crm-desktop.db   ← SQLite
 *     backups/*.db          ← rolling backups
 *     logs/desktop.log
 *     logs/backend.log
 */
const fs = require('fs')
const path = require('path')

const MAX_STARTUP_BACKUPS = 5

function prepareUserData(paths, log) {
  const dirs = [paths.dataDir, paths.logs, paths.backups]
  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true })
  }

  if (fs.existsSync(paths.sqlite)) {
    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-')
      const dest = path.join(paths.backups, `pre-start-${stamp}.db`)
      fs.copyFileSync(paths.sqlite, dest)
      log.info('Pre-start DB snapshot saved', { dest })
      pruneBackups(paths.backups, MAX_STARTUP_BACKUPS, 'pre-start-')
    } catch (err) {
      log.warn('Pre-start backup skipped', { error: err.message })
    }
  } else {
    log.info('First launch — SQLite database will be created automatically')
  }
}

function pruneBackups(backupDir, keep, prefix) {
  const files = fs
    .readdirSync(backupDir)
    .filter((f) => f.endsWith('.db') && (!prefix || f.startsWith(prefix)))
    .map((f) => ({
      name: f,
      time: fs.statSync(path.join(backupDir, f)).mtimeMs,
    }))
    .sort((a, b) => b.time - a.time)

  for (const file of files.slice(keep)) {
    try {
      fs.unlinkSync(path.join(backupDir, file.name))
    } catch {
      /* best effort */
    }
  }
}

/**
 * Recovery: if DB file is zero bytes or unreadable, rename aside so Hibernate recreates schema.
 */
function validateDatabaseFile(paths, log) {
  if (!fs.existsSync(paths.sqlite)) return true

  try {
    const stat = fs.statSync(paths.sqlite)
    if (stat.size === 0) {
      const corrupt = `${paths.sqlite}.corrupt-${Date.now()}`
      fs.renameSync(paths.sqlite, corrupt)
      log.warn('Empty database removed for recovery', { corrupt })
      return true
    }
    return true
  } catch (err) {
    log.error('Database validation failed', { error: err.message })
    return false
  }
}

module.exports = { prepareUserData, validateDatabaseFile }
