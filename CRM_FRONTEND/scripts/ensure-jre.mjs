import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function hasBundledJava() {
  const exe = process.platform === 'win32' ? 'java.exe' : 'java'
  const win = path.join(root, 'resources', 'jre', 'bin', exe)
  const mac = path.join(root, 'resources', 'jre', 'Contents', 'Home', 'bin', 'java')
  const linux = path.join(root, 'resources', 'jre', 'bin', exe)
  if (process.platform === 'darwin') return fs.existsSync(mac)
  if (process.platform === 'win32') return fs.existsSync(win)
  return fs.existsSync(linux)
}

if (hasBundledJava()) {
  console.log('Bundled JRE present')
  process.exit(0)
}

console.log('Bundled JRE missing — downloading...')
const result = spawnSync('node', ['scripts/download-jre.mjs'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
})
process.exit(result.status ?? 1)
