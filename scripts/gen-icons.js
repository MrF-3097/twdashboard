'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const srcPath = path.resolve(__dirname, '..', 'public', 'Path 1.png');
  const outDir = path.resolve(__dirname, '..', 'public', 'icons');

  if (!fs.existsSync(srcPath)) {
    console.error(`[icons] Source icon not found at ${srcPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const tasks = [
    { size: 192, out: path.join(outDir, 'icon-192.png') },
    { size: 512, out: path.join(outDir, 'icon-512.png') },
  ];

  for (const { size, out } of tasks) {
    try {
      await sharp(srcPath).resize(size, size, { fit: 'cover' }).png().toFile(out);
      console.log(`[icons] Wrote ${out}`);
    } catch (e) {
      console.error(`[icons] Failed to write ${out}:`, e.message);
      process.exit(1);
    }
  }

  console.log('[icons] Done.');
}

main().catch((e) => {
  console.error('[icons] Unexpected error:', e);
  process.exit(1);
});


