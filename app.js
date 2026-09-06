// app.js — safe initialization wrapper for SCOUT HUB
const App = (() => {
  // helper to safely get element text/content
  const $ = id => document.getElementById(id);

  function modal(html) {
    const body = $('modalBody');
    const modalEl = $('modal');
    if (!body || !modalEl) return;
    body.innerHTML = html || '';
    modalEl.classList.remove('hidden');
    try { modalEl.focus(); } catch (e) {}
  }

  function closeModal() {
    const modalEl = $('modal');
    if (!modalEl) return;
    modalEl.classList.add('hidden');
    const body = $('modalBody');
    if (body) body.innerHTML = '';
  }

  async function updateStatus() {
    try {
      let online = false;
      if (window.SupabaseService?.configured?.()) {
        try { await SupabaseService.health(); online = true; } catch (e) { online = false; }
      }
      const connectionEl = $('connectionStatus');
      if (connectionEl) connectionEl.textContent = online ? 'Online' : (window.I18n?.t?.('offline') || 'Offline');

      const modeBadge = $('modeBadge');
      if (modeBadge) {
        const onlineText = window.I18n?.t?.('online') || 'online';
        const offlineText = (window.I18n?.t?.('offline') || 'offline').toUpperCase();
        modeBadge.textContent = online ? `🟢 ${onlineText}` : `🟠 ${offlineText}`;
      }
    } catch (err) {
      console.warn('[App] updateStatus failed', err);
    }
  }

  function applyTheme() {
    try { window.applyTheme?.(); } catch (e) { console.warn('applyTheme failed', e); }
  }

  function firstLogin(user) {
    try {
      if (!user?.id) return;
      const key = `scoutHub.firstLogin.${user.id}`;
      if (localStorage.getItem(key) === '1') return;
      localStorage.setItem(key, '1');
      const box = document.createElement('div');
      box.className = 'welcome-overlay';
      box.innerHTML = `
        <div class="welcome-card">
          <div class="welcome-fleur">⚜️</div>
          <div class="welcome-orbit">🧭</div>
          <h1>Byenveni!</h1>
          <p>Mèsi paske w enskri nan SCOUT HUB.</p>
          <button id="welcomeClose" class="primary-btn">Kontinye</button>
        </div>`;
      document.body.appendChild(box);
      box.querySelector('#welcomeClose')?.addEventListener('click', () => box.remove());
    } catch (e) { console.warn('[App] firstLogin', e); }
  }

  function badgeCelebration(b) {
    try {
      const box = document.createElement('div');
      box.className = 'badge-celebration';
      box.innerHTML = `<div class="badge-burst">⚜️ ✦ ⚜️</div><div class="badge-card"><div class="badge-icon">${b.icon||'🏅'}</div><div class="badge-title">${b.title||'Bravo!'}</div></div>`;
      document.body.appendChild(box);
      setTimeout(() => box.remove(), 3800);
    } catch (e) { console.warn('[App] badgeCelebration', e); }
  }

  async function refresh() {
    try {
      // theme and i18n
      try { applyTheme(); } catch (e) {}
      try { window.I18n?.apply?.(); } catch (e) {}
      // render modules if available (guarded)
      try { window.Members?.render?.(); } catch (e) {}
      try { window.Activities?.render?.(); } catch (e) {}
      try { window.Games?.init?.(); } catch (e) {}
      try { window.Chat?.renderConversations?.(); } catch (e) {}
      // update counters if present
      try {
        const memberCount = $('memberCount');
        if (memberCount && window.Members?.count != null) memberCount.textContent = String(window.Members.count);
      } catch (e) {}
      // status
      await updateStatus();
    } catch (e) {
      console.warn('[App] refresh error', e);
    }
  }

  async function init() {
    // Safely init optional modules (do not throw if missing)
    try { window.Sound?.init?.(); } catch (e) { console.warn('Sound.init failed', e); }
    try { window.NotificationCenter?.init?.(); } catch (e) {}
    try { window.ScoutMusic?.init?.(); } catch (e) {}
    // SessionManager may be async but might not exist
    try {
      await (window.SessionManager?.init?.() || Promise.resolve());
      try { window.Realtime?.start?.(); } catch (e) {}
    } catch (e) { console.warn('[SESSION]', e?.message || e); }

    // Restore auth and storage but don't block UI if they fail
    try {
      await Auth?.restore?.();
    } catch (e) { console.warn('[Auth.restore]', e); }
    try {
      if (window.SupabaseService?.configured?.()) {
        await StorageService?.hydrate?.();
      }
    } catch (e) { console.warn('[Storage.hydrate]', e); }

    // wire up events
    try {
      window.addEventListener('scout:session', e => {
        updateStatus();
        firstLogin(e?.detail?.user || Auth.get?.());
        if (e?.detail?.user) window.Realtime?.start?.();
      });
      window.addEventListener('scout:badge-earned', e => badgeCelebration(e?.detail || {}));
      window.addEventListener('scout:announcement', e => {
        if (document.visibilityState === 'visible') {
          try { NotificationCenter?.banner?.(`📢 ${e.detail?.title || 'Nouvel anons'}`, e.detail?.content || e.detail?.body || ''); } catch (er) {}
        }
      });
    } catch (e) { console.warn('[App] event binding failed', e); }

    // initial refresh
    try { await refresh(); } catch (e) {}
  }

  // small API for other modules
  return {
    init,
    refresh,
    modal,
    closeModal,
    firstLogin,
    badgeCelebration,
    applyTheme
  };
})();

// expose globally
if (typeof window !== 'undefined') window.App = App;
