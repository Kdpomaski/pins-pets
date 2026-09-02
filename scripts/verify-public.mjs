import fs from 'fs';

const required = [
  'public/body-map/dog-side.jpg',
  'public/body-map/dog-top.jpg',
  'public/body-map/cat-side.jpg',
  'public/body-map/cat-top.jpg',
  'public/body-map/other-side.jpg',
  'public/body-map/other-top.jpg',
  'public/manifest.json',
  'public/icon-192.png',
  'public/icon-512.png',
  'public/favicon.svg',
];

const missing = required.filter((file) => !fs.existsSync(file));

if (missing.length > 0) {
  console.error('Missing required public assets:');
  missing.forEach((file) => console.error(`  - ${file}`));
  process.exit(1);
}

console.log('Public assets verified.');
