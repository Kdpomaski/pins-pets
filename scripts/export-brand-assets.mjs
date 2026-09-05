/**
 * Re-export the Pins Pets mark onto a solid black square.
 * Prefers Bot Ross cleaned 1024 PNG when present; otherwise SVG mark.
 * Full-bleed, no alpha, no baked rounded corners.
 *
 *   node scripts/export-brand-assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const svgPath = path.join(root, 'store/icon-1024.svg');
const botRoss1024 = [
  '/workspace/bus/artifacts/pins-pets-logo/pins-pets-logo-v2-clean-1024.png',
  path.join(root, 'store/pins-pets-logo-v2-clean-1024.png'),
  '/workspace/220tech-logos/export/pins-pets-logo-v2-clean-1024.png',
].find((p) => fs.existsSync(p));

const sourceLabel = botRoss1024 ? `Bot Ross PNG (${botRoss1024})` : 'SVG mark';

async function raster(size, dest, format) {
  const img = botRoss1024
    ? sharp(botRoss1024).resize(size, size, { fit: 'cover', background: '#000000' })
    : sharp(fs.readFileSync(svgPath), { density: 384 }).resize(size, size, { fit: 'fill' });
  const flat = img.flatten({ background: '#000000' }).removeAlpha();
  if (format === 'jpg') await flat.jpeg({ quality: 90 }).toFile(dest);
  else await flat.png({ compressionLevel: 9 }).toFile(dest);
  console.log('wrote', dest, `${size}x${size}`, 'from', sourceLabel);
}

await raster(1024, path.join(root, 'resources/icon.png'), 'png');
await raster(1024, path.join(root, 'store/icon-1024.png'), 'png');
await raster(512, path.join(root, 'store/icon-512.png'), 'png');
await raster(512, path.join(root, 'public/app-icon.png'), 'png');
await raster(512, path.join(root, 'public/icon-512.png'), 'png');
await raster(192, path.join(root, 'public/icon-192.png'), 'png');
await raster(180, path.join(root, 'public/apple-touch-icon.png'), 'png');
await raster(512, path.join(root, 'public/app-icon.jpg'), 'jpg');
await raster(512, path.join(root, 'public/icon-512.jpg'), 'jpg');
await raster(192, path.join(root, 'public/icon-192.jpg'), 'jpg');

const splashSize = 2732;
const markSize = 1024;
const mark = botRoss1024
  ? await sharp(botRoss1024)
      .resize(markSize, markSize, { fit: 'cover', background: '#000000' })
      .flatten({ background: '#000000' })
      .removeAlpha()
      .png()
      .toBuffer()
  : await sharp(fs.readFileSync(svgPath), { density: 384 })
      .resize(markSize, markSize, { fit: 'fill' })
      .flatten({ background: '#000000' })
      .removeAlpha()
      .png()
      .toBuffer();

await sharp({
  create: { width: splashSize, height: splashSize, channels: 3, background: '#000000' },
})
  .composite([{ input: mark, gravity: 'center' }])
  .png({ compressionLevel: 9 })
  .toFile(path.join(root, 'resources/splash.png'));
console.log('wrote resources/splash.png from', sourceLabel);

console.log('brand icons exported');
