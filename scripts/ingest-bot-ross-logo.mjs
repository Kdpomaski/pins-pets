/**
 * Copy Bot Ross cleaned Pins Pets logos into store / public / resources.
 * Looks at cloud-box paths first, then any files already dropped in store/.
 *
 *   node scripts/ingest-bot-ross-logo.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();

/** Confirmed sources (Kevin 2026-09-05): in-app mark + 1024 store/icon square. */
const CONFIRMED_IN_APP =
  '/workspace/bus/artifacts/pins-pets-logo/pins-pets-logo-v2-clean.png';
const CONFIRMED_ICON_1024 =
  '/workspace/bus/artifacts/pins-pets-logo/pins-pets-logo-v2-clean-1024.png';

const cleanCandidates = [
  CONFIRMED_IN_APP,
  '/workspace/220tech-logos/export/pins-pets-logo-v2-clean.png',
  path.join(root, 'store/pins-pets-logo-v2-clean.png'),
];

const icon1024Candidates = [
  CONFIRMED_ICON_1024,
  '/workspace/220tech-logos/export/pins-pets-logo-v2-clean-1024.png',
  path.join(root, 'store/pins-pets-logo-v2-clean-1024.png'),
];

function firstExisting(paths) {
  return paths.find((p) => fs.existsSync(p));
}

const mark = firstExisting(cleanCandidates);
const icon1024 = firstExisting(icon1024Candidates);

if (!mark && !icon1024) {
  console.error(
    'Bot Ross cleaned logos not found. Checked:\n' +
      [...cleanCandidates, ...icon1024Candidates].map((p) => `  ${p}`).join('\n'),
  );
  process.exit(2);
}

if (mark) {
  const dest = path.join(root, 'public/pins-pets-logo.png');
  fs.copyFileSync(mark, dest);
  fs.copyFileSync(mark, path.join(root, 'store/pins-pets-logo-v2-clean.png'));
  console.log('in-app mark <-', mark);
}

if (icon1024) {
  const src = icon1024;
  const square = await sharp(src)
    .resize(1024, 1024, { fit: 'cover', background: '#000000' })
    .flatten({ background: '#000000' })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toBuffer();

  const writePng = async (dest, size) => {
    await sharp(square).resize(size, size).png({ compressionLevel: 9 }).toFile(dest);
    console.log('wrote', dest, `${size}x${size}`);
  };
  const writeJpg = async (dest, size) => {
    await sharp(square).resize(size, size).jpeg({ quality: 90 }).toFile(dest);
    console.log('wrote', dest, `${size}x${size}`);
  };

  await sharp(square).toFile(path.join(root, 'store/pins-pets-logo-v2-clean-1024.png'));
  await writePng(path.join(root, 'resources/icon.png'), 1024);
  await writePng(path.join(root, 'store/icon-1024.png'), 1024);
  await writePng(path.join(root, 'store/icon-512.png'), 512);
  await writePng(path.join(root, 'public/app-icon.png'), 512);
  await writePng(path.join(root, 'public/icon-512.png'), 512);
  await writePng(path.join(root, 'public/icon-192.png'), 192);
  await writePng(path.join(root, 'public/apple-touch-icon.png'), 180);
  await writeJpg(path.join(root, 'public/app-icon.jpg'), 512);
  await writeJpg(path.join(root, 'public/icon-512.jpg'), 512);
  await writeJpg(path.join(root, 'public/icon-192.jpg'), 192);

  const splashSize = 2732;
  const markPng = await sharp(square).resize(1024, 1024).png().toBuffer();
  await sharp({
    create: { width: splashSize, height: splashSize, channels: 3, background: '#000000' },
  })
    .composite([{ input: markPng, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(root, 'resources/splash.png'));
  console.log('wrote resources/splash.png from Bot Ross 1024');
}

console.log('ingest complete');
