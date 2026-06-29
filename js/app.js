(function () {
  'use strict';

  const header = document.querySelector('.site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const topNav = document.querySelector('.top-nav');
  const allNavLinks = document.querySelectorAll('.top-nav a');
  const navTriggers = document.querySelectorAll('.nav-trigger');
  const navItems = document.querySelectorAll('.nav-item--dropdown');
  const navBackdrop = document.querySelector('.nav-glass-backdrop');
  const sections = document.querySelectorAll('section[id], article[id]');
  const revealEls = document.querySelectorAll('.section-header, .block, .color-band, .feature-shot, .hero-content');
  const toast = document.getElementById('toast');

  // Header transparente sobre portada
  const hero = document.querySelector('.hero--cinematic');
  const heroThreshold = () => (hero ? hero.offsetHeight - 80 : 60);

  const updateHeader = () => {
    if (header?.classList.contains('nav-open')) return;
    header?.classList.toggle('scrolled', window.scrollY > heroThreshold());
  };

  window.addEventListener('scroll', () => requestAnimationFrame(updateHeader), { passive: true });
  window.addEventListener('resize', updateHeader);
  updateHeader();

  // Menú móvil
  navToggle?.addEventListener('click', () => {
    const open = header?.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('nav-open', open);
    if (open) header?.classList.add('scrolled');
  });

  const syncGlassBackdrop = () => {
    const anyOpen = Array.from(navItems).some(i => i.classList.contains('is-open'));
    document.body.classList.toggle('nav-glass-open', anyOpen);
  };

  const closeAllDropdowns = () => {
    navItems.forEach(i => {
      i.classList.remove('is-open');
      i.querySelector('.nav-trigger')?.setAttribute('aria-expanded', 'false');
    });
    syncGlassBackdrop();
  };

  // Desplegables — click (desktop + móvil)
  navTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      const item = trigger.closest('.nav-item--dropdown');
      if (!item) return;
      e.preventDefault();
      const wasOpen = item.classList.contains('is-open');
      closeAllDropdowns();
      if (!wasOpen) {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
      syncGlassBackdrop();
    });
  });

  // Cerrar menú al navegar
  allNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      header?.classList.remove('nav-open');
      navToggle?.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
      navItems.forEach(i => {
        i.classList.remove('is-open');
        i.querySelector('.nav-trigger')?.setAttribute('aria-expanded', 'false');
      });
      updateHeader();
    });
  });

  // Cerrar desplegables al hacer click fuera
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-item--dropdown')) {
      closeAllDropdowns();
    }
  });

  // Click en backdrop cierra
  navBackdrop?.addEventListener('click', closeAllDropdowns);

  // Escape cierra
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDropdowns();
      closeLangMenu();
    }
  });

  // ─── Selector de idioma (ES / EN) + traducción de página ───
  const langSwitcher = document.getElementById('lang-switcher');
  const langTrigger = document.getElementById('lang-trigger');
  const langOptions = document.querySelectorAll('.lang-option');
  const LANGUAGE_KEY = 'printit_manual_lang';

  const closeLangMenu = () => {
    if (!langSwitcher || !langTrigger) return;
    langSwitcher.classList.remove('is-open');
    langTrigger.setAttribute('aria-expanded', 'false');
  };

  const openLangMenu = () => {
    if (!langSwitcher || !langTrigger) return;
    closeAllDropdowns();
    langSwitcher.classList.add('is-open');
    langTrigger.setAttribute('aria-expanded', 'true');
  };

  const setActiveLang = (lang) => {
    langOptions.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    if (langTrigger) {
      langTrigger.textContent = lang.toUpperCase();
    }
    document.documentElement.lang = lang === 'en' ? 'en' : 'es';
  };

  const clearGoogTransCookie = () => {
    const expires = 'Thu, 01 Jan 1970 00:00:00 UTC';
    document.cookie = `googtrans=;expires=${expires};path=/`;
    const host = location.hostname;
    if (host) {
      document.cookie = `googtrans=;expires=${expires};path=/;domain=${host}`;
      document.cookie = `googtrans=;expires=${expires};path=/;domain=.${host}`;
    }
  };

  const setGoogTransCookie = (lang) => {
    if (lang === 'es') {
      clearGoogTransCookie();
      return;
    }
    const value = `/es/${lang}`;
    document.cookie = `googtrans=${value};path=/`;
    const host = location.hostname;
    if (host) {
      document.cookie = `googtrans=${value};path=/;domain=${host}`;
      document.cookie = `googtrans=${value};path=/;domain=.${host}`;
    }
  };

  const waitForTranslateCombo = (maxAttempts = 40, intervalMs = 250) =>
    new Promise(resolve => {
      let attempts = 0;
      const tick = () => {
        const combo = document.querySelector('.goog-te-combo');
        if (combo) {
          resolve(combo);
          return;
        }
        attempts += 1;
        if (attempts >= maxAttempts) {
          resolve(null);
          return;
        }
        window.setTimeout(tick, intervalMs);
      };
      tick();
    });

  const applyLanguage = async (lang, { persist = true, reloadOnFail = true } = {}) => {
    if (!lang) return;
    if (persist) {
      localStorage.setItem(LANGUAGE_KEY, lang);
    }
    setActiveLang(lang);

    const combo = await waitForTranslateCombo();
    if (combo) {
      combo.value = lang;
      combo.dispatchEvent(new Event('change'));
      return;
    }

    setGoogTransCookie(lang);
    if (reloadOnFail) {
      window.location.reload();
    }
  };

  const savedLang = localStorage.getItem(LANGUAGE_KEY) || 'es';
  setActiveLang(savedLang);

  langTrigger?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isOpen = langSwitcher?.classList.contains('is-open');
    if (isOpen) closeLangMenu();
    else openLangMenu();
  });

  langOptions.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const lang = btn.dataset.lang;
      closeLangMenu();
      applyLanguage(lang);
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#lang-switcher')) {
      closeLangMenu();
    }
  });

  const restoreSavedLanguage = () => {
    if (savedLang !== 'es') {
      applyLanguage(savedLang, { persist: false, reloadOnFail: true });
    }
  };

  window.addEventListener('googletranslate-ready', restoreSavedLanguage);
  window.addEventListener('load', restoreSavedLanguage);

  // Enlace activo según scroll
  const observerNav = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        allNavLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
        // Marcar trigger del capítulo padre
        navTriggers.forEach(trigger => {
          const dropdown = trigger.nextElementSibling;
          if (!dropdown) return;
          const hasActive = dropdown.querySelector(`a[href="#${id}"]`);
          trigger.classList.toggle('active', !!hasActive);
        });
        document.querySelectorAll('.nav-link').forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      });
    },
    { rootMargin: '-35% 0px -55% 0px', threshold: 0 }
  );

  sections.forEach(s => observerNav.observe(s));

  // Reveal al scroll
  const observerReveal = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observerReveal.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.06, rootMargin: '0px 0px -32px 0px' }
  );

  revealEls.forEach(el => observerReveal.observe(el));

  // Copiar HEX
  document.querySelectorAll('.copy-hex').forEach(btn => {
    btn.addEventListener('click', async () => {
      const hex = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(hex);
        showToast(`Copiado: ${hex}`);
      } catch {
        showToast(hex);
      }
    });
  });

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 2200);
  }
})();
