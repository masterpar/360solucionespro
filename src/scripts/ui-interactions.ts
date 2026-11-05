/**
 * ============================================================================
 * UI INTERACTIONS, STICKY 3D STACKING & DYNAMIC DIAGONAL CURTAINS
 * ============================================================================
 */

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

export function initUIInteractions(): void {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. Reveal animations ([data-sw-reveal]) */
  const revealEls = document.querySelectorAll<HTMLElement>('[data-sw-reveal]');
  if (reducedMotion) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -36px 0px' }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* 2. Sticky-Bottom 3D Section Stacking + Dynamic Diagonal Curtains */
  const headerProgress = document.querySelector<HTMLElement>('[data-header-progress]');
  const headerEl = document.querySelector<HTMLElement>('[data-site-header]');
  const parallaxItems = document.querySelectorAll<HTMLElement>('[data-sw-parallax]');
  const dioramaViewport = document.querySelector<HTMLElement>('.diorama-sticky-viewport');

  const stackSheets = Array.from(document.querySelectorAll<HTMLElement>('[data-stack-sheet]'));
  const sheetInners = stackSheets.map((s) => s.querySelector<HTMLElement>('.stack-sheet-inner'));
  const sheetVeils = stackSheets.map((s) => s.querySelector<HTMLElement>('.stack-dim-veil'));
  const sheetCurtains = stackSheets.map((s) => s.querySelector<HTMLElement>('.diagonal-curtain'));

  // Recompute sticky `top` so tall sections scroll completely to their bottom before pinning
  const updateStickyOffsets = () => {
    if (reducedMotion) return;
    const vh = window.innerHeight;
    stackSheets.forEach((sheet, idx) => {
      // Last sheet (Contact + Footer) flows naturally to the end of document
      if (idx === stackSheets.length - 1) {
        sheet.style.position = 'relative';
        sheet.style.top = 'auto';
        return;
      }
      const h = sheet.offsetHeight;
      const stickyTop = Math.min(82, vh - h);
      sheet.style.position = 'sticky';
      sheet.style.top = `${stickyTop}px`;
    });
  };

  if (!reducedMotion && stackSheets.length > 0) {
    updateStickyOffsets();
    const ro = new ResizeObserver(() => updateStickyOffsets());
    stackSheets.forEach((sheet) => ro.observe(sheet));
    window.addEventListener('resize', updateStickyOffsets, { passive: true });
  }

  const updateScrollEffects = () => {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const docHeight = Math.max(1, document.documentElement.scrollHeight - vh);
    const pageProgress = clamp(scrollY / docHeight, 0, 1);

    if (headerProgress) {
      headerProgress.style.transform = `scaleX(${pageProgress.toFixed(4)})`;
    }

    if (headerEl) {
      headerEl.classList.toggle('is-scrolled', scrollY > 18);
    }

    if (!reducedMotion) {
      // Parallax inner photos (e.g., About +25 Años collage)
      parallaxItems.forEach((item) => {
        const speed = parseFloat(item.dataset.swParallax || '0.08');
        const rect = item.getBoundingClientRect();
        if (rect.bottom > -120 && rect.top < vh + 120) {
          const centerOffset = rect.top + rect.height * 0.5 - vh * 0.5;
          const shift = -centerOffset * speed;
          item.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
        }
      });

      // Transition 0: Diorama World recedes in 3D as Sheet 0 (#servicios) glides over it
      if (dioramaViewport && stackSheets[0]) {
        const firstSheetTop = stackSheets[0].getBoundingClientRect().top;
        const cover0 = clamp((vh - firstSheetTop) / Math.max(1, vh - 82), 0, 1);

        if (cover0 > 0.002) {
          const scale0 = 1 - cover0 * 0.065;
          const radius0 = cover0 * 26;
          const bright0 = 1 - cover0 * 0.38;
          dioramaViewport.style.transform = `scale(${scale0.toFixed(4)})`;
          dioramaViewport.style.borderRadius = `0 0 ${radius0.toFixed(1)}px ${radius0.toFixed(1)}px`;
          dioramaViewport.style.filter = `brightness(${bright0.toFixed(3)})`;
        } else {
          dioramaViewport.style.transform = '';
          dioramaViewport.style.borderRadius = '';
          dioramaViewport.style.filter = '';
        }

        if (sheetCurtains[0]) {
          const slant0 = 1 - cover0;
          sheetCurtains[0].style.setProperty('--curtain-slant', slant0.toFixed(3));
        }
      }

      // Transitions 1..N: Each stacked sheet recedes in 3D as the next sheet slides over it
      for (let i = 0; i < stackSheets.length - 1; i++) {
        const nextSheet = stackSheets[i + 1];
        const inner = sheetInners[i];
        const veil = sheetVeils[i];
        const nextCurtain = sheetCurtains[i + 1];

        const nextTop = nextSheet.getBoundingClientRect().top;
        const cover = clamp((vh - nextTop) / Math.max(1, vh - 82), 0, 1);

        if (inner) {
          if (cover > 0.002) {
            const scale = 1 - cover * 0.055;
            const shiftY = -cover * 16;
            const radius = cover * 26;
            inner.style.transform = `translate3d(0, ${shiftY.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
            inner.style.borderRadius = `${radius.toFixed(1)}px`;
          } else {
            inner.style.transform = '';
            inner.style.borderRadius = '';
          }
        }

        if (veil) {
          veil.style.opacity = (cover * 0.44).toFixed(3);
        }

        if (nextCurtain) {
          const slant = 1 - cover;
          nextCurtain.style.setProperty('--curtain-slant', slant.toFixed(3));
        }
      }
    }
  };

  window.addEventListener('scroll', () => requestAnimationFrame(updateScrollEffects), {
    passive: true,
  });
  updateScrollEffects();

  /* 3. Flow-Anchor Smooth Navigation & Active Header Tracking (Immune to Sticky Offsets) */
  const flowAnchorMap = new Map<string, HTMLElement>();
  document.querySelectorAll<HTMLElement>('[data-anchor-for]').forEach((el) => {
    const key = el.dataset.anchorFor;
    if (key) flowAnchorMap.set(key, el);
  });

  const getTrueSectionTop = (id: string): number => {
    if (id === 'inicio') return 0;
    const flowMarker = flowAnchorMap.get(id);
    if (flowMarker) {
      return window.scrollY + flowMarker.getBoundingClientRect().top - 80;
    }
    const target = document.getElementById(id);
    if (target) {
      return window.scrollY + target.getBoundingClientRect().top - 80;
    }
    return 0;
  };

  // Intercept internal hash links so jumping up or down across sticky sheets is pixel-exact
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      const id = href.slice(1);
      if (!flowAnchorMap.has(id) && !document.getElementById(id)) return;

      e.preventDefault();
      const destinationY = Math.max(0, getTrueSectionTop(id));
      window.scrollTo({
        top: destinationY,
        behavior: reducedMotion ? 'auto' : 'smooth',
      });
      history.pushState(null, '', href);
    });
  });

  const navAnchors = document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]');
  const trackedIds = ['inicio', 'servicios', 'nosotros', 'por-que-elegirnos', 'contacto'];

  const updateActiveNav = () => {
    const marker = window.scrollY + 200;
    let activeId = 'inicio';

    for (const id of trackedIds) {
      if (getTrueSectionTop(id) <= marker) {
        activeId = id;
      }
    }

    const mappedId = activeId === 'por-que-elegirnos' ? 'nosotros' : activeId;

    navAnchors.forEach((link) => {
      const href = link.getAttribute('href') || '';
      const isMatch = href === `#${mappedId}`;
      link.classList.toggle('is-active', isMatch);
      if (isMatch) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  window.addEventListener('scroll', () => requestAnimationFrame(updateActiveNav), {
    passive: true,
  });
  updateActiveNav();

  /* 4. Mobile Full-Screen Drawer */
  const menuBtn = document.querySelector<HTMLButtonElement>('[data-mobile-toggle]');
  const mobileDrawer = document.querySelector<HTMLElement>('[data-mobile-drawer]');
  const mobileCloseLinks = document.querySelectorAll<HTMLElement>('[data-mobile-close]');

  const setDrawerState = (open: boolean) => {
    if (!menuBtn || !mobileDrawer) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    mobileDrawer.classList.toggle('is-open', open);
    mobileDrawer.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  };

  menuBtn?.addEventListener('click', () => {
    const isOpen = menuBtn.getAttribute('aria-expanded') === 'true';
    setDrawerState(!isOpen);
  });

  mobileCloseLinks.forEach((el) => {
    el.addEventListener('click', () => setDrawerState(false));
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setDrawerState(false);
  });

  /* 5. Mobile Services Horizontal Carousel Dots */
  const servicesGrid = document.querySelector<HTMLElement>('[data-services-carousel]');
  const carouselDots = document.querySelectorAll<HTMLButtonElement>('[data-carousel-dot]');

  if (servicesGrid && carouselDots.length > 0) {
    servicesGrid.addEventListener(
      'scroll',
      () => {
        const scrollLeft = servicesGrid.scrollLeft;
        const cardWidth = servicesGrid.firstElementChild?.clientWidth || 300;
        const activeIndex = Math.min(
          carouselDots.length - 1,
          Math.max(0, Math.round(scrollLeft / (cardWidth + 16)))
        );
        carouselDots.forEach((dot, idx) => {
          dot.classList.toggle('is-active', idx === activeIndex);
        });
      },
      { passive: true }
    );

    carouselDots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        const cards = servicesGrid.querySelectorAll<HTMLElement>('[data-service-card]');
        const targetCard = cards[idx];
        if (targetCard) {
          servicesGrid.scrollTo({
            left: targetCard.offsetLeft - 24,
            behavior: reducedMotion ? 'auto' : 'smooth',
          });
        }
      });
    });
  }

  /* 6. Smart Service Pre-selection in Quotation Form */
  const serviceSelect = document.querySelector<HTMLSelectElement>('#servicio-interes');
  const serviceTriggers = document.querySelectorAll<HTMLElement>('[data-select-service]');

  serviceTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const serviceName = trigger.dataset.selectService;
      if (serviceSelect && serviceName) {
        serviceSelect.value = serviceName;
        serviceSelect.classList.add('is-highlighted');
        setTimeout(() => serviceSelect.classList.remove('is-highlighted'), 1800);
      }
    });
  });

  /* 7. Image graceful fallback handler */
  const fallbackImgs = document.querySelectorAll<HTMLImageElement>('img[data-fallback]');
  fallbackImgs.forEach((img) => {
    const applyFallback = () => {
      const fb = img.dataset.fallback;
      if (fb && img.src !== fb) {
        img.src = fb;
      }
    };
    img.addEventListener('error', applyFallback, { once: true });
    if (img.complete && img.naturalWidth === 0) {
      applyFallback();
    }
  });

  /* 8. Quotation Form Submission UX */
  const quoteForm = document.querySelector<HTMLFormElement>('#form-cotizacion');
  const successBox = document.querySelector<HTMLElement>('[data-form-success]');
  const whatsappSendBtn = document.querySelector<HTMLAnchorElement>('[data-form-whatsapp]');
  const resetFormBtn = document.querySelector<HTMLButtonElement>('[data-form-reset]');

  quoteForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(quoteForm);
    const nombre = String(formData.get('nombre') || '').trim();
    const correo = String(formData.get('correo') || '').trim();
    const telefono = String(formData.get('telefono') || '').trim();
    const servicio = String(formData.get('servicio') || '').trim();
    const mensaje = String(formData.get('mensaje') || '').trim();

    const waMessage = [
      `Hola *360° Pro Soluciones Integrales S.A.S.*, deseo solicitar una cotización:`,
      `• *Nombre / Razón Social:* ${nombre}`,
      `• *Línea de servicio:* ${servicio}`,
      `• *Teléfono:* ${telefono}`,
      `• *Correo:* ${correo}`,
      mensaje ? `• *Requerimiento:* ${mensaje}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    if (whatsappSendBtn) {
      whatsappSendBtn.href = `https://wa.me/573015409222?text=${encodeURIComponent(waMessage)}`;
    }

    quoteForm.hidden = true;
    if (successBox) {
      successBox.hidden = false;
      successBox.focus();
    }
  });

  resetFormBtn?.addEventListener('click', () => {
    if (!quoteForm || !successBox) return;
    quoteForm.reset();
    successBox.hidden = true;
    quoteForm.hidden = false;
  });
}
