/**
 * Optimiza videos descargados manualmente desde Google Flow (labs.google/fx/tools/flow)
 * colocados en `public/videos/` (ej. `hero-intro.mp4`, `dive-00.mp4`, `conn-00.mp4`...)
 * para reproducción en loop fluido (Hero Intro) y fast-scrubbing a 60fps (`scroll-world`),
 * actualizando automáticamente `public/videos/manifest.json`.
 *
 * Uso: npm run videos:optimize
 */
import ffmpegPath from 'ffmpeg-static';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const OUT_DIR = 'public/videos';
const MANIFEST_PATH = path.join(OUT_DIR, 'manifest.json');

await mkdir(OUT_DIR, { recursive: true });
// Normalizar nombres a minúsculas (ej. Hero-intro.mp4 -> hero-intro.mp4)
const rawFiles = await readdir(OUT_DIR);
for (const file of rawFiles) {
  if (file.endsWith('.mp4') && file !== file.toLowerCase()) {
    const src = path.join(OUT_DIR, file);
    const dest = path.join(OUT_DIR, file.toLowerCase());
    await rename(src, dest);
  }
}

const mp4Files = (await readdir(OUT_DIR)).filter(
  (f) => f.endsWith('.mp4') && !f.endsWith('.tmp.mp4')
);

if (mp4Files.length === 0) {
  console.log('ℹ️ No se encontraron archivos .mp4 en public/videos/.');
  process.exit(0);
}

for (const file of mp4Files.sort()) {
  const fullPath = path.join(OUT_DIR, file);
  const tmpPath = path.join(OUT_DIR, `${file}.tmp.mp4`);
  const isIntro = file === 'hero-intro.mp4';

  console.log(`⚙️ Optimizando ${file} (1080p Full HD sin pérdida perceptible, ${isIntro ? 'autoplay loop' : 'scroll-world 60fps scrub'})...`);

  const args = isIntro
    ? [
        '-y',
        '-i',
        fullPath,
        '-an',
        '-vf',
        "fps=24,scale='min(1920,iw)':-2:flags=lanczos",
        '-c:v',
        'libx264',
        '-preset',
        'slow',
        '-profile:v',
        'high',
        '-pix_fmt',
        'yuv420p',
        '-crf',
        '20',
        '-g',
        '48',
        '-movflags',
        '+faststart',
        tmpPath,
      ]
    : [
        '-y',
        '-i',
        fullPath,
        '-an',
        '-vf',
        "fps=24,scale='min(1920,iw)':-2:flags=lanczos",
        '-c:v',
        'libx264',
        '-preset',
        'slow',
        '-profile:v',
        'high',
        '-pix_fmt',
        'yuv420p',
        '-crf',
        '20',
        '-g',
        '3',
        '-keyint_min',
        '3',
        '-bf',
        '0',
        '-movflags',
        '+faststart',
        tmpPath,
      ];

  await execFileAsync(ffmpegPath, args);
  await rm(fullPath, { force: true });
  await rename(tmpPath, fullPath);
  console.log(`   ✓ Listo: ${fullPath}`);
}

const finalFiles = existsSync(OUT_DIR)
  ? (await readdir(OUT_DIR))
      .filter((f) => f.endsWith('.mp4'))
      .sort()
      .map((f) => `/videos/${f}`)
  : [];

await writeFile(
  MANIFEST_PATH,
  JSON.stringify(
    {
      model: 'google-flow-or-omni-flash',
      generated: finalFiles,
      updatedAt: new Date().toISOString(),
    },
    null,
    2
  ) + '\n',
  'utf8'
);

console.log(`\n✅ Manifest actualizado (${finalFiles.length} videos activos en ${MANIFEST_PATH}).`);

