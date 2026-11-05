/**
 * Optimiza el logotipo oficial para web:
 *  - Elimina el fondo blanco (alpha real con bordes suavizados / un-premultiply)
 *  - Recorta márgenes sobrantes
 *  - Exporta versión a color y versión blanca (para fondos oscuros) en WebP + PNG @1x/@2x
 *
 * Uso: node scripts/optimize-logo.mjs
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const SRC = 'src/assets/brand/logo-360pro-original.png';
const OUT = 'public/brand';

const BG_LIMIT = 246; // por encima de este valor (canal mínimo) = fondo
const INK_LIMIT = 90; // por debajo = tinta sólida

await mkdir(OUT, { recursive: true });

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;

const color = Buffer.alloc(width * height * 4);
const white = Buffer.alloc(width * height * 4);

for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const m = Math.min(r, g, b);
  let a = (BG_LIMIT - m) / (BG_LIMIT - INK_LIMIT);
  a = Math.max(0, Math.min(1, a));

  // Recuperar color original quitando la mezcla con el fondo blanco
  const un = (c) => (a > 0 ? Math.max(0, Math.min(255, Math.round((c - (1 - a) * 255) / a))) : 0);
  const ur = un(r);
  const ug = un(g);
  const ub = un(b);
  const alpha = Math.round(a * 255);

  color[j] = ur;
  color[j + 1] = ug;
  color[j + 2] = ub;
  color[j + 3] = alpha;

  // Versión para fondo oscuro: azul marino -> blanco, naranja se conserva
  const isNavy = ub >= ur;
  white[j] = isNavy ? 255 : ur;
  white[j + 1] = isNavy ? 255 : ug;
  white[j + 2] = isNavy ? 255 : ub;
  white[j + 3] = alpha;
}

const raw = { raw: { width, height, channels: 4 } };

async function exportVariant(buffer, name) {
  const trimmed = await sharp(buffer, raw).trim({ threshold: 1 }).png().toBuffer();
  const sizes = [
    { suffix: '', w: 360 },
    { suffix: '@2x', w: 720 },
  ];
  for (const { suffix, w } of sizes) {
    const base = sharp(trimmed).resize({ width: w, withoutEnlargement: true });
    await base.clone().webp({ quality: 92, alphaQuality: 100, effort: 6 }).toFile(`${OUT}/${name}${suffix}.webp`);
    await base.clone().png({ compressionLevel: 9, palette: true, quality: 95, effort: 10 }).toFile(`${OUT}/${name}${suffix}.png`);
  }
  const meta = await sharp(trimmed).metadata();
  console.log(`${name}: ${meta.width}x${meta.height} (ratio ${(meta.width / meta.height).toFixed(3)})`);
}

await exportVariant(color, 'logo-360pro');
await exportVariant(white, 'logo-360pro-white');

// Ícono / favicon cuadrado con el isotipo "360°" sobre fondo azul marino
console.log('Listo ->', OUT);

