/**
 * ============================================================================
 * SCROLL-WORLD SCRUB ENGINE (Adapted from oso95/scroll-world architecture)
 * ============================================================================
 * Maps vertical scroll coordinates deterministically to camera flight time:
 *   scroll position === camera timestamp / scene timeline
 *
 * Dual-Mode Architecture:
 * 1. Video Chain Mode (`diveVideo` + `connectorVideo` blobs, frame-exact seams)
 * 2. High-DPI 3D Perspective Canvas Flight Mode (active immediately with
 *    thematic stills, enforcing the Seam Rule so end-scale of Connector[i]
 *    equals exact start-scale of Dive[i+1] = 1.03x with zero cuts or pops).
 */

export interface EngineSceneConfig {
  id: string;
  beatNumber: string;
  stillImage: string;
  fallbackStill: string;
  diveVideo?: string;
  connectorVideo?: string;
}

const DIVE_SPLIT = 0.66; // 66% scene dive-in, 34% seamless connector flight
const START_SCALE = 1.03;
const DIVE_END_SCALE = 1.36;
const PORTAL_OUT_SCALE = 2.45;
const PORTAL_IN_START_SCALE = 0.84;

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class ScrollWorldEngine {
  private trackEl: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scenes: EngineSceneConfig[];
  private images: (HTMLImageElement | null)[] = [];
  private videoMap: Map<string, HTMLVideoElement> = new Map();

  private beatEls: HTMLElement[] = [];
  private chapterBtns: HTMLElement[] = [];
  private progressFillEl: HTMLElement | null;
  private degreeReadoutEl: HTMLElement | null;
  private sceneCounterEl: HTMLElement | null;
  private phaseBadgeEl: HTMLElement | null;

  private targetProgress = 0;
  private currentProgress = 0;
  private pointerX = 0;
  private pointerY = 0;
  private currentPointerX = 0;
  private currentPointerY = 0;

  private rafId: number | null = null;
  private isVisible = true;
  private reducedMotion = false;
  private logicalWidth = 0;
  private logicalHeight = 0;

  constructor(trackEl: HTMLElement, scenes: EngineSceneConfig[]) {
    this.trackEl = trackEl;
    this.scenes = scenes;

    const canvas = trackEl.querySelector<HTMLCanvasElement>('[data-sw-canvas]');
    if (!canvas) {
      throw new Error('ScrollWorldEngine: Missing [data-sw-canvas] element.');
    }
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('ScrollWorldEngine: Unable to acquire 2D context.');
    }
    this.ctx = context;

    this.beatEls = Array.from(trackEl.querySelectorAll<HTMLElement>('[data-sw-beat]'));
    this.chapterBtns = Array.from(trackEl.querySelectorAll<HTMLElement>('[data-sw-jump]'));
    this.progressFillEl = trackEl.querySelector<HTMLElement>('[data-sw-progress-fill]');
    this.degreeReadoutEl = trackEl.querySelector<HTMLElement>('[data-sw-degree]');
    this.sceneCounterEl = trackEl.querySelector<HTMLElement>('[data-sw-counter]');
    this.phaseBadgeEl = trackEl.querySelector<HTMLElement>('[data-sw-phase]');

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.initAssets();
    this.handleResize();
    this.bindEvents();
    this.updateTargetScroll();
    this.currentProgress = this.targetProgress;
    this.startLoop();
  }

  private initAssets(): void {
    this.images = new Array(this.scenes.length).fill(null);

    this.scenes.forEach((scene, index) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        this.images[index] = img;
        this.renderFrame();
      };
      img.onerror = () => {
        if (scene.fallbackStill && img.src !== scene.fallbackStill) {
          const fallback = new Image();
          fallback.crossOrigin = 'anonymous';
          fallback.onload = () => {
            this.images[index] = fallback;
            this.renderFrame();
          };
          fallback.src = scene.fallbackStill;
        }
      };
      img.src = this.pickResponsiveStill(scene.stillImage);

      // Preload optional oso95/scroll-world MP4 blobs if configured
      if (scene.diveVideo) {
        this.preloadVideoBlob(`dive-${index}`, scene.diveVideo);
      }
      if (scene.connectorVideo) {
        this.preloadVideoBlob(`conn-${index}`, scene.connectorVideo);
      }
    });
  }

  /** Selecciona la variante WebP adecuada (640/1280/1920/2560) según el ancho físico del viewport */
  private pickResponsiveStill(src: string): string {
    const match = src.match(/^(.*)-(\d+)\.webp$/);
    if (!match) return src;
    const physical = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);
    const width = physical <= 900 ? 1280 : physical <= 1920 ? 1920 : 2560;
    return `${match[1]}-${width}.webp`;
  }

  private async preloadVideoBlob(key: string, url: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) return;
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.src = objectUrl;
      video.load();
      this.videoMap.set(key, video);
    } catch {
      // Gracefully fall back to 3D still-frame camera flight
    }
  }

  private bindEvents(): void {
    window.addEventListener('scroll', () => this.updateTargetScroll(), { passive: true });
    window.addEventListener('resize', () => {
      this.handleResize();
      this.updateTargetScroll();
      this.renderFrame();
    });

    this.trackEl.addEventListener(
      'pointermove',
      (e: PointerEvent) => {
        if (this.reducedMotion) return;
        const rect = this.canvas.getBoundingClientRect();
        this.pointerX = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
        this.pointerY = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
      },
      { passive: true }
    );

    // Interactive chapter jump buttons on the HUD scrub rail
    this.chapterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.swJump || '0');
        const total = this.scenes.length;
        const desiredProgress = clamp((idx + 0.22) / total, 0, 0.98);
        const rect = this.trackEl.getBoundingClientRect();
        const trackTop = window.scrollY + rect.top;
        const scrollable = Math.max(1, this.trackEl.offsetHeight - window.innerHeight);
        window.scrollTo({
          top: trackTop + desiredProgress * scrollable,
          behavior: this.reducedMotion ? 'auto' : 'smooth',
        });
      });
    });

    // Pause heavy rendering when completely off-screen
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          this.isVisible = entry.isIntersecting;
        });
      },
      { rootMargin: '250px 0px' }
    );
    observer.observe(this.trackEl);
  }

  private handleResize(): void {
    const viewport = this.canvas.parentElement;
    if (!viewport) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.logicalWidth = viewport.clientWidth;
    this.logicalHeight = viewport.clientHeight;
    this.canvas.width = Math.floor(this.logicalWidth * dpr);
    this.canvas.height = Math.floor(this.logicalHeight * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private updateTargetScroll(): void {
    const rect = this.trackEl.getBoundingClientRect();
    const scrollable = Math.max(1, this.trackEl.offsetHeight - window.innerHeight);
    const scrolled = -rect.top;
    this.targetProgress = clamp(scrolled / scrollable, 0, 1);
  }

  private startLoop(): void {
    const tick = () => {
      if (this.isVisible) {
        const lerpFactor = this.reducedMotion ? 1 : 0.11;
        this.currentProgress += (this.targetProgress - this.currentProgress) * lerpFactor;
        this.currentPointerX += (this.pointerX - this.currentPointerX) * 0.08;
        this.currentPointerY += (this.pointerY - this.currentPointerY) * 0.08;

        if (Math.abs(this.targetProgress - this.currentProgress) < 0.0001) {
          this.currentProgress = this.targetProgress;
        }

        this.renderFrame();
        this.syncHUD();
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private drawCoverSource(
    source: CanvasImageSource,
    srcW: number,
    srcH: number,
    scale: number,
    offsetX: number,
    offsetY: number,
    alpha: number
  ): void {
    const w = this.logicalWidth;
    const h = this.logicalHeight;
    if (w <= 0 || h <= 0 || srcW <= 0 || srcH <= 0) return;

    const baseRatio = Math.max(w / srcW, h / srcH);
    const drawW = srcW * baseRatio * scale;
    const drawH = srcH * baseRatio * scale;
    const x = (w - drawW) * 0.5 + offsetX;
    const y = (h - drawH) * 0.5 + offsetY;

    this.ctx.save();
    this.ctx.globalAlpha = clamp(alpha, 0, 1);
    this.ctx.drawImage(source, x, y, drawW, drawH);
    this.ctx.restore();
  }

  private drawPlaceholderScene(index: number, scale: number, alpha: number): void {
    const w = this.logicalWidth;
    const h = this.logicalHeight;
    this.ctx.save();
    this.ctx.globalAlpha = alpha;

    const grad = this.ctx.createRadialGradient(
      w * 0.5,
      h * 0.45,
      40 * scale,
      w * 0.5,
      h * 0.5,
      Math.max(w, h) * 0.75
    );
    const isEven = index % 2 === 0;
    grad.addColorStop(0, isEven ? '#184A78' : '#243B55');
    grad.addColorStop(0.55, '#0D2B49');
    grad.addColorStop(1, '#061524');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, w, h);
    this.ctx.restore();
  }

  private drawSceneLayer(
    sceneIdx: number,
    scale: number,
    offsetX: number,
    offsetY: number,
    alpha: number,
    videoKey?: string,
    videoNormTime?: number
  ): void {
    // 1. Prefer oso95/scroll-world preloaded video clip if present
    if (videoKey && videoNormTime !== undefined) {
      const video = this.videoMap.get(videoKey);
      if (video && video.readyState >= 2 && video.duration > 0) {
        const targetTime = clamp(videoNormTime, 0, 0.998) * video.duration;
        if (Math.abs(video.currentTime - targetTime) > 0.03) {
          video.currentTime = targetTime;
        }
        this.drawCoverSource(
          video,
          video.videoWidth || 1920,
          video.videoHeight || 1080,
          1.02,
          offsetX * 0.35,
          offsetY * 0.35,
          alpha
        );
        return;
      }
    }

    // 2. Render high-resolution perspective still with 3D camera matrix
    const img = this.images[sceneIdx];
    if (img && img.complete && img.naturalWidth > 0) {
      this.drawCoverSource(
        img,
        img.naturalWidth,
        img.naturalHeight,
        scale,
        offsetX,
        offsetY,
        alpha
      );
    } else {
      this.drawPlaceholderScene(sceneIdx, scale, alpha);
    }
  }

  private drawArchitecturalReticle(globalProgress: number, isConnector: boolean): void {
    const w = this.logicalWidth;
    const h = this.logicalHeight;
    const cx = w * 0.5;
    const cy = h * 0.5;

    this.ctx.save();

    // Executive atmospheric depth vignette so HUD copy always has AAA contrast
    const vignette = this.ctx.createRadialGradient(
      cx,
      cy,
      Math.min(w, h) * 0.18,
      cx,
      cy,
      Math.max(w, h) * 0.78
    );
    vignette.addColorStop(0, 'rgba(10, 34, 57, 0.12)');
    vignette.addColorStop(0.62, 'rgba(10, 34, 57, 0.48)');
    vignette.addColorStop(1, 'rgba(6, 21, 36, 0.84)');
    this.ctx.fillStyle = vignette;
    this.ctx.fillRect(0, 0, w, h);

    // Top & bottom subtle gradient bands for seamless section entry/exit
    const topBand = this.ctx.createLinearGradient(0, 0, 0, 140);
    topBand.addColorStop(0, 'rgba(6, 21, 36, 0.68)');
    topBand.addColorStop(1, 'rgba(6, 21, 36, 0)');
    this.ctx.fillStyle = topBand;
    this.ctx.fillRect(0, 0, w, 140);

    // Subtle 3D perspective architectural frame lines
    const pulse = isConnector ? 0.16 : 0.08;
    this.ctx.strokeStyle = `rgba(255, 255, 255, ${pulse})`;
    this.ctx.lineWidth = 1;

    const ringRadius = Math.min(w, h) * (0.22 + ((globalProgress * 6) % 1) * 0.12);
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
    this.ctx.stroke();

    if (isConnector) {
      this.ctx.strokeStyle = 'rgba(255, 107, 0, 0.24)';
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, ringRadius * 0.68, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  private renderFrame(): void {
    const w = this.logicalWidth;
    const h = this.logicalHeight;
    if (w <= 0 || h <= 0) return;

    this.ctx.fillStyle = '#061524';
    this.ctx.fillRect(0, 0, w, h);

    const total = this.scenes.length;
    const timeline = clamp(this.currentProgress * total, 0, total - 0.0001);
    const sceneIdx = Math.floor(timeline);
    const local = timeline - sceneIdx;
    const isLastScene = sceneIdx >= total - 1;

    const panX = -this.currentPointerX * 18;
    const panY = -this.currentPointerY * 12;

    let inConnector = false;

    if (isLastScene || this.reducedMotion) {
      // Final scene steady dive (or reduced-motion static framing)
      const diveT = this.reducedMotion ? 0.2 : easeInOutSine(local);
      const scale = START_SCALE + diveT * (DIVE_END_SCALE - START_SCALE);
      this.drawSceneLayer(sceneIdx, scale, panX, panY, 1, `dive-${sceneIdx}`, local);
    } else if (local <= DIVE_SPLIT) {
      // Phase 1: Camera Dive-In into current scene
      const diveNorm = local / DIVE_SPLIT;
      const eased = easeInOutSine(diveNorm);
      const scale = START_SCALE + eased * (DIVE_END_SCALE - START_SCALE);
      this.drawSceneLayer(sceneIdx, scale, panX, panY, 1, `dive-${sceneIdx}`, diveNorm);
    } else {
      // Phase 2: Seamless Portal Connector (Seam-matched fly-through into Scene i+1)
      inConnector = true;
      const connNorm = (local - DIVE_SPLIT) / (1 - DIVE_SPLIT);
      const eased = easeInOutCubic(connNorm);

      // Next scene emerges from focal depth and lands EXACTLY at START_SCALE (1.03x)
      const nextScale = PORTAL_IN_START_SCALE + eased * (START_SCALE - PORTAL_IN_START_SCALE);
      this.drawSceneLayer(sceneIdx + 1, nextScale, panX * 0.6, panY * 0.6, 1);

      // Current scene accelerates past lens while dissolving smoothly
      const outScale = DIVE_END_SCALE + eased * (PORTAL_OUT_SCALE - DIVE_END_SCALE);
      this.drawSceneLayer(
        sceneIdx,
        outScale,
        panX * 1.35,
        panY * 1.35,
        1 - eased,
        `conn-${sceneIdx}`,
        connNorm
      );
    }

    this.drawArchitecturalReticle(this.currentProgress, inConnector);
  }

  private syncHUD(): void {
    const total = this.scenes.length;
    const timeline = clamp(this.currentProgress * total, 0, total - 0.0001);
    const activeIdx = Math.floor(timeline);
    const local = timeline - activeIdx;
    const isLast = activeIdx >= total - 1;

    // Progress bar & 360° telemetry
    if (this.progressFillEl) {
      this.progressFillEl.style.transform = `scaleX(${this.currentProgress.toFixed(4)})`;
    }

    if (this.degreeReadoutEl) {
      const deg = Math.round(this.currentProgress * 360);
      this.degreeReadoutEl.textContent = `${String(deg).padStart(3, '0')}°`;
    }

    if (this.sceneCounterEl) {
      this.sceneCounterEl.textContent = `0${activeIdx + 1} / 0${total}`;
    }

    if (this.phaseBadgeEl) {
      const inTransition = !isLast && local > DIVE_SPLIT;
      this.phaseBadgeEl.textContent = inTransition
        ? 'TRANSICIÓN DE ESCENA · VUELO CONTINUO'
        : 'EXPLORACIÓN DE ESPECIALIDAD · 360° PRO';
    }

    // Chapter nav buttons
    this.chapterBtns.forEach((btn, idx) => {
      btn.classList.toggle('is-active', idx === activeIdx);
      btn.setAttribute('aria-current', idx === activeIdx ? 'step' : 'false');
    });

    // Beat Overlay Cards choreographed to camera depth
    this.beatEls.forEach((el, idx) => {
      if (idx !== activeIdx) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        el.style.transform = 'translate3d(0, 26px, 0) scale(0.96)';
        el.setAttribute('aria-hidden', 'true');
        return;
      }

      let alpha = 1;
      let yOffset = 0;
      let scale = 1;

      if (!this.reducedMotion) {
        if (local < 0.12) {
          const enterT = easeInOutSine(local / 0.12);
          alpha = enterT;
          yOffset = (1 - enterT) * 24;
          scale = 0.97 + enterT * 0.03;
        } else if (!isLast && local > DIVE_SPLIT - 0.04) {
          const exitT = clamp((local - (DIVE_SPLIT - 0.04)) / 0.24, 0, 1);
          alpha = 1 - exitT;
          yOffset = -exitT * 28;
          scale = 1 + exitT * 0.04;
        }
      }

      el.style.opacity = alpha.toFixed(3);
      el.style.transform = `translate3d(0, ${yOffset.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      el.style.pointerEvents = alpha > 0.45 ? 'auto' : 'none';
      el.setAttribute('aria-hidden', alpha > 0.2 ? 'false' : 'true');
    });
  }
}

