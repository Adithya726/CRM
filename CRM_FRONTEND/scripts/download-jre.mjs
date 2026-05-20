/**
 * Downloads Temurin 17 JRE for the current host OS/arch into resources/jre.
 *
 * - Windows: .zip → PowerShell Expand-Archive
 * - macOS:   .tar.gz → tar package (Adoptium layout: …/Contents/Home/bin/java)
 * - Linux:   .tar.gz (optional; same layout as mac without Contents bundle sometimes)
 */
import fs from 'fs'
import path from 'path'
import https from 'https'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import * as tar from 'tar'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendRoot = path.join(__dirname, '..')
const jreRoot = path.join(frontendRoot, 'resources', 'jre')

function adoptiumUrl(os, arch) {
  const osMap = { win32: 'windows', darwin: 'mac', linux: 'linux' }
  const archMap = {
    x64: 'x64',
    arm64: 'aarch64',
    ia32: 'x32',
  }
  const osName = osMap[os] || 'windows'
  const adoptArch = archMap[arch] || 'x64'
  return `https://api.adoptium.net/v3/binary/latest/17/ga/${osName}/${adoptArch}/jre/hotspot/normal/eclipse?project=jdk`
}

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

function findJavaHomeDir(extractDir) {
  const entries = fs.readdirSync(extractDir)
  const jdk = entries.find(
    (n) => n.startsWith('jdk') || n.startsWith('.jdk') || n.endsWith('.jre') || n.endsWith('.jdk'),
  )
  if (!jdk) return null
  return path.join(extractDir, jdk)
}

function javaExistsAtJreRoot(root) {
  if (process.platform === 'win32') {
    return fs.existsSync(path.join(root, 'bin', 'java.exe'))
  }
  if (process.platform === 'darwin') {
    return fs.existsSync(path.join(root, 'Contents', 'Home', 'bin', 'java'))
  }
  return fs.existsSync(path.join(root, 'bin', 'java'))
}

if (javaExistsAtJreRoot(jreRoot)) {
  console.log('Bundled JRE already present:', jreRoot)
  process.exit(0)
}

const platform = process.platform
const arch = process.env.JRE_ARCH || process.arch
const url = adoptiumUrl(platform, arch === 'ia32' ? 'x64' : arch)

if (platform === 'win32') {
  const tempZip = path.join(frontendRoot, 'resources', 'jre-download.zip')
  const tempExtract = path.join(frontendRoot, 'resources', 'jre-extract')

  console.log('Downloading Temurin 17 JRE for Windows x64...')
  await download(url, tempZip)

  if (fs.existsSync(tempExtract)) fs.rmSync(tempExtract, { recursive: true, force: true })
  fs.mkdirSync(tempExtract, { recursive: true })

  execSync(
    `powershell -NoProfile -Command "Expand-Archive -Path '${tempZip.replace(/'/g, "''")}' -DestinationPath '${tempExtract.replace(/'/g, "''")}' -Force"`,
    { stdio: 'inherit' },
  )

  const jdkDir = findJavaHomeDir(tempExtract)
  if (!jdkDir) {
    console.error('Could not find jdk folder in archive')
    process.exit(1)
  }

  if (fs.existsSync(jreRoot)) fs.rmSync(jreRoot, { recursive: true, force: true })
  fs.mkdirSync(path.dirname(jreRoot), { recursive: true })
  fs.cpSync(jdkDir, jreRoot, { recursive: true })

  fs.unlinkSync(tempZip)
  fs.rmSync(tempExtract, { recursive: true, force: true })

  if (!javaExistsAtJreRoot(jreRoot)) {
    console.error('JRE install failed — java.exe not found under', jreRoot)
    process.exit(1)
  }
} else if (platform === 'darwin' || platform === 'linux') {
  const tempTgz = path.join(frontendRoot, 'resources', 'jre-download.tar.gz')
  const tempExtract = path.join(frontendRoot, 'resources', 'jre-extract')

  console.log(`Downloading Temurin 17 JRE for ${platform}/${arch}...`)
  await download(url, tempTgz)

  if (fs.existsSync(tempExtract)) fs.rmSync(tempExtract, { recursive: true, force: true })
  fs.mkdirSync(tempExtract, { recursive: true })

  await tar.x({ file: tempTgz, cwd: tempExtract, strict: true })

  const jdkDir = findJavaHomeDir(tempExtract)
  if (!jdkDir) {
    console.error('Could not find jdk folder in tarball')
    process.exit(1)
  }

  if (fs.existsSync(jreRoot)) fs.rmSync(jreRoot, { recursive: true, force: true })
  fs.mkdirSync(path.dirname(jreRoot), { recursive: true })
  fs.cpSync(jdkDir, jreRoot, { recursive: true })

  fs.unlinkSync(tempTgz)
  fs.rmSync(tempExtract, { recursive: true, force: true })

  if (!javaExistsAtJreRoot(jreRoot)) {
    console.error('JRE install failed — java not found under', jreRoot)
    process.exit(1)
  }
} else {
  console.error('Unsupported platform for JRE download:', platform)
  process.exit(1)
}

console.log('Bundled JRE ready:', jreRoot)
