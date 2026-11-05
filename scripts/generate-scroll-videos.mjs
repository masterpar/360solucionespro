/**
 * ============================================================================
 * 360° PRO — GENERADOR AUTOMÁTICO DE VIDEOS SCROLL-WORLD (GEMINI OMNI FLASH)
 * ============================================================================
 * Genera la cadena continua de videos 3D para `ScrollWorldEngine` siguiendo la
 * "Seam Rule" de oso95/scroll-world con el SDK oficial `@google/genai` y el
 * modelo `gemini-omni-1.1-flash`:
 *
 *  1. Normaliza las fotos maestras (`src/assets/photos/*.jpg`) a 1920x1080 (16:9).
 *  2. Genera `dive-00.mp4 .. dive-06.mp4` (`<FIRST_FRAME>` vuelo continuo hacia adentro).
 *  3. Extrae con `ffmpeg-static` el último fotograma exacto de cada `dive-0i.mp4`.
 *  4. Genera `conn-00.mp4 .. conn-05.mp4` (`<FIRST_FRAME> <LAST_FRAME>`) interpolando
 *     desde el último frame exacto de `dive-0i` hasta el primer frame de la escena `i+1`.
 *  5. Re-codifica cada clip para fast-scrubbing Web a 60fps (`-an -g 2 -bf 0 +faststart`)
 *     en `public/videos/` y actualiza `public/videos/manifest.json`.
 *
 * Uso:
 *   npm run videos:pilot              # Genera piloto (Hero 00 -> Conector 00 -> Escena 01)
 *   npm run videos:all                # Genera/reanuda toda la cadena (7 dives + 6 conectores)
 *   node scripts/generate-scroll-videos.mjs --only dive-00 --force
 *   node scripts/generate-scroll-videos.mjs --pilot --resolution 1080p
 */

import { GoogleGenAI } from '@google/genai';
import ffmpegPath from 'ffmpeg-static';
import sharp from 'sharp';
import { execFile } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const MODEL = 'gemini-omni-1.1-flash';
const PHOTOS_DIR = 'src/assets/photos';
const WORK_DIR = '.cache/scroll-videos';
const OUT_DIR = 'public/videos';
const MANIFEST_PATH = path.join(OUT_DIR, 'manifest.json');

/**
 * Definición de los 7 capítulos del recorrido 360° Pro (Beat 00 Hero + Beats 01..06)
 */
const SCENES = [
  {
    index: 0,
    code: '00',
    sourcePhoto: 'hero-main.jpg',
    cropPosition: 'centre',
    divePrompt:
      'Continuous unbroken smooth 3D drone camera push-in gliding forward toward the modern corporate glass skyscraper facade at dusk, subtle realistic architectural reflections shifting on the glass windows, warm golden engineering lights glowing inside, cinematic architectural film, single continuous shot, no scene cuts, no text, no dialogue.',
    connectorToNextPrompt:
      'Continuous unbroken smooth cinematic camera flight transitioning seamlessly from the exterior glass corporate tower directly into a modern architectural engineering studio with blueprints and structural models on the desk, single continuous shot, no cuts, no text, no dialogue.',
  },
  {
    index: 1,
    code: '01',
    sourcePhoto: 'scene-01-arquitectura.jpg',
    cropPosition: 'bottom',
    divePrompt:
      'Continuous unbroken smooth camera dolly forward across the architectural blueprints, structural CAD plans, and scale building model in a sunlit modern engineering studio, crisp depth of field, single continuous shot, no scene cuts, no text, no dialogue.',
    connectorToNextPrompt:
      'Continuous unbroken smooth cinematic camera flight rising from the architectural blueprints and transitioning seamlessly out into an active civil engineering construction site with concrete structure and tower cranes, single continuous shot, no cuts, no text, no dialogue.',
  },
  {
    index: 2,
    code: '02',
    sourcePhoto: 'scene-02-construccion.jpg',
    cropPosition: 'centre',
    divePrompt:
      'Continuous unbroken smooth aerial camera push-in through a modern civil engineering and building construction site, steel reinforcement, concrete columns, golden sunlight, realistic industrial atmosphere, single continuous shot, no scene cuts, no text, no dialogue.',
    connectorToNextPrompt:
      'Continuous unbroken smooth cinematic camera flight moving inside the structure as it transitions seamlessly into a finished modern corporate building interior undergoing precision electrical and architectural maintenance, single continuous shot, no cuts, no text, no dialogue.',
  },
  {
    index: 3,
    code: '03',
    sourcePhoto: 'scene-03-mantenimiento.jpg',
    cropPosition: 'centre',
    divePrompt:
      'Continuous unbroken smooth camera glide forward through a clean modern institutional facility interior showing precision electrical installation, lighting systems, and architectural finishes, single continuous shot, no scene cuts, no text, no dialogue.',
    connectorToNextPrompt:
      'Continuous unbroken smooth cinematic camera transition gliding forward from the corporate facility interior into a high-tech large-format industrial graphic production and corporate signage studio, single continuous shot, no cuts, no text, no dialogue.',
  },
  {
    index: 4,
    code: '04',
    sourcePhoto: 'scene-04-publicidad.jpg',
    cropPosition: 'attention',
    divePrompt:
      'Continuous unbroken smooth camera push-in inside a modern industrial graphic arts and large-format printing studio, vibrant corporate signage and precision print machinery in motion, crisp studio lighting, single continuous shot, no scene cuts, no text, no dialogue.',
    connectorToNextPrompt:
      'Continuous unbroken smooth cinematic camera flight sweeping forward out of the studio window into a lush Colombian tropical river basin and sustainable ecosystem landscape at golden hour, single continuous shot, no cuts, no text, no dialogue.',
  },
  {
    index: 5,
    code: '05',
    sourcePhoto: 'scene-05-ambiental.jpg',
    cropPosition: 'centre',
    divePrompt:
      'Continuous unbroken smooth aerial drone flight gliding gently over a pristine Colombian Llanos river watershed surrounded by lush green biodiversity and morning mist, natural sunlight, single continuous shot, no scene cuts, no text, no dialogue.',
    connectorToNextPrompt:
      'Continuous unbroken smooth cinematic camera transition flying forward from the green landscape seamlessly into a modern organized B2B industrial supply and operational logistics warehouse, single continuous shot, no cuts, no text, no dialogue.',
  },
  {
    index: 6,
    code: '06',
    sourcePhoto: 'scene-06-suministros.jpg',
    cropPosition: 'centre',
    divePrompt:
      'Continuous unbroken smooth camera dolly forward down the central aisle of a modern high-tech industrial supply, safety equipment, and operational logistics center, warm clean industrial lighting, single continuous shot, no scene cuts, no text, no dialogue.',
  },
];

