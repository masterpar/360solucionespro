# Kit de Generación en Google Flow — 360° Pro (`scroll-world`)

Todos los fotogramas ya están recortados en proporción exacta **`16:9` (`1920x1080`)** dentro de la carpeta visible **`google-flow-kit/frames/`** para que puedas subirlos directamente desde el Finder de Mac sin carpetas ocultas.

## Instrucciones en Google Flow (https://labs.google/fx/tools/flow)

1. Entra a **Google Flow** → crea o abre un proyecto en formato **Horizontal (`16:9`)**.
2. En la barra inferior selecciona el modo **`Frames to Video`** (*Fotogramas a video*).
3. Sube el **Frame Inicial** y el **Frame Final** indicados abajo y pega el **Prompt**.
4. Descarga cada `.mp4` generado dentro de **`public/videos/`** con el nombre exacto de la columna **Guardar como**.
5. Avísame en el chat (**"listo"**) para ejecutar `npm run videos:optimize` y dejarlos corriendo a `60 fps`.

---

## FASE 1 — Piloto Hero Intro + Fusión `scroll-world` (Solo 2 videos para probar ya)

### 1. `public/videos/hero-intro.mp4` *(Video en vivo en loop cuando entras a la web)*
- **Frame Inicial (`First Frame`):** `google-flow-kit/frames/00-hero-torre.jpg`
- **Frame Final (`Last Frame`):** `google-flow-kit/frames/00-hero-torre.jpg` *(sí, el mismo archivo en ambos para que el loop sea infinito y sin cortes)*
- **Prompt:**
```text
Continuous unbroken seamless looping architectural drone shot hovering gently in front of the modern corporate glass skyscraper at dusk, twilight clouds drifting softly across the sky, warm golden interior engineering lights shimmering on the glass facade, subtle cinematic motion returning smoothly to the exact starting frame, single continuous shot, no scene cuts, no text, no dialogue.
```

### 2. `public/videos/dive-00.mp4` *(Fusión al hacer scroll: de la Torre Hero hacia Arquitectura)*
- **Frame Inicial (`First Frame`):** `google-flow-kit/frames/00-hero-torre.jpg`
- **Frame Final (`Last Frame`):** `google-flow-kit/frames/01-arquitectura-ingenieria.jpg`
- **Prompt:**
```text
Continuous unbroken smooth 3D camera flight pushing forward into the illuminated glass corporate skyscraper and transitioning seamlessly inside a sunlit modern architectural and civil engineering studio with blueprints and scale structural models on the desk, single continuous shot, no cuts, no text, no dialogue.
```

---

## FASE 2 — Resto del Recorrido 360° (Opcional cuando apruebes el Piloto)

### 3. `public/videos/dive-01.mp4` *(Arquitectura → Construcción y Obras Civiles)*
- **Frame Inicial:** `google-flow-kit/frames/01-arquitectura-ingenieria.jpg`
- **Frame Final:** `google-flow-kit/frames/02-construccion-obras-civiles.jpg`
- **Prompt:**
```text
Continuous unbroken smooth cinematic camera flight rising across the architectural blueprints on the studio desk and transitioning seamlessly out into an active civil engineering building construction site with concrete columns, steel reinforcement, and tower cranes at golden hour, single continuous shot, no cuts, no text, no dialogue.
```

### 4. `public/videos/dive-02.mp4` *(Construcción → Mantenimiento y Adecuaciones)*
- **Frame Inicial:** `google-flow-kit/frames/02-construccion-obras-civiles.jpg`
- **Frame Final:** `google-flow-kit/frames/03-mantenimiento-adecuaciones.jpg`
- **Prompt:**
```text
Continuous unbroken smooth cinematic camera flight gliding forward into the concrete building structure as it transitions seamlessly into a finished modern corporate facility interior with precision electrical systems, lighting, and architectural finishes, single continuous shot, no cuts, no text, no dialogue.
```

### 5. `public/videos/dive-03.mp4` *(Mantenimiento → Publicidad y Artes Gráficas)*
- **Frame Inicial:** `google-flow-kit/frames/03-mantenimiento-adecuaciones.jpg`
- **Frame Final:** `google-flow-kit/frames/04-publicidad-artes-graficas.jpg`
- **Prompt:**
```text
Continuous unbroken smooth cinematic camera glide moving forward through the modern corporate hallway and transitioning seamlessly into a high-tech industrial graphic arts, corporate branding, and large-format printing studio, single continuous shot, no cuts, no text, no dialogue.
```

### 6. `public/videos/dive-04.mp4` *(Publicidad → Consultoría y Gestión Ambiental)*
- **Frame Inicial:** `google-flow-kit/frames/04-publicidad-artes-graficas.jpg`
- **Frame Final:** `google-flow-kit/frames/05-consultoria-ambiental.jpg`
- **Prompt:**
```text
Continuous unbroken smooth cinematic camera flight pushing forward through the graphic production studio and emerging seamlessly into an aerial drone view over a lush Colombian tropical river watershed and green ecosystem at sunrise, single continuous shot, no cuts, no text, no dialogue.
```

### 7. `public/videos/dive-05.mp4` *(Ambiental → Suministros y Logística Operativa)*
- **Frame Inicial:** `google-flow-kit/frames/05-consultoria-ambiental.jpg`
- **Frame Final:** `google-flow-kit/frames/06-suministros-logistica.jpg`
- **Prompt:**
```text
Continuous unbroken smooth cinematic camera transition flying forward over the green landscape and entering seamlessly into a clean modern B2B industrial supply, safety equipment, and operational logistics warehouse aisle, single continuous shot, no cuts, no text, no dialogue.
```

### 8. `public/videos/dive-06.mp4` *(Cierre inmersivo en Suministros)*
- **Frame Inicial:** `google-flow-kit/frames/06-suministros-logistica.jpg`
- **Frame Final:** *(Dejar vacío — solo Frame Inicial)*
- **Prompt:**
```text
Continuous unbroken smooth camera dolly gliding slowly forward down the central aisle of the organized modern industrial supply and operational logistics center, warm clean lighting, crisp depth of field, single continuous shot, no cuts, no text, no dialogue.
```

