/**
 * File + console logging for backend lifecycle (userData/logs/desktop.log).
 */
const fs = require('fs')
const path = require('path')

function createLogger(logsDir) {
  fs.mkdirSync(logsDir, { recursive: true })
  const logFile = path.join(logsDir, 'desktop.log')

  function write(level, message, meta) {
    const line = `[${new Date().toISOString()}] [${level}] ${message}${
      meta ? ` ${JSON.stringify(meta)}` : ''
    }\n`
    fs.appendFile(logFile, line, () => {})
    const fn = level === 'ERROR' ? console.error : console.log
    fn(`[CRM Desktop] ${message}`, meta ?? '')
  }

  return {
    info: (msg, meta) => write('INFO', msg, meta),
    warn: (msg, meta) => write('WARN', msg, meta),
    error: (msg, meta) => write('ERROR', msg, meta),
    path: logFile,
  }
}

module.exports = { createLogger }
