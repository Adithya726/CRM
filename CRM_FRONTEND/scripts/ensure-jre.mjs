import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const javaExe = path.join(__dirname, '..', 'resources', 'jre', 'bin', 'java.exe')

if (fs.existsSync(javaExe)) {
  console.log('Bundled JRE present')
  process.exit(0)
}

console.log('Bundled JRE missing — downloading...')
const result = spawnSync('node', ['scripts/download-jre.mjs'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  shell: true,
})
process.exit(result.status ?? 1)
