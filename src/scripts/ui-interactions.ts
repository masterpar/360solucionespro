/**
 * ============================================================================
 * UI INTERACTIONS & GLOBAL SCROLL-WORLD SECTION CHOREOGRAPHY
 * ============================================================================
 */

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
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* 2. Global scroll scrub: Header progress bar, Hero dive & Parallax layers */
  const headerProgress = document.querySelector<HTMLElement>('[data-header-progress]');
  const headerEl = document.querySelector<HTMLElement>('[data-site-header]');
  const heroBg = document.querySelector<HTMLElement>('[data-hero-bg]');
  const parallaxItems = document.querySelectorAll<HTMLElement>('[data-sw-parallax]');

  const updateScrollEffects = () => {
    const scrollY = window.scrollY;
    const docHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const pageProgress = Math.min(1, Math.max(0, scrollY / docHeight));

    if (headerProgress) {
      headerProgress.style.transform = `scaleX(${pageProgress.toFixed(4)})`;
    }

    if (headerEl) {
      headerEl.classList.toggle('is-scrolled', scrollY > 18);
    }

    if (!reducedMotion && heroBg && scrollY < window.innerHeight * 1.3) {
      const heroRatio = Math.min(1, scrollY / window.innerHeight);
      const scale = 1 + heroRatio * 0.14;
      const translateY = scrollY * 0.22;
      heroBg.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
    }

    if (!reducedMotion) {
      parallaxItems.forEach((item) => {
        const speed = parseFloat(item.dataset.swParallax || '0.08');
        const rect = item.getBoundingClientRect();
        if (rect.bottom > -100 && rect.top < window.innerHeight + 100) {
          const centerOffset = rect.top + rect.height * 0.5 - window.innerHeight * 0.5;
          const shift = -centerOffset * speed;
          item.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
        }
      });
    }
  };

  window.addEventListener('scroll', () => requestAnimationFrame(updateScrollEffects), {
    passive: true,
  });
  updateScrollEffects();

  /* 3. Active navigation indicator in Header */
  const navAnchors = document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]');
  const trackedSections = ['inicio', 'servicios', 'nosotros', 'por-que-elegirnos', 'contacto']
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => Boolean(el));

  const updateActiveNav = () => {
    const marker = window.scrollY + 180;
    let activeId = 'inicio';

    for (const sec of trackedSections) {
      if (sec.offsetTop <= marker) {
        activeId = sec.id;
      }
    }

    // Map #por-que-elegirnos to #nosotros in simplified 4-item header
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

  /* 7. Image graceful fallback handler for corporate <img> tags */
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

