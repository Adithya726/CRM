import fs from 'fs'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import toIco from 'to-ico'
import * as png2icons from 'png2icons'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const buildDir = path.join(__dirname, '..', 'build')
const svgPath = path.join(buildDir, 'icon.svg')

if (!fs.existsSync(svgPath)) {
  console.error('Missing build/icon.svg')
  process.exit(1)
}

const svg = fs.readFileSync(svgPath)

await mkdir(buildDir, { recursive: true })

const png1024 = await sharp(svg).resize(1024, 1024).png().toBuffer()
await writeFile(path.join(buildDir, 'icon.png'), png1024)

const icoSizes = [16, 24, 32, 48, 64, 128, 256]
const pngBuffers = await Promise.all(
  icoSizes.map((size) => sharp(svg).resize(size, size).png().toBuffer()),
)
const ico = await toIco(pngBuffers)
await writeFile(path.join(buildDir, 'icon.ico'), ico)

const icns = png2icons.createICNS(png1024, png2icons.BILINEAR, 0)
if (!icns) {
  console.error('Failed to generate icns')
  process.exit(1)
}
await writeFile(path.join(buildDir, 'icon.icns'), icns)

console.log('Generated build/icon.png, icon.ico, and icon.icns')
