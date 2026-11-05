/**
 * Helpers para imágenes responsivas optimizadas (generadas por scripts/optimize-images.mjs).
 * Cada imagen existe como /images/{name}-{640|1280|1920|2560}.webp + /images/{name}.jpg (respaldo).
 */
export const IMAGE_WIDTHS = [640, 1280, 1920, 2560] as const;

export const imgSrc = (name: string, width: (typeof IMAGE_WIDTHS)[number] = 1280) =>
  `/images/${name}-${width}.webp`;

export const imgSrcSet = (name: string) =>
  IMAGE_WIDTHS.map((w) => `/images/${name}-${w}.webp ${w}w`).join(', ');

export const imgFallback = (name: string) => `/images/${name}.jpg`;

