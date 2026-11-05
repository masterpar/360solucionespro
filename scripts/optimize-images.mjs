/**
 * Optimiza las fotografías maestras (src/assets/photos/*.jpg) para web.
 *  - Recorte uniforme 3:2 (con encuadre configurable)
 *  - WebP responsivo: 640 / 1280 / 1920 / 2560 px
 *  - JPG progresivo (mozjpeg) 1920 px como respaldo
 *
 * Uso: node scripts/optimize-images.mjs
 */
import sharp from 'sharp';
import { mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'src/assets/photos';
const OUT = 'public/images';
const WIDTHS = [640, 1280, 1920, 2560];
const RATIO = 3 / 2;

// Encuadre por imagen (sharp "position") para preservar el sujeto principal
const POSITION = {
  'scene-01-arquitectura': 'bottom',
  'scene-04-publicidad': 'attention',
  'scene-05-ambiental': 'centre',
  'consultoria-tecnica': 'left',
};

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f));

for (const file of files) {
  const name = path.parse(file).name;
  const input = path.join(SRC, file);
  const position = POSITION[name] ?? 'centre';

  for (const w of WIDTHS) {
    await sharp(input)
      .resize({ width: w, height: Math.round(w / RATIO), fit: 'cover', position })
      .webp({ quality: w >= 1920 ? 80 : 78, effort: 6, smartSubsample: true })
      .toFile(`${OUT}/${name}-${w}.webp`);
  }

  await sharp(input)
    .resize({ width: 1920, height: 1280, fit: 'cover', position })
    .jpeg({ quality: 80, mozjpeg: true, progressive: true })
    .toFile(`${OUT}/${name}.jpg`);

  console.log(`✓ ${name}`);
}

