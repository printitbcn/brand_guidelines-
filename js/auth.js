(function () {
  'use strict';

  const AUTH_KEY = 'printit_manual_auth';
  const AUTH_TTL = 24 * 60 * 60 * 1000;
  const PASS_HASH = 'f0c5411791e70d4c779d5bb15387371109c851eb5dbe85eaafaec755a5b2b0b8';

  const gate = document.getElementById('auth-gate');
  const form = document.getElementById('auth-form');
  const input = document.getElementById('auth-password');
  const errorEl = document.getElementById('auth-error');

  async function sha256(text) {
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function readSession() {
    try {
      const raw = sessionStorage.getItem(AUTH_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function isAuthenticated() {
    const session = readSession();
    if (!session) return false;
    return session.v === PASS_HASH && Date.now() - session.t < AUTH_TTL;
  }

  function setAuthenticated() {
    sessionStorage.setItem(AUTH_KEY, JSON.stringify({ v: PASS_HASH, t: Date.now() }));
  }

  function clearAuthenticated() {
    sessionStorage.removeItem(AUTH_KEY);
  }

  function unlock() {
    document.documentElement.classList.remove('auth-locked');
    document.documentElement.classList.add('auth-ready');
    gate?.setAttribute('hidden', '');
    document.body.style.overflow = '';
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }
    if (input) input.value = '';
  }

  function lock() {
    document.documentElement.classList.add('auth-locked');
    document.documentElement.classList.remove('auth-ready');
    gate?.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    input?.focus();
  }

  function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function protectDownloads() {
    const selectors = 'a[download], a.btn--download, a.protected-asset';
    document.querySelectorAll(selectors).forEach(link => {
      if (!link.dataset.protectedBound) {
        link.dataset.protectedBound = '1';
        link.addEventListener('click', e => {
          if (isAuthenticated()) return;
          e.preventDefault();
          lock();
          showError('Introduce la contraseña para descargar archivos.');
        });
      }
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const value = input?.value.trim() || '';
    if (!value) {
      showError('Introduce la contraseña de acceso.');
      return;
    }

    const hash = await sha256(value);
    if (hash !== PASS_HASH) {
      showError('Contraseña incorrecta. Contacta con el dpto. de diseño.');
      return;
    }

    setAuthenticated();
    unlock();
    protectDownloads();
  }

  function init() {
    if (isAuthenticated()) {
      unlock();
    } else {
      lock();
    }

    form?.addEventListener('submit', handleSubmit);
    document.getElementById('auth-logout')?.addEventListener('click', e => {
      e.preventDefault();
      clearAuthenticated();
      lock();
    });

    protectDownloads();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.PrintItAuth = { isAuthenticated, lock, unlock };
})();
