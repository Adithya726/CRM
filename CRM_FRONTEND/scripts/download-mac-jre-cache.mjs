/**
 * Downloads BOTH macOS JREs (Intel x64 + Apple Silicon aarch64) for electron-builder
 * multi-arch packaging. Extracts to:
 *   resources/jre-cache/darwin-x64
 *   resources/jre-cache/darwin-arm64
 *
 * The beforePack hook copies the matching folder into resources/jre for each arch build.
 */
import fs from 'fs'
import path from 'path'
import https from 'https'
import { fileURLToPath } from 'url'
import * as tar from 'tar'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const frontendRoot = path.join(__dirname, '..')
const cacheRoot = path.join(frontendRoot, 'resources', 'jre-cache')

function urlFor(arch) {
  const adoptArch = arch === 'arm64' ? 'aarch64' : 'x64'
  return `https://api.adoptium.net/v3/binary/latest/17/ga/mac/${adoptArch}/jre/hotspot/normal/eclipse?project=jdk`
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

function macJavaExists(root) {
  return fs.existsSync(path.join(root, 'Contents', 'Home', 'bin', 'java'))
}

async function fetchOne(archLabel) {
  const destDir = path.join(cacheRoot, `darwin-${archLabel}`)
  if (macJavaExists(destDir)) {
    console.log(`JRE cache already present: ${destDir}`)
    return
  }

  const tempTgz = path.join(frontendRoot, 'resources', `jre-mac-${archLabel}.tar.gz`)
  const tempExtract = path.join(frontendRoot, 'resources', `jre-extract-${archLabel}`)

  console.log(`Downloading macOS JRE (${archLabel})...`)
  await download(urlFor(archLabel), tempTgz)

  if (fs.existsSync(tempExtract)) fs.rmSync(tempExtract, { recursive: true, force: true })
  fs.mkdirSync(tempExtract, { recursive: true })
  await tar.x({ file: tempTgz, cwd: tempExtract, strict: true })

  const jdkDir = findJavaHomeDir(tempExtract)
  if (!jdkDir) {
    console.error(`Could not find jdk folder for ${archLabel}`)
    process.exit(1)
  }

  if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true, force: true })
  fs.mkdirSync(cacheRoot, { recursive: true })
  fs.cpSync(jdkDir, destDir, { recursive: true })

  fs.unlinkSync(tempTgz)
  fs.rmSync(tempExtract, { recursive: true, force: true })

  if (!macJavaExists(destDir)) {
    console.error(`JRE install failed for ${archLabel}`)
    process.exit(1)
  }
  console.log(`Cached: ${destDir}`)
}

fs.mkdirSync(cacheRoot, { recursive: true })

await fetchOne('arm64')
await fetchOne('x64')

console.log('macOS JRE cache ready for dual-arch builds.')
