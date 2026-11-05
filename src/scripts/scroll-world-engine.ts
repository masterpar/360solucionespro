/**
 * ============================================================================
 * 360° PRO — MULTI-PLANE 3D DIORAMA & SCROLL-WORLD ENGINE
 * ============================================================================
 * Unifies Beat 00 (Dynamic Architectural Hero) + Beats 01..06 (Service Worlds)
 * into a single continuous 3D camera flight (`scrollY === camera Z-timeline`).
 *
 * Layers rendered per frame:
 *  - Plane Z-0: Deep horizon atmospheric backdrop (0.5x parallax + idle drift)
 *  - Plane Z-1: Core diorama high-res subject (1.0x dive + Seam-Rule portal)
 *  - Plane Z-2: Multi-plane peripheral depth frame (1.85x parallax) + 3D CAD
 *               perspective corridor rings & vanishing lines
 *  - Plane Z-3: True (x/z, y/z) volumetric particles reactive to scroll speed
 *  - DOM Layer: 3D-tracked Technical Hotspots with CAD leader lines + Hero
 *               diagonal shutter choreography + Chapter Beat Cards
 */

export interface EngineSceneConfig {
  id: string;
  beatNumber: string;
  stillImage: string;
  fallbackStill: string;
  introVideo?: string;
  diveVideo?: string;
  connectorVideo?: string;
}

interface Particle3D {
  x: number;
  y: number;
  z: number;
  size: number;
  isAccent: boolean;
}

