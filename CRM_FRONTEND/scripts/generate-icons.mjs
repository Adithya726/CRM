/**
 * Generates build/icon.png and build/icon.ico from build/icon.svg.
 * Run: npm run icons
 */
import fs from 'fs'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import toIco from 'to-ico'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const buildDir = path.join(__dirname, '..', 'build')
const svgPath = path.join(buildDir, 'icon.svg')

if (!fs.existsSync(svgPath)) {
  console.error('Missing build/icon.svg')
  process.exit(1)
}

const svg = fs.readFileSync(svgPath)

await mkdir(buildDir, { recursive: true })

const png512 = await sharp(svg).resize(512, 512).png().toBuffer()
await writeFile(path.join(buildDir, 'icon.png'), png512)

const icoSizes = [16, 24, 32, 48, 64, 128, 256]
const pngBuffers = await Promise.all(
  icoSizes.map((size) => sharp(svg).resize(size, size).png().toBuffer()),
)
const ico = await toIco(pngBuffers)
await writeFile(path.join(buildDir, 'icon.ico'), ico)

console.log('Generated build/icon.png and build/icon.ico')
