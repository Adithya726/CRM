/**
 * Builds backend JAR only when resources/backend/crm-backend.jar is missing.
 */
import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const jar = path.join(__dirname, '..', 'resources', 'backend', 'crm-backend.jar')

if (fs.existsSync(jar)) {
  console.log('Backend JAR already present — skipping build')
  process.exit(0)
}

console.log('Backend JAR missing — building...')
const result = spawnSync('node', ['scripts/build-backend.mjs'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  shell: true,
})
process.exit(result.status ?? 1)