function loadEnvFiles() {
  for (const envFile of ['.env.local', '.env']) {
    if (!existsSync(envFile)) continue;
    const raw = readFileSync(envFile, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

function parseArgs(argv) {
  const opts = {
    pilot: false,
    force: false,
    only: null,
    resolution: '720p',
    duration: '5s',
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--pilot') opts.pilot = true;
    else if (arg === '--force') opts.force = true;
    else if (arg === '--only' && argv[i + 1]) opts.only = argv[++i];
    else if (arg === '--resolution' && argv[i + 1]) opts.resolution = argv[++i];
    else if (arg === '--duration' && argv[i + 1]) {
      const raw = argv[++i];
      opts.duration = raw.endsWith('s') ? raw : `${raw}s`;
    }
  }
  return opts;
}

async function prepare16x9Keyframe(sourcePath, outPath, position = 'centre') {
  await sharp(sourcePath)
    .resize({ width: 1920, height: 1080, fit: 'cover', position })
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(outPath);
  return outPath;
}

async function extractLastFrame(videoPath, outJpgPath) {
  if (!ffmpegPath) {
    throw new Error('No se encontró el binario de ffmpeg-static.');
  }
  await execFileAsync(ffmpegPath, [
    '-y',
    '-sseof',
    '-0.12',
    '-i',
    videoPath,
    '-frames:v',
    '1',
    '-q:v',
    '2',
    outJpgPath,
  ]);
  return outJpgPath;
}

async function optimizeForAutoplayLoop(rawVideoPath, finalVideoPath) {
  if (!ffmpegPath) {
    throw new Error('No se encontró el binario de ffmpeg-static.');
  }
  // Compresión eficiente para reproducción continua en loop (autoplay en la intro del Hero)
  await execFileAsync(ffmpegPath, [
    '-y',
    '-i',
    rawVideoPath,
    '-an',
    '-vf',
    'fps=24,scale=1280:720:flags=lanczos',
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-profile:v',
    'main',
    '-pix_fmt',
    'yuv420p',
    '-crf',
    '21',
    '-g',
    '48',
    '-movflags',
    '+faststart',
    finalVideoPath,
  ]);
}

async function optimizeForScrollScrubbing(rawVideoPath, finalVideoPath) {
  if (!ffmpegPath) {
    throw new Error('No se encontró el binario de ffmpeg-static.');
  }
  // Keyframes cada 2 frames (-g 2), sin B-frames (-bf 0), sin audio (-an) y +faststart
  // para que video.currentTime responda instantáneamente a 60fps en desktop y móvil.
  await execFileAsync(ffmpegPath, [
    '-y',
    '-i',
    rawVideoPath,
    '-an',
    '-vf',
    'fps=24,scale=1280:720:flags=lanczos',
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-profile:v',
    'main',
    '-pix_fmt',
    'yuv420p',
    '-crf',
    '23',
    '-g',
    '2',
    '-keyint_min',
    '2',
    '-bf',
    '0',
    '-movflags',
    '+faststart',
    finalVideoPath,
  ]);
}

async function updateManifest() {
  const files = existsSync(OUT_DIR)
    ? (await readdir(OUT_DIR))
        .filter((f) => f.endsWith('.mp4'))
        .sort()
        .map((f) => `/videos/${f}`)
    : [];

  await writeFile(
    MANIFEST_PATH,
    JSON.stringify(
      {
        model: MODEL,
        generated: files,
        updatedAt: new Date().toISOString(),
      },
      null,
      2
    ) + '\n',
    'utf8'
  );
  return files;
}

async function generateClipWithOmni({
  ai,
  label,
  firstFramePath,
  lastFramePath,
  prompt,
  resolution,
  duration,
  rawOutPath,
  finalOutPath,
  isAutoplayLoop = false,
}) {
  const firstB64 = readFileSync(firstFramePath).toString('base64');
  const input = [{ type: 'image', data: firstB64, mime_type: 'image/jpeg' }];

  let taggedPrompt = prompt;
  if (lastFramePath) {
    const lastB64 = readFileSync(lastFramePath).toString('base64');
    input.push({ type: 'image', data: lastB64, mime_type: 'image/jpeg' });
    taggedPrompt = `<FIRST_FRAME> <LAST_FRAME> ${prompt}`;
  } else {
    taggedPrompt = `<FIRST_FRAME> ${prompt}`;
  }
  input.push({ type: 'text', text: taggedPrompt });

  console.log(`\n🎬 [${label}] Generando con ${MODEL} (${resolution}, ${duration})...`);
  const started = Date.now();

  const interaction = await ai.interactions.create({
    model: MODEL,
    input,
    response_format: {
      type: 'video',
      aspect_ratio: '16:9',
      resolution,
      duration,
    },
  });

  let videoBytes = null;
  if (interaction.output_video?.data) {
    videoBytes = Buffer.from(interaction.output_video.data, 'base64');
  } else if (interaction.output_video?.uri) {
    const downloaded = await ai.files.download({ file: interaction.output_video.uri });
    videoBytes = Buffer.from(downloaded);
  } else if (Array.isArray(interaction.steps)) {
    for (const step of interaction.steps) {
      if (step.type !== 'model_output' || !Array.isArray(step.content)) continue;
      for (const part of step.content) {
        if (part.type === 'video' && part.data) {
          videoBytes = Buffer.from(part.data, 'base64');
        }
      }
    }
  }

  if (!videoBytes || videoBytes.length === 0) {
    throw new Error(`[${label}] La respuesta de Gemini Omni Flash no incluyó bytes de video.`);
  }

  await writeFile(rawOutPath, videoBytes);
  console.log(
    `   ↳ Video base recibido (${(videoBytes.length / 1024 / 1024).toFixed(2)} MB) en ${((Date.now() - started) / 1000).toFixed(1)}s. Optimizando MP4...`
  );

  if (isAutoplayLoop) {
    await optimizeForAutoplayLoop(rawOutPath, finalOutPath);
  } else {
    await optimizeForScrollScrubbing(rawOutPath, finalOutPath);
  }
  const generatedList = await updateManifest();
  console.log(`   ✓ Guardado en ${finalOutPath} (${generatedList.length} clips activos en manifest.json)`);
}

async function main() {
  loadEnvFiles();
  const opts = parseArgs(process.argv.slice(2));

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error(
      '\n❌ Falta GEMINI_API_KEY.\n' +
        'Agrega tu llave en `.env.local` (ignorado por git):\n\n' +
        '  GEMINI_API_KEY="AIza..."\n\n' +
        'O ejecútalo pasando la variable en terminal:\n' +
        '  GEMINI_API_KEY="tu_api_key" npm run videos:pilot\n'
    );
    process.exit(1);
  }

  await mkdir(WORK_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { timeout: 600_000 },
  });

  // 1. Preparar todos los fotogramas maestros 16:9 (1920x1080)
  console.log('📐 Normalizando fotogramas base a 16:9 (1920x1080)...');
  const startFrames = [];
  for (const scene of SCENES) {
    const srcPath = path.join(PHOTOS_DIR, scene.sourcePhoto);
    const outFrame = path.join(WORK_DIR, `start-${scene.code}.jpg`);
    await prepare16x9Keyframe(srcPath, outFrame, scene.cropPosition);
    startFrames.push(outFrame);
  }

  // 1.5. Generar VIDEO INTRO EN VIVO DEL HERO (loop continuo sin cortes: first_frame === last_frame)
  const heroIntroId = 'hero-intro';
  const heroIntroRaw = path.join(WORK_DIR, `${heroIntroId}-raw.mp4`);
  const heroIntroOut = path.join(OUT_DIR, `${heroIntroId}.mp4`);
  const shouldRunIntro =
    (!opts.only || opts.only === heroIntroId) && (opts.force || !existsSync(heroIntroOut));

  if (shouldRunIntro) {
    await generateClipWithOmni({
      ai,
      label: heroIntroId,
      firstFramePath: startFrames[0],
      lastFramePath: startFrames[0], // Mismo fotograma inicial y final => loop infinito perfecto
      prompt:
        'Continuous unbroken seamless looping architectural drone shot hovering gently in front of the modern corporate glass skyscraper at dusk, clouds drifting softly across the twilight sky, warm golden interior engineering lights shimmering on the glass facade, subtle cinematic atmospheric motion returning smoothly to the exact starting frame, single continuous shot, no scene cuts, no text, no dialogue.',
      resolution: opts.resolution,
      duration: '8s',
      rawOutPath: heroIntroRaw,
      finalOutPath: heroIntroOut,
      isAutoplayLoop: true,
    });
  } else if (existsSync(heroIntroOut)) {
    console.log(`⏭️  [${heroIntroId}] Ya existe en ${heroIntroOut}, reutilizando.`);
  }

  const maxSceneIndex = opts.pilot ? 1 : SCENES.length - 1;

  // 2. Generar clips DIVE (vuelo hacia adentro de cada escena) + extraer último frame
  const diveEndFrames = {};
  for (let i = 0; i <= maxSceneIndex; i++) {
    const scene = SCENES[i];
    const clipId = `dive-${scene.code}`;
    const rawOut = path.join(WORK_DIR, `${clipId}-raw.mp4`);
    const finalOut = path.join(OUT_DIR, `${clipId}.mp4`);
    const endFrameOut = path.join(WORK_DIR, `end-${scene.code}.jpg`);

    const shouldRun =
      (!opts.only || opts.only === clipId) && (opts.force || !existsSync(finalOut));

    if (shouldRun) {
      await generateClipWithOmni({
        ai,
        label: clipId,
        firstFramePath: startFrames[i],
        lastFramePath: null,
        prompt: scene.divePrompt,
        resolution: opts.resolution,
        duration: opts.duration,
        rawOutPath: rawOut,
        finalOutPath: finalOut,
      });
    } else if (existsSync(finalOut)) {
      console.log(`⏭️  [${clipId}] Ya existe en ${finalOut}, reutilizando.`);
    }

    if (existsSync(finalOut)) {
      await extractLastFrame(existsSync(rawOut) ? rawOut : finalOut, endFrameOut);
      diveEndFrames[i] = endFrameOut;
    }
  }

  // 3. Generar clips CONNECTOR (Seam Rule: último frame de dive-i -> primer frame de escena i+1)
  const maxConnIndex = opts.pilot ? 0 : SCENES.length - 2;
  for (let i = 0; i <= maxConnIndex; i++) {
    const scene = SCENES[i];
    const clipId = `conn-${scene.code}`;
    if (opts.only && opts.only !== clipId) continue;

    const finalOut = path.join(OUT_DIR, `${clipId}.mp4`);
    if (!opts.force && existsSync(finalOut)) {
      console.log(`⏭️  [${clipId}] Ya existe en ${finalOut}, reutilizando.`);
      continue;
    }

    const fromFrame = diveEndFrames[i] || startFrames[i];
    const toFrame = startFrames[i + 1];
    const rawOut = path.join(WORK_DIR, `${clipId}-raw.mp4`);

    await generateClipWithOmni({
      ai,
      label: clipId,
      firstFramePath: fromFrame,
      lastFramePath: toFrame,
      prompt: scene.connectorToNextPrompt,
      resolution: opts.resolution,
      duration: opts.duration,
      rawOutPath: rawOut,
      finalOutPath: finalOut,
    });
  }

  const totalGenerated = await updateManifest();
  console.log(`\n✅ Proceso finalizado. Clips activos (${totalGenerated.length}):`);
  for (const item of totalGenerated) {
    console.log(`   • ${item}`);
  }
}

main().catch((err) => {
  const rawMsg = String(err?.message || err);
  const safeMsg = rawMsg.replace(/AIza[0-9A-Za-z_-]{20,}/g, '[REDACTED_KEY]');
  console.error('\n❌ Error generando videos:', safeMsg);
  process.exit(1);
});