const DIVE_SPLIT = 0.65;
const START_SCALE = 1.04;
const DIVE_END_SCALE = 1.38;
const PORTAL_OUT_SCALE = 2.52;
const PORTAL_IN_START_SCALE = 0.82;
const PARTICLE_COUNT = 44;

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
  private pendingSeekMap: Map<string, number> = new Map();
  private lastQuantizedFrameMap: Map<string, number> = new Map();
  private introVideoEl: HTMLVideoElement | null = null;
  private videoPoolEl: HTMLElement | null = null;

  private heroCopyEl: HTMLElement | null;
  private heroShutterEl: HTMLElement | null;
  private hudTopEl: HTMLElement | null;
  private beatEls: HTMLElement[] = [];
  private hotspotGroups: HTMLElement[] = [];
  private chapterBtns: HTMLElement[] = [];
  private progressFillEl: HTMLElement | null;
  private degreeReadoutEl: HTMLElement | null;
  private sceneCounterEl: HTMLElement | null;
  private phaseBadgeEl: HTMLElement | null;

  private particles: Particle3D[] = [];
  private targetProgress = 0;
  private currentProgress = 0;
  private prevProgress = 0;
  private scrollVelocity = 0;

  private pointerX = 0;
  private pointerY = 0;
  private currentPointerX = 0;
  private currentPointerY = 0;

  private startTime = performance.now();
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

    this.heroCopyEl = trackEl.querySelector<HTMLElement>('[data-sw-hero-copy]');
    this.heroShutterEl = trackEl.querySelector<HTMLElement>('[data-sw-hero-shutter]');
    this.hudTopEl = trackEl.querySelector<HTMLElement>('[data-sw-hud-top]');
    this.beatEls = Array.from(trackEl.querySelectorAll<HTMLElement>('[data-sw-beat]'));
    this.hotspotGroups = Array.from(
      trackEl.querySelectorAll<HTMLElement>('[data-sw-hotspot-group]')
    );
    this.chapterBtns = Array.from(trackEl.querySelectorAll<HTMLElement>('[data-sw-jump]'));
    this.progressFillEl = trackEl.querySelector<HTMLElement>('[data-sw-progress-fill]');
    this.degreeReadoutEl = trackEl.querySelector<HTMLElement>('[data-sw-degree]');
    this.sceneCounterEl = trackEl.querySelector<HTMLElement>('[data-sw-counter]');
    this.phaseBadgeEl = trackEl.querySelector<HTMLElement>('[data-sw-phase]');

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.initParticles();
    this.initAssets();
    this.handleResize();
    this.bindEvents();
    this.updateTargetScroll();
    this.currentProgress = this.targetProgress;
    this.prevProgress = this.currentProgress;
    this.startLoop();
  }

  private initParticles(): void {
    this.particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this.particles.push({
        x: (Math.random() - 0.5) * 2.2,
        y: (Math.random() - 0.5) * 1.6,
        z: 0.12 + Math.random() * 0.88,
        size: 1.1 + Math.random() * 2.1,
        isAccent: i % 4 === 0,
      });
    }
  }

  private initAssets(): void {
    this.images = new Array(this.scenes.length).fill(null);

    this.scenes.forEach((scene, index) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        this.images[index] = img;
      };
      img.onerror = () => {
        if (scene.fallbackStill && img.src !== scene.fallbackStill) {
          const fallback = new Image();
          fallback.onload = () => {
            this.images[index] = fallback;
          };
          fallback.src = scene.fallbackStill;
        }
      };
      img.src = this.pickResponsiveStill(scene.stillImage);
    });

    void this.preloadAvailableVideos();
  }

  private async preloadAvailableVideos(): Promise<void> {
    let available: Set<string> | null = null;
    try {
      const res = await fetch('/videos/manifest.json', { cache: 'no-cache' });
      if (res.ok) {
        const data = (await res.json()) as { generated?: string[] };
        if (Array.isArray(data.generated)) {
          available = new Set(data.generated);
        }
      }
    } catch {
      available = null;
    }

    // Hero live autoplay loop intro video (blends into scroll-world on scroll)
    const heroIntroUrl = this.scenes[0]?.introVideo;
    if (heroIntroUrl && (!available || available.has(heroIntroUrl))) {
      this.preloadIntroLoopVideo(heroIntroUrl);
    }

    this.scenes.forEach((scene, index) => {
      if (scene.diveVideo && (!available || available.has(scene.diveVideo))) {
        void this.preloadVideoBlob(`dive-${index}`, scene.diveVideo);
      }
      if (scene.connectorVideo && (!available || available.has(scene.connectorVideo))) {
        void this.preloadVideoBlob(`conn-${index}`, scene.connectorVideo);
      }
    });
  }

  private ensureVideoPool(): HTMLElement {
    if (this.videoPoolEl) return this.videoPoolEl;
    const pool = document.createElement('div');
    pool.setAttribute('aria-hidden', 'true');
    pool.style.cssText =
      'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0.001;pointer-events:none;overflow:hidden;z-index:-1;';
    this.trackEl.appendChild(pool);
    this.videoPoolEl = pool;
    return pool;
  }

  private configureVideoElement(video: HTMLVideoElement): void {
    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('preload', 'auto');
    if ('disablePictureInPicture' in video) {
      video.disablePictureInPicture = true;
    }
    this.ensureVideoPool().appendChild(video);
  }

  private tryPlayIntroVideo(): void {
    const video = this.introVideoEl;
    if (!video || this.reducedMotion || !this.isVisible || this.currentProgress >= 0.04) return;
    if (video.paused) {
      void video.play().catch(() => {});
    }
  }

  private preloadIntroLoopVideo(url: string): void {
    const video = document.createElement('video');
    this.configureVideoElement(video);
    video.loop = true;
    video.setAttribute('loop', '');
    video.autoplay = !this.reducedMotion;
    video.src = url;
    const onReady = () => this.tryPlayIntroVideo();
    video.addEventListener('loadeddata', onReady, { once: true });
    video.addEventListener('canplay', onReady, { once: true });
    video.load();
    this.introVideoEl = video;
  }

  private hasReadyVideo(key: string): boolean {
    const video = this.videoMap.get(key);
    return Boolean(video && video.readyState >= 2 && video.duration > 0);
  }

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
      this.configureVideoElement(video);
      video.src = objectUrl;

      // Prime first frame on mobile/desktop decoders and flush queued seeks smoothly
      video.addEventListener(
        'loadedmetadata',
        () => {
          try {
            video.currentTime = 0.001;
          } catch {
            // Ignore initial seek error if not yet ready
          }
        },
        { once: true }
      );

      video.addEventListener('seeked', () => {
        const pending = this.pendingSeekMap.get(key);
        if (pending !== undefined) {
          this.pendingSeekMap.delete(key);
          if (Math.abs(video.currentTime - pending) > 0.015) {
            video.currentTime = pending;
          }
        }
      });

      video.load();
      this.videoMap.set(key, video);
    } catch {
      // Fallback to multi-plane diorama stills
    }
  }

  private bindEvents(): void {
    window.addEventListener(
      'scroll',
      () => {
        this.updateTargetScroll();
        this.tryPlayIntroVideo();
      },
      { passive: true }
    );
    window.addEventListener('resize', () => {
      this.handleResize();
      this.updateTargetScroll();
    });

    // Mobile iOS/Android autoplay unlock on first touch or interaction
    const unlockIntro = () => this.tryPlayIntroVideo();
    window.addEventListener('touchstart', unlockIntro, { passive: true, once: true });
    window.addEventListener('pointerdown', unlockIntro, { passive: true, once: true });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.tryPlayIntroVideo();
    });

    window.addEventListener(
      'pointermove',
      (e: PointerEvent) => {
        if (this.reducedMotion || !this.isVisible) return;
        this.pointerX = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
        this.pointerY = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
      },
      { passive: true }
    );

    // Interactive chapter jump buttons (00 Hero .. 06 Services)
    this.chapterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.swJump || '0');
        const total = this.scenes.length;
        const desiredProgress = idx === 0 ? 0 : clamp((idx + 0.22) / total, 0, 0.985);
        const rect = this.trackEl.getBoundingClientRect();
        const trackTop = window.scrollY + rect.top;
        const scrollable = Math.max(1, this.trackEl.offsetHeight - window.innerHeight);
        window.scrollTo({
          top: trackTop + desiredProgress * scrollable,
          behavior: this.reducedMotion ? 'auto' : 'smooth',
        });
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          this.isVisible = entry.isIntersecting;
        });
      },
      { rootMargin: '300px 0px' }
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
    const tick = (now: number) => {
      if (this.isVisible) {
        const lerpFactor = this.reducedMotion ? 1 : 0.13;
        this.prevProgress = this.currentProgress;
        this.currentProgress += (this.targetProgress - this.currentProgress) * lerpFactor;
        if (Math.abs(this.targetProgress - this.currentProgress) < 0.00006) {
          this.currentProgress = this.targetProgress;
        }

        const rawVel = (this.currentProgress - this.prevProgress) * 100;
        this.scrollVelocity += (rawVel - this.scrollVelocity) * 0.18;

        this.currentPointerX += (this.pointerX - this.currentPointerX) * 0.07;
        this.currentPointerY += (this.pointerY - this.currentPointerY) * 0.07;

        const elapsed = now - this.startTime;
        this.renderFrame(elapsed);
        this.syncDOM(elapsed);
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

    const isMobilePortrait = w < 768 && h > w;
    const effectiveScale = isMobilePortrait ? Math.min(scale, 1.04) : scale;
    const baseRatio = Math.max(w / srcW, h / srcH);
    const drawW = srcW * baseRatio * effectiveScale;
    const drawH = srcH * baseRatio * effectiveScale;

    // On portrait mobile screens, anchor slightly higher so the skyscraper towers
    // fill the upper showcase window above the Hero copy instead of empty sky.
    const xAnchor = isMobilePortrait ? 0.48 : 0.5;
    const yAnchor = isMobilePortrait ? 0.22 : 0.5;
    const x = (w - drawW) * xAnchor + offsetX * (isMobilePortrait ? 0.35 : 1);
    const y = (h - drawH) * yAnchor + offsetY * (isMobilePortrait ? 0.35 : 1);

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
      w * 0.55,
      h * 0.45,
      40 * scale,
      w * 0.5,
      h * 0.5,
      Math.max(w, h) * 0.8
    );
    grad.addColorStop(0, index % 2 === 0 ? '#184A78' : '#1E3A5F');
    grad.addColorStop(0.6, '#0A2239');
    grad.addColorStop(1, '#061524');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, w, h);
    this.ctx.restore();
  }

  /**
   * Renders a full-bleed 3D Diorama / Scroll-World video clip for a single scene
   * without artificial peripheral seams, giving priority to Seam-Rule MP4 clips.
   */
  private drawMultiPlaneScene(
    sceneIdx: number,
    scale: number,
    panX: number,
    panY: number,
    alpha: number,
    videoKey?: string,
    videoNormTime?: number
  ): void {
    if (alpha <= 0.005) return;

    // Video chain priority (Seam-Rule MP4 blobs in /public/videos)
    if (videoKey && videoNormTime !== undefined) {
      const video = this.videoMap.get(videoKey);
      if (video && video.readyState >= 2 && video.duration > 0) {
        const fps = 24;
        const rawTime = clamp(videoNormTime, 0, 0.996) * video.duration;
        const targetFrame = Math.round(rawTime * fps);
        const quantizedTime = clamp(targetFrame / fps, 0.001, Math.max(0.001, video.duration - 0.02));
        const prevFrame = this.lastQuantizedFrameMap.get(videoKey);

        if (prevFrame !== targetFrame) {
          this.lastQuantizedFrameMap.set(videoKey, targetFrame);
          if (!video.seeking) {
            this.pendingSeekMap.delete(videoKey);
            video.currentTime = quantizedTime;
          } else {
            this.pendingSeekMap.set(videoKey, quantizedTime);
          }
        }

        this.drawCoverSource(
          video,
          video.videoWidth || 1920,
          video.videoHeight || 1080,
          1.03,
          panX * 0.35,
          panY * 0.35,
          alpha
        );
        return;
      }
    }

    const img = this.images[sceneIdx];
    if (!img || !img.complete || img.naturalWidth === 0) {
      this.drawPlaceholderScene(sceneIdx, scale, alpha);
      return;
    }

    // Seamless full-bleed diorama subject (zero peripheral cutout seam)
    this.drawCoverSource(img, img.naturalWidth, img.naturalHeight, scale, panX, panY, alpha);
  }

  /**
   * Renders subtle depth vignette and volumetric Z-space particles without
   * harsh wireframe flashes or horizontal scanlines over the video.
   */
  private draw3DCADAndParticles(
    elapsed: number,
    connectorIntensity: number,
    timeline: number,
    hasActiveVideo: boolean
  ): void {
    const w = this.logicalWidth;
    const h = this.logicalHeight;
    const isMobile = w < 768;
    const cx = w * 0.5 - this.currentPointerX * 22;
    const cy = h * 0.5 - this.currentPointerY * 15;

    this.ctx.save();

    // 1. Soft executive vignette (kept extra light during Hero & on mobile so the video shines)
    const heroLightness = clamp(1 - timeline / 0.85, 0, 1);
    const midAlpha = isMobile
      ? 0.14 - heroLightness * 0.08
      : 0.32 - heroLightness * 0.16;
    const edgeAlpha = isMobile
      ? 0.52 - heroLightness * 0.16
      : 0.72 - heroLightness * 0.2;

    const vignette = this.ctx.createRadialGradient(
      cx,
      cy,
      Math.min(w, h) * 0.24,
      w * 0.5,
      h * 0.5,
      Math.max(w, h) * 0.82
    );
    vignette.addColorStop(0, 'rgba(10, 34, 57, 0.02)');
    vignette.addColorStop(0.65, `rgba(10, 34, 57, ${midAlpha.toFixed(3)})`);
    vignette.addColorStop(1, `rgba(6, 21, 36, ${edgeAlpha.toFixed(3)})`);
    this.ctx.fillStyle = vignette;
    this.ctx.fillRect(0, 0, w, h);

    // 2. Subtle 3D perspective rings & particles (suppressed over active video to prevent visual cuts)
    if (!this.reducedMotion) {
      if (!hasActiveVideo) {
        const zFlow = (this.currentProgress * this.scenes.length * 1.5 + elapsed * 0.00008) % 1;
        const baseRingAlpha = 0.05 + connectorIntensity * 0.09;

        for (let r = 0; r < 3; r++) {
          const depthPhase = (zFlow + r / 3) % 1;
          const perspectiveScale = Math.pow(depthPhase, 2.1);
          const rw = w * (0.14 + perspectiveScale * 0.92);
          const rh = h * (0.14 + perspectiveScale * 0.92);
          const rx = cx - rw * 0.5;
          const ry = cy - rh * 0.5;
          const frameAlpha = Math.sin(depthPhase * Math.PI) * baseRingAlpha;

          this.ctx.strokeStyle =
            r === 0 && connectorIntensity > 0.3
              ? `rgba(255, 107, 0, ${frameAlpha.toFixed(3)})`
              : `rgba(255, 255, 255, ${frameAlpha.toFixed(3)})`;
          this.ctx.strokeRect(rx, ry, rw, rh);
        }
      }

      // 3. Volumetric 3D Z-Space Particles
      const speedBoost = this.scrollVelocity * 0.085;
      const baseDrift = 0.0014;
      const spread = Math.max(w, h) * 0.62;
      const particleOpacityScale = hasActiveVideo ? 0.55 : 0.9;

      for (const p of this.particles) {
        p.z -= baseDrift + speedBoost;
        if (p.z <= 0.08) {
          p.z += 0.92;
          p.x = (Math.random() - 0.5) * 2.2;
          p.y = (Math.random() - 0.5) * 1.6;
        } else if (p.z > 1.0) {
          p.z -= 0.92;
        }

        const invZ = 1 / p.z;
        const sx = cx + p.x * invZ * spread * 0.45;
        const sy = cy + p.y * invZ * spread * 0.45;

        if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) continue;

        const proximityAlpha = clamp((1 - p.z) * 0.55 * particleOpacityScale, 0.03, 0.42);
        const radius = clamp(p.size * invZ * 0.38, 0.7, 3.2);

        this.ctx.fillStyle = p.isAccent
          ? `rgba(255, 107, 0, ${proximityAlpha.toFixed(3)})`
          : `rgba(248, 250, 252, ${(proximityAlpha * 0.75).toFixed(3)})`;

        if (Math.abs(speedBoost) > 0.008) {
          const prevInvZ = 1 / clamp(p.z + speedBoost * 2.0, 0.1, 1.2);
          const px = cx + p.x * prevInvZ * spread * 0.45;
          const py = cy + p.y * prevInvZ * spread * 0.45;
          this.ctx.strokeStyle = this.ctx.fillStyle;
          this.ctx.lineWidth = radius * 0.8;
          this.ctx.beginPath();
          this.ctx.moveTo(px, py);
          this.ctx.lineTo(sx, sy);
          this.ctx.stroke();
        } else {
          this.ctx.beginPath();
          this.ctx.arc(sx, sy, radius, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }

    this.ctx.restore();
  }

  /**
   * Blends the live-playing Hero Intro Video (`hero-intro.mp4`) seamlessly into
   * Frame 0 of `dive-00.mp4` at the exact same scale (1.03) and pan (0.35x) so
   * there is zero double-image ghosting or jump cut when scrolling begins.
   */
  private renderHeroIntroBlend(
    elapsed: number,
    timeline: number,
    panX: number,
    panY: number
  ): void {
    const hasDive0 = this.hasReadyVideo('dive-0');
    // When dive-00.mp4 is active, crossfade quickly at the very top (0..0.055) while dive-00 is still at Frame 0
    const fadeWindow = hasDive0 ? 0.055 : 0.28;
    const introBlend = this.reducedMotion
      ? 0
      : 1 - easeInOutSine(clamp((timeline - 0.002) / fadeWindow, 0, 1));

    const introVideo = this.introVideoEl;
    const introReady = Boolean(introVideo && introVideo.readyState >= 2);

    if (introVideo) {
      if (introBlend > 0.01 && this.isVisible && !this.reducedMotion) {
        if (introVideo.paused) {
          void introVideo.play().catch(() => {});
        }
      } else if (!introVideo.paused) {
        introVideo.pause();
      }
    }

    if (introBlend <= 0.005) return;

    if (introReady && introVideo) {
      // Exact same scale (1.03) and pan (0.35x) as dive-00.mp4 Frame 0 for a 100% invisible handoff
      this.drawCoverSource(
        introVideo,
        introVideo.videoWidth || 1920,
        introVideo.videoHeight || 1080,
        1.03,
        panX * 0.35,
        panY * 0.35,
        introBlend
      );
      return;
    }

    // Fallback when hero-intro.mp4 is still loading
    const heroImg = this.images[0];
    if (heroImg && heroImg.complete && heroImg.naturalWidth > 0) {
      const orbitScale = 1.03 + Math.sin(elapsed * 0.00068) * 0.018;
      this.drawCoverSource(
        heroImg,
        heroImg.naturalWidth,
        heroImg.naturalHeight,
        orbitScale,
        panX * 0.35,
        panY * 0.35,
        introBlend
      );
    }
  }

  private renderFrame(elapsed: number): void {
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

    // Subtle idle architectural breathing + pointer 3D tilt
    const idleFloatX = this.reducedMotion ? 0 : Math.sin(elapsed * 0.0007) * 6;
    const idleFloatY = this.reducedMotion ? 0 : Math.cos(elapsed * 0.00055) * 4;
    const panX = -this.currentPointerX * 22 + idleFloatX;
    const panY = -this.currentPointerY * 15 + idleFloatY;

    let connectorIntensity = 0;
    const diveKey = `dive-${sceneIdx}`;
    const connKey = `conn-${sceneIdx}`;
    const hasDiveVid = this.hasReadyVideo(diveKey);
    const hasConnVid = this.hasReadyVideo(connKey);
    const hasNextDiveVid = this.hasReadyVideo(`dive-${sceneIdx + 1}`);
    const hasActiveVideo = hasDiveVid || hasConnVid || (sceneIdx === 0 && Boolean(this.introVideoEl));

    if (isLastScene || this.reducedMotion) {
      const diveT = this.reducedMotion ? 0.18 : easeInOutSine(local);
      const scale = START_SCALE + diveT * (DIVE_END_SCALE - START_SCALE);
      this.drawMultiPlaneScene(sceneIdx, scale, panX, panY, 1, diveKey, local);
    } else if (hasDiveVid && !hasConnVid) {
      // Continuous single-clip Google Flow transition (zero mid-clip speed kink!)
      const videoT = clamp((local - 0.015) / 0.94, 0, 0.996);
      connectorIntensity = clamp((local - 0.55) / 0.45, 0, 1);

      this.drawMultiPlaneScene(sceneIdx, 1.03, panX, panY, 1, diveKey, videoT);

      // Smooth cross-dissolve over final 16% into Scene i+1 when Scene i+1 uses a still image
      // so there is zero aspect-ratio / scale jump when timeline crosses (sceneIdx + 1).000
      if (!hasNextDiveVid && local > 0.84) {
        const blendNext = easeInOutSine(clamp((local - 0.84) / 0.16, 0, 1));
        this.drawMultiPlaneScene(sceneIdx + 1, START_SCALE, panX, panY, blendNext);
      }
    } else if (local <= DIVE_SPLIT) {
      const diveNorm = local / DIVE_SPLIT;
      const eased = easeInOutSine(diveNorm);
      const scale = START_SCALE + eased * (DIVE_END_SCALE - START_SCALE);
      this.drawMultiPlaneScene(sceneIdx, scale, panX, panY, 1, diveKey, diveNorm);
    } else {
      // Seamless Multi-Plane Portal Connector (Seam-Rule locked)
      const connNorm = (local - DIVE_SPLIT) / (1 - DIVE_SPLIT);
      connectorIntensity = Math.sin(connNorm * Math.PI);

      if (hasConnVid) {
        this.drawMultiPlaneScene(sceneIdx, 1.03, panX, panY, 1, connKey, connNorm);
        if (!hasNextDiveVid && connNorm > 0.8) {
          const blendNext = easeInOutSine(clamp((connNorm - 0.8) / 0.2, 0, 1));
          this.drawMultiPlaneScene(sceneIdx + 1, START_SCALE, panX, panY, blendNext);
        }
      } else {
        const eased = easeInOutCubic(connNorm);

        // Emerging destination world (lands pixel-exact at START_SCALE = 1.04)
        const nextScale = PORTAL_IN_START_SCALE + eased * (START_SCALE - PORTAL_IN_START_SCALE);
        this.drawMultiPlaneScene(sceneIdx + 1, nextScale, panX * 0.6, panY * 0.6, 1);

        // Outgoing world rushing past camera lens
        const outScale = DIVE_END_SCALE + eased * (PORTAL_OUT_SCALE - DIVE_END_SCALE);
        this.drawMultiPlaneScene(sceneIdx, outScale, panX * 1.4, panY * 1.4, 1 - eased);
      }
    }

    // Live Hero Intro Video layer that melts seamlessly into scroll-world on scroll
    if (sceneIdx === 0) {
      this.renderHeroIntroBlend(elapsed, timeline, panX, panY);
    }

    this.draw3DCADAndParticles(elapsed, connectorIntensity, timeline, hasActiveVideo);
  }

  private syncDOM(elapsed: number): void {
    const total = this.scenes.length;
    const timeline = clamp(this.currentProgress * total, 0, total - 0.0001);
    const activeIdx = Math.floor(timeline);
    const local = timeline - activeIdx;
    const isLast = activeIdx >= total - 1;

    // Current scene scale for 3D hotspot projection
    const diveNorm = clamp(local / DIVE_SPLIT, 0, 1);
    const activeScale =
      START_SCALE + easeInOutSine(diveNorm) * (DIVE_END_SCALE - START_SCALE);

    // 1. Beat 00 (Hero) Diagonal Shutter & Copy Portal Choreography
    const heroTimeline = clamp(timeline, 0, 1); // 0..1 across Beat 00
    const isDesktopHero = this.logicalWidth >= 960;
    if (this.heroShutterEl) {
      if (this.reducedMotion) {
        this.heroShutterEl.style.opacity = activeIdx === 0 ? '1' : '0';
      } else {
        const shutterExit = clamp((heroTimeline - 0.04) / 0.52, 0, 1);
        const easedShutter = easeInOutCubic(shutterExit);
        this.heroShutterEl.style.opacity = (1 - easedShutter).toFixed(3);
        this.heroShutterEl.style.transform = isDesktopHero
          ? `translate3d(${(-easedShutter * 36).toFixed(1)}%, 0, 0)`
          : `translate3d(0, ${(easedShutter * 16).toFixed(1)}%, 0)`;
      }
    }

    if (this.heroCopyEl) {
      if (this.reducedMotion) {
        const showHero = activeIdx === 0;
        this.heroCopyEl.style.opacity = showHero ? '1' : '0';
        this.heroCopyEl.style.pointerEvents = showHero ? 'auto' : 'none';
      } else {
        const copyExit = clamp((heroTimeline - 0.03) / 0.46, 0, 1);
        const easedCopy = easeInOutSine(copyExit);
        const alpha = 1 - easedCopy;
        const scale = 1 + easedCopy * 0.05;
        const shiftX = isDesktopHero ? -easedCopy * 36 : 0;
        const shiftY = isDesktopHero ? -easedCopy * 18 : easedCopy * 24;
        this.heroCopyEl.style.opacity = alpha.toFixed(3);
        this.heroCopyEl.style.transform = `translate3d(${shiftX.toFixed(1)}px, ${shiftY.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
        this.heroCopyEl.style.pointerEvents = 'none';
        this.heroCopyEl.setAttribute('aria-hidden', alpha > 0.2 ? 'false' : 'true');
      }
    }

    // 2. Top Telemetry HUD (subtle during Hero top, full visibility once diving)
    if (this.hudTopEl) {
      const hudAlpha = clamp((timeline - 0.35) / 0.4, 0, 1);
      this.hudTopEl.style.opacity = this.reducedMotion ? '1' : hudAlpha.toFixed(3);
      this.hudTopEl.style.transform = this.reducedMotion
        ? 'none'
        : `translate3d(0, ${((1 - hudAlpha) * -14).toFixed(1)}px, 0)`;
      this.hudTopEl.style.pointerEvents = hudAlpha > 0.5 ? 'auto' : 'none';
    }

    // 3. Progress bar & 360° telemetry
    if (this.progressFillEl) {
      this.progressFillEl.style.transform = `scaleX(${this.currentProgress.toFixed(4)})`;
    }

    if (this.degreeReadoutEl) {
      const deg = Math.round(this.currentProgress * 360);
      this.degreeReadoutEl.textContent = `${String(deg).padStart(3, '0')}°`;
    }

    if (this.sceneCounterEl) {
      const displayIdx = Math.max(1, activeIdx);
      this.sceneCounterEl.textContent = `0${displayIdx} / 0${total - 1}`;
    }

    if (this.phaseBadgeEl) {
      const inTransition = !isLast && local > DIVE_SPLIT;
      if (timeline < 0.28) {
        this.phaseBadgeEl.textContent = 'INTRO VIDEO EN VIVO · FUSIÓN SCROLL-WORLD';
      } else if (inTransition) {
        this.phaseBadgeEl.textContent = 'PORTAL 3D · VUELO ENTRE ESCENAS';
      } else {
        this.phaseBadgeEl.textContent = 'SCROLL-WORLD 3D · 360° PRO';
      }
    }

    // 4. Chapter rail buttons (00 Inicio .. 06 Suministros)
    this.chapterBtns.forEach((btn, idx) => {
      btn.classList.toggle('is-active', idx === activeIdx);
      btn.setAttribute('aria-current', idx === activeIdx ? 'step' : 'false');
    });

    // 5. Service Beat Cards (Scenes 1..6 => beatEls[0..5])
    this.beatEls.forEach((el, beatIdx) => {
      const sceneForBeat = beatIdx + 1; // Scene 0 is Hero
      if (sceneForBeat !== activeIdx) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        el.style.transform = 'translate3d(0, 28px, 0) scale(0.96)';
        el.setAttribute('aria-hidden', 'true');
        return;
      }

      let alpha = 1;
      let yOffset = 0;
      let scale = 1;

      if (!this.reducedMotion) {
        if (local < 0.13) {
          const enterT = easeInOutSine(local / 0.13);
          alpha = enterT;
          yOffset = (1 - enterT) * 26;
          scale = 0.96 + enterT * 0.04;
        } else if (!isLast && local > DIVE_SPLIT - 0.04) {
          const exitT = clamp((local - (DIVE_SPLIT - 0.04)) / 0.24, 0, 1);
          alpha = 1 - exitT;
          yOffset = -exitT * 30;
          scale = 1 + exitT * 0.045;
        }
      }

      el.style.opacity = alpha.toFixed(3);
      el.style.transform = `translate3d(0, ${yOffset.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      el.style.pointerEvents = alpha > 0.45 ? 'auto' : 'none';
      el.setAttribute('aria-hidden', alpha > 0.2 ? 'false' : 'true');
    });

    // 6. 3D-Tracked Technical Hotspots (Groups 0..6)
    const idleFloatX = this.reducedMotion ? 0 : Math.sin(elapsed * 0.0007) * 6;
    const idleFloatY = this.reducedMotion ? 0 : Math.cos(elapsed * 0.00055) * 4;
    const basePanX = -this.currentPointerX * 22 + idleFloatX;
    const basePanY = -this.currentPointerY * 15 + idleFloatY;

    this.hotspotGroups.forEach((group, groupIdx) => {
      if (groupIdx !== activeIdx) {
        group.style.opacity = '0';
        group.classList.remove('is-active');
        return;
      }

      // Visibility window during active dive
      let groupAlpha = 1;
      if (!this.reducedMotion) {
        if (groupIdx === 0 && local > 0.08) {
          groupAlpha = 1 - easeInOutSine(clamp((local - 0.08) / 0.48, 0, 1));
        } else if (groupIdx > 0 && local < 0.14) {
          groupAlpha = easeInOutSine(local / 0.14);
        } else if (!isLast && local > DIVE_SPLIT - 0.06) {
          groupAlpha = 1 - clamp((local - (DIVE_SPLIT - 0.06)) / 0.2, 0, 1);
        }
      }

      group.style.opacity = groupAlpha.toFixed(3);
      group.classList.toggle('is-active', groupAlpha > 0.35);

      // Apply 3D camera projection per individual hotspot pin or 3D Hero showcase card
      const pins = group.querySelectorAll<HTMLElement>('[data-sw-hotspot]');
      pins.forEach((pin, pinIdx) => {
        const hx = parseFloat(pin.dataset.hx || '50') / 100;
        const hy = parseFloat(pin.dataset.hy || '50') / 100;
        const depth = parseFloat(pin.dataset.depth || '1.2');
        const isCard3d = pin.dataset.card3d === 'true';

        const zoomSpreadX = (activeScale - START_SCALE) * (hx - 0.5) * this.logicalWidth * 0.65;
        const zoomSpreadY = (activeScale - START_SCALE) * (hy - 0.5) * this.logicalHeight * 0.65;
        const dx = basePanX * depth + zoomSpreadX;
        const dy = basePanY * depth + zoomSpreadY;

        if (isCard3d && !this.reducedMotion) {
          // Organic 3D wave + pointer-reactive 3D tilt + scroll portal dispersion
          const wavePhase = elapsed * 0.0017 + pinIdx * 2.15;
          const floatX = Math.cos(wavePhase * 0.9) * 7;
          const floatY = Math.sin(wavePhase) * 9;
          const floatZ = Math.sin(wavePhase * 0.7) * 18;

          const heroExit = groupIdx === 0 ? clamp((local - 0.04) / 0.54, 0, 1) : 0;
          const exitX = heroExit * 95 * (pinIdx % 2 === 0 ? 1.15 : 0.75);
          const exitY = heroExit * (pinIdx - 1) * 38;
          const exitZ = heroExit * 110;

          const rotY =
            -this.currentPointerX * 16 * (depth * 0.78) +
            Math.cos(wavePhase * 0.8) * 6.5 -
            heroExit * 24;
          const rotX =
            this.currentPointerY * 12 * (depth * 0.78) +
            Math.sin(wavePhase * 0.95) * 4.8 +
            heroExit * 10;
          const rotZ = Math.sin(wavePhase * 0.6) * 1.4;

          const glareX = clamp(50 + this.currentPointerX * 42 + Math.cos(wavePhase) * 12, 8, 92);
          const glareY = clamp(36 + this.currentPointerY * 36 + Math.sin(wavePhase) * 12, 8, 92);
          pin.style.setProperty('--glare-x', `${glareX.toFixed(1)}%`);
          pin.style.setProperty('--glare-y', `${glareY.toFixed(1)}%`);

          pin.style.transform = `perspective(1100px) translate3d(${(dx + floatX + exitX).toFixed(1)}px, ${(dy + floatY + exitY).toFixed(1)}px, ${(floatZ + exitZ).toFixed(1)}px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg)`;
        } else {
          pin.style.transform = this.reducedMotion
            ? 'none'
            : `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
        }
      });
    });
  }
}
