/**
 * Downloads Temurin 17 JRE (Windows x64) into resources/jre for bundling.
 * Skips download when resources/jre/bin/java.exe already exists.
 */
import fs from 'fs'
import path from 'path'
import https from 'https'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendRoot = path.join(__dirname, '..')
const jreRoot = path.join(frontendRoot, 'resources', 'jre')
const javaExe = path.join(jreRoot, 'bin', 'java.exe')

if (process.platform !== 'win32') {
  console.log('JRE download script supports Windows x64 only — skipping')
  process.exit(0)
}

if (fs.existsSync(javaExe)) {
  console.log('Bundled JRE already present:', javaExe)
  process.exit(0)
}

const ADOPTIUM_URL =
  'https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jre/hotspot/normal/eclipse?project=jdk'

const tempZip = path.join(frontendRoot, 'resources', 'jre-download.zip')
const tempExtract = path.join(frontendRoot, 'resources', 'jre-extract')

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const request = (targetUrl) => {
      https
        .get(targetUrl, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            request(res.headers.location)
            return
          }
          if (res.statusCode !== 200) {
            reject(new Error(`Download failed: HTTP ${res.statusCode}`))
            return
          }
          const file = fs.createWriteStream(dest)
          res.pipe(file)
          file.on('finish', () => file.close(resolve))
          file.on('error', reject)
        })
        .on('error', reject)
    }
    request(url)
  })
}

console.log('Downloading Temurin 17 JRE (~45 MB)...')
await download(ADOPTIUM_URL, tempZip)

if (fs.existsSync(tempExtract)) {
  fs.rmSync(tempExtract, { recursive: true, force: true })
}
fs.mkdirSync(tempExtract, { recursive: true })

console.log('Extracting JRE...')
execSync(
  `powershell -NoProfile -Command "Expand-Archive -Path '${tempZip.replace(/'/g, "''")}' -DestinationPath '${tempExtract.replace(/'/g, "''")}' -Force"`,
  { stdio: 'inherit' },
)

const extracted = fs.readdirSync(tempExtract).find((n) => n.startsWith('jdk'))
if (!extracted) {
  console.error('Could not find jdk folder in archive')
  process.exit(1)
}

const extractedRoot = path.join(tempExtract, extracted)
if (fs.existsSync(jreRoot)) {
  fs.rmSync(jreRoot, { recursive: true, force: true })
}
fs.mkdirSync(jreRoot, { recursive: true })
fs.cpSync(extractedRoot, jreRoot, { recursive: true })

fs.unlinkSync(tempZip)
fs.rmSync(tempExtract, { recursive: true, force: true })

if (!fs.existsSync(javaExe)) {
  console.error('JRE install failed — java.exe not found at', javaExe)
  process.exit(1)
}

console.log('Bundled JRE ready:', jreRoot)
