; (function() {
  'use strict';

  /* ─── Theme ─── */
  const html = document.documentElement;
  const toggleBtn = document.getElementById('themeToggle');
  const STORAGE_KEY = 'animelek_theme';

  function getPreferredTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    if (toggleBtn) {
      toggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  function toggleTheme() {
    const current = html.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  setTheme(getPreferredTheme());
  if (toggleBtn) toggleBtn.addEventListener('click', toggleTheme);

  /* ─── Language / Direction ─── */
  const lang = (navigator.language || navigator.languages?.[0] || 'ar').slice(0, 2);
  const rtlLangs = ['ar', 'he', 'fa', 'ur'];
  if (rtlLangs.includes(lang)) {
    html.setAttribute('dir', 'rtl');
    html.setAttribute('lang', 'ar');
  } else {
    html.setAttribute('dir', 'ltr');
    html.setAttribute('lang', 'en');
  }

  /* ─── Card Renderer ─── */
  window.renderSampleCards = function(containerId, items) {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'anime-card';
      card.onclick = function() { window.location.href = item.url || '#'; };
      const thumbColor = getRandomColor();
      card.innerHTML = `
        <div class="thumb">
          <div style="width:100%;height:100%;background:${thumbColor};display:flex;align-items:center;justify-content:center;font-size:2.5rem;color:rgba(255,255,255,.5);">🍥</div>
          <div class="overlay">
            <div class="play-btn">▶</div>
          </div>
          ${item.ep ? `<span class="episode-badge">${item.ep}</span>` : ''}
        </div>
        <div class="info">
          <h3>${item.title}</h3>
          <div class="meta">
            <span>${item.ep || ''}</span>
            <span>${item.quality || ''}</span>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  };

  function getRandomColor() {
    const colors = ['#7c3aed', '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6', '#8b5cf6'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /* ─── Server Tabs (watch page) ─── */
  document.querySelectorAll('.server-tabs').forEach(container => {
    container.addEventListener('click', function(e) {
      const tab = e.target.closest('.server-tab');
      if (!tab) return;
      this.querySelectorAll('.server-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

})();
