import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sizes = [72, 96, 128, 144, 152, 167, 180, 192, 384, 512]
const sourceIcon = path.join(__dirname, '../src/assets/icon.svg')
const outputDir = path.join(__dirname, '../public/icons')

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// Generate icons for each size
sizes.forEach((size) => {
  sharp(sourceIcon)
    .resize(size, size)
    .png()
    .toFile(path.join(outputDir, `icon-${size}x${size}.png`))
    .then(() => `Generated ${size}x${size} icon`)
    .catch((err) => console.error(`Error generating ${size}x${size} icon:`, err))
})

// Generate splash screen
sharp(sourceIcon)
  .resize(2048, 2048)
  .png()
  .toFile(path.join(__dirname, '../public/splash.png'))
  .then(() => 'Generated splash screen')
  .catch((err) => console.error('Error generating splash screen:', err))
