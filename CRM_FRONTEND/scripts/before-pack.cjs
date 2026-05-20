/**
 * electron-builder beforePack — runs once per target/arch.
 * For macOS multi-arch builds, copies the correct Temurin JRE from jre-cache
 * into resources/jre so extraResources packs the right runtime.
 */
const fs = require('fs')
const path = require('path')

module.exports = async function beforePack(context) {
  const { electronPlatformName, arch } = context

  if (electronPlatformName !== 'darwin') {
    return
  }

  const root = path.join(__dirname, '..')
  const cacheKey = arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64'
  const src = path.join(root, 'resources', 'jre-cache', cacheKey)
  const dest = path.join(root, 'resources', 'jre')

  if (!fs.existsSync(path.join(src, 'Contents', 'Home', 'bin', 'java'))) {
    console.warn(
      `[before-pack] Missing ${src}. Run: npm run download:jre:mac-cache`,
    )
    return
  }

  fs.rmSync(dest, { recursive: true, force: true })
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.cpSync(src, dest, { recursive: true })
  console.log(`[before-pack] macOS ${arch}: copied ${cacheKey} → resources/jre`)
}
