/**
 * Builds Spring Boot fat JAR and copies it to resources/backend/crm-backend.jar
 * for electron-builder extraResources packaging.
 */
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendRoot = path.join(__dirname, '..')
const backendRoot = path.join(frontendRoot, '..', 'CRM_BACKEND')
const destDir = path.join(frontendRoot, 'resources', 'backend')
const destJar = path.join(destDir, 'crm-backend.jar')

const mvnw =
  process.platform === 'win32'
    ? path.join(backendRoot, 'mvnw.cmd')
    : path.join(backendRoot, 'mvnw')

if (!fs.existsSync(mvnw)) {
  console.error('Maven wrapper not found at', backendRoot)
  process.exit(1)
}

console.log('Building Spring Boot backend (this may take a few minutes)...')
execSync(`"${mvnw}" clean package -DskipTests`, {
  cwd: backendRoot,
  stdio: 'inherit',
  env: process.env,
})

const targetDir = path.join(backendRoot, 'target')
const jarName = fs
  .readdirSync(targetDir)
  .find(
    (name) =>
      name.startsWith('CRM_BACKEND') &&
      name.endsWith('.jar') &&
      !name.includes('.original'),
  )

if (!jarName) {
  console.error('No CRM_BACKEND JAR found in', targetDir)
  process.exit(1)
}

await fs.promises.mkdir(destDir, { recursive: true })
await fs.promises.copyFile(path.join(targetDir, jarName), destJar)

const stats = fs.statSync(destJar)
console.log(
  `Backend JAR ready: ${destJar} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`,
)
