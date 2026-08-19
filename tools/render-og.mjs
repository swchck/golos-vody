// Renders tools/og.html to public/og.png (1200x630) for social sharing.
// Usage: node tools/render-og.mjs
import { chromium } from 'playwright'
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const HTML = 'file://' + resolve(here, 'og.html')
const OUT = resolve(here, '../public/og.png')

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 })
await page.goto(HTML, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(400)
const buf = await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 630 } })
await browser.close()

// render at 2x, downscale to a crisp full-color 1200x630 (no palette quantization)
await sharp(buf).resize(1200, 630).png({ palette: false, compressionLevel: 9 }).toFile(OUT)
console.log('wrote', OUT)
