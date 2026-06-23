; (function() {
  'use strict';

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
    if (toggleBtn) toggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  function toggleTheme() {
    setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  }

  setTheme(getPreferredTheme());
  if (toggleBtn) toggleBtn.addEventListener('click', toggleTheme);

  const lang = (navigator.language || 'ar').slice(0, 2);
  if (['ar','he','fa','ur'].includes(lang)) { html.setAttribute('dir','rtl'); html.setAttribute('lang','ar'); }
  else { html.setAttribute('dir','ltr'); html.setAttribute('lang','en'); }

  var DATA_BASE = 'https://raw.githubusercontent.com/abdobwd64-ctrl/anime/main/data';

  /* ─── Search ─── */
  window.searchAnime = function(q) {
    if (!q || !q.trim()) return;
    var isSearch = window.location.pathname.includes('/search.html');
    if (isSearch) {
      window.location.href = 'search.html?q=' + encodeURIComponent(q.trim());
    } else {
      var depth = window.location.pathname.includes('/pages/') ? '../' : '';
      window.location.href = depth + 'pages/search.html?q=' + encodeURIComponent(q.trim());
    }
  };

  window.loadSearch = async function(query) {
    var title = document.getElementById('resultTitle');
    if (title) title.textContent = '🔍 البحث عن: ' + query;
    var data = await fetchJSON(DATA_BASE + '/all-animes.json');
    if (!data) { document.getElementById('searchResults').innerHTML = '<p style="color:var(--text-muted);text-align:center;">لا توجد بيانات</p>'; return; }
    var results = data.filter(function(a) {
      return a.title && a.title.toLowerCase().indexOf(query.toLowerCase()) !== -1;
    });
    var grid = document.getElementById('searchResults');
    if (results.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;">لا توجد نتائج لـ "' + query + '"</p>';
      return;
    }
    results.forEach(function(item) {
      var card = renderCard(item, 'anime.html?id=' + item.id);
      grid.appendChild(card);
    });
  };

  /* ─── Fetch helpers ─── */
  async function fetchJSON(url) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(r.status);
      return await r.json();
    } catch(e) {
      console.error('Fetch error:', url, e);
      return null;
    }
  }

  function posterUrl(p) {
    if (!p) return '';
    if (p.startsWith('http')) return p;
    return DATA_BASE.replace('/main/data', '/main') + '/' + p;
  }

  function renderCard(item, link) {
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.onclick = () => window.location.href = link;
    const poster = posterUrl(item.poster || item.anime_poster || '');
    const ep = item.episode || item.ep || '';
    const title = item.title || item.anime_title || item.name || '?';
    card.innerHTML = `
      <div class="thumb">${poster ? `<img src="${poster}" alt="${title}">` : '<div style="width:100%;height:100%;background:var(--bg-elevated)"></div>'}
        <div class="overlay"><div class="play-btn">▶</div></div>
        ${ep ? `<span class="episode-badge">الحلقة ${ep}</span>` : ''}
      </div>
      <div class="info"><h3>${title}</h3></div>`;
    return card;
  }

  /* ─── Genres ─── */
  var _allAnimesData = null;

  window.filterByGenre = function(genre) {
    document.querySelectorAll('#homeGenreTags .genre-tag').forEach(t => t.classList.remove('active'));
    var target = document.querySelector('#homeGenreTags .genre-tag[data-genre="' + genre + '"]');
    if (target) target.classList.add('active');
    else document.querySelector('#homeGenreTags .genre-tag:first-child').classList.add('active');
    document.getElementById('seasonGrid').style.display = 'none';
    document.querySelector('#homeSeasonTags .genre-tag:first-child').classList.add('active');

    var grid = document.getElementById('genreGrid');
    if (genre === 'all') { grid.style.display = 'none'; return; }
    grid.innerHTML = '';
    grid.style.display = 'grid';
    var filtered = _allAnimesData.filter(function(a) {
      return a.genres && a.genres.indexOf(genre) !== -1;
    });
    if (filtered.length === 0) { grid.style.display = 'none'; return; }
    filtered.forEach(function(item) {
      grid.appendChild(renderCard(item, 'pages/anime.html?id=' + item.id));
    });
  };

  window.filterBySeason = function(season) {
    document.querySelectorAll('#homeSeasonTags .genre-tag').forEach(t => t.classList.remove('active'));
    var target = document.querySelector('#homeSeasonTags .genre-tag[data-season="' + season + '"]');
    if (target) target.classList.add('active');
    else document.querySelector('#homeSeasonTags .genre-tag:first-child').classList.add('active');
    document.getElementById('genreGrid').style.display = 'none';
    document.querySelector('#homeGenreTags .genre-tag:first-child').classList.add('active');

    var grid = document.getElementById('seasonGrid');
    if (season === 'all') { grid.style.display = 'none'; return; }
    grid.innerHTML = '';
    grid.style.display = 'grid';
    var filtered = _allAnimesData.filter(function(a) {
      return a.season && a.season === season;
    });
    if (filtered.length === 0) { grid.style.display = 'none'; return; }
    filtered.forEach(function(item) {
      grid.appendChild(renderCard(item, 'pages/anime.html?id=' + item.id));
    });
  };

  window.loadFilters = async function() {
    var data = await fetchJSON(DATA_BASE + '/all-animes.json');
    if (!data) return;
    _allAnimesData = data;
    var genreSet = {}, seasonSet = {};
    data.forEach(function(a) {
      if (a.genres) a.genres.forEach(function(g) { genreSet[g] = true; });
      if (a.season) seasonSet[a.season] = true;
    });
    var genreContainer = document.getElementById('homeGenreTags');
    Object.keys(genreSet).sort().forEach(function(g) {
      var span = document.createElement('span');
      span.className = 'genre-tag';
      span.textContent = g;
      span.setAttribute('data-genre', g);
      span.onclick = function() { filterByGenre(g); };
      genreContainer.appendChild(span);
    });
    var seasonContainer = document.getElementById('homeSeasonTags');
    if (!seasonContainer) return;
    Object.keys(seasonSet).sort(function(a,b) {
      var aYear = parseInt(a.split(' ')[1]) || 0;
      var bYear = parseInt(b.split(' ')[1]) || 0;
      return bYear - aYear;
    }).forEach(function(s) {
      var span = document.createElement('span');
      span.className = 'genre-tag';
      span.textContent = s;
      span.setAttribute('data-season', s);
      span.onclick = function() { filterBySeason(s); };
      seasonContainer.appendChild(span);
    });
  };

  /* ─── Home page ─── */
  window.loadData = async function() {
    const [latest, popular] = await Promise.all([
      fetchJSON(DATA_BASE + '/latest.json'),
      fetchJSON(DATA_BASE + '/popular.json'),
    ]);

    var params = new URLSearchParams(window.location.search);
    var _latestFull = latest || [];
    var _latestLimit = params.get('show') === 'all' ? _latestFull.length : 24;
    var _showAllLatest = params.get('show') === 'all';

    function renderLatest() {
      var grid = document.getElementById('latestGrid');
      if (!grid) return;
      grid.innerHTML = '';
      var items = _showAllLatest ? _latestFull : _latestFull.slice(0, _latestLimit);
      items.forEach(function(ep) {
        grid.appendChild(renderCard(ep, 'pages/watch.html?id=' + ep.anime_id + '&ep=' + ep.episode));
      });
      var btn = document.getElementById('latestMoreBtn');
      if (btn) {
        if (_latestFull.length > _latestLimit && !_showAllLatest) {
          btn.style.display = 'inline-flex';
          btn.textContent = 'عرض الكل ← (' + _latestFull.length + ')';
          btn.onclick = function(e) { e.preventDefault(); _showAllLatest = true; renderLatest(); btn.style.display = 'none'; };
        } else {
          btn.style.display = 'none';
        }
      }
    }
    renderLatest();

    const popularGrid = document.getElementById('popularGrid');
    if (popularGrid && popular) {
      popular.slice(0, 12).forEach(a => {
        const card = renderCard(a, `pages/anime.html?id=${a.id}`);
        popularGrid.appendChild(card);
      });
    }

    loadFilters().then(function() {
      var p = new URLSearchParams(window.location.search);
      var genreParam = p.get('genre');
      if (genreParam) {
        var tag = document.querySelector('#homeGenreTags .genre-tag[data-genre="' + genreParam + '"]');
        if (tag) tag.click();
      }
      var seasonParam = p.get('season');
      if (seasonParam) {
        var stag = document.querySelector('#homeSeasonTags .genre-tag[data-season="' + seasonParam + '"]');
        if (stag) stag.click();
      }
    });
  };

  /* ─── Anime detail page ─── */
  window.loadAnime = async function(id) {
    const data = await fetchJSON(DATA_BASE + '/anime/' + id + '.json');
    if (!data) { document.body.innerHTML = '<div class="container" style="padding:100px 0;text-align:center;"><h2>❌ الأنمي غير موجود</h2><a href="../index.html">العودة للرئيسية</a></div>'; return; }

    document.title = data.title + ' - AnimeLek';
    document.getElementById('animeTitle').textContent = data.title;
    document.getElementById('posterImg').src = data.poster;
    document.getElementById('backdropImg').src = data.poster;

    const metaMap = { status:'الحالة', type:'النوع', episodes_count:'عدد الحلقات', start_date:'تاريخ البداية', season:'الموسم' };
    const metaContainer = document.getElementById('metaContainer');
    for (const [key, label] of Object.entries(metaMap)) {
      if (data[key]) {
        const div = document.createElement('div');
        div.className = 'item';
        const valueSpan = document.createElement('span');
        valueSpan.className = 'value';
        valueSpan.textContent = data[key];
        if (key === 'season') {
          valueSpan.style.cursor = 'pointer';
          valueSpan.style.color = 'var(--primary-light)';
          valueSpan.title = 'اضغط لعرض أنمي هذا الموسم';
          valueSpan.onclick = function() {
            window.location.href = '../index.html?season=' + encodeURIComponent(data[key]);
          };
        }
        div.innerHTML = `<span class="label">${label}</span> `;
        div.appendChild(valueSpan);
        metaContainer.appendChild(div);
      }
    }

    const genreContainer = document.getElementById('genreContainer');
    if (data.genres) data.genres.forEach(g => {
      const span = document.createElement('span');
      span.className = 'genre-tag';
      span.textContent = g;
      span.style.cursor = 'pointer';
      span.onclick = function(e) {
        e.stopPropagation();
        window.location.href = '../index.html?genre=' + encodeURIComponent(g);
      };
      genreContainer.appendChild(span);
    });

    const storyBox = document.getElementById('storyBox');
    if (data.story) storyBox.innerHTML = `<strong>القصة:</strong><br>${data.story}`;
    else storyBox.style.display = 'none';

    document.getElementById('epCount').textContent = data.episodes ? data.episodes.length : '0';

    const list = document.getElementById('episodesList');
    if (data.episodes) {
      data.episodes.slice().reverse().forEach(ep => {
        const div = document.createElement('div');
        div.className = 'episode-item';
        div.onclick = () => window.location.href = `watch.html?id=${data.id}&ep=${ep.number}`;
        div.innerHTML = `
          <div class="num">${ep.number}</div>
          <div class="info">
            <div class="title">${data.title} - الحلقة ${ep.number}</div>
            <div class="date">${ep.date ? '📅 '+ep.date : ''}</div>
          </div>
          <button class="action">▶</button>`;
        list.appendChild(div);
      });
    }
  };

  /* ─── Episode watch page ─── */
  window.loadEpisode = async function(id, epNum) {
    const data = await fetchJSON(DATA_BASE + '/anime/' + id + '.json');
    if (!data) { document.body.innerHTML = '<div class="container" style="padding:100px 0;text-align:center;"><h2>❌ الحلقة غير موجودة</h2><a href="../index.html">العودة للرئيسية</a></div>'; return; }

    const ep = data.episodes ? data.episodes.find(e => String(e.number) === String(epNum)) : null;
    if (!ep) { document.body.innerHTML = '<div class="container" style="padding:100px 0;text-align:center;"><h2>❌ الحلقة غير موجودة</h2><a href="../index.html">العودة للرئيسية</a></div>'; return; }

    document.title = `الحلقة ${epNum} - ${data.title} - AnimeLek`;

    document.getElementById('breadcrumb').innerHTML =
      `<a href="../index.html">الرئيسية</a> <span>/</span> <a href="anime.html?id=${data.id}">${data.title}</a> <span>/</span> <span style="color:var(--text);font-weight:600;">الحلقة ${epNum}</span>`;

    document.getElementById('epTitle').textContent = `${data.title} - الحلقة ${epNum}`;
    document.getElementById('epDate').textContent = ep.date ? `📅 ${ep.date}` : '';
    const playerBg = document.getElementById('playerBg');
    if (playerBg) playerBg.src = data.poster;

    const tabsContainer = document.getElementById('serverTabs');
    tabsContainer.innerHTML = '';
    if (ep.servers && ep.servers.length) {
      ep.servers.forEach((s, i) => {
        const btn = document.createElement('button');
        btn.className = 'server-tab' + (i === 0 ? ' active' : '');
        btn.textContent = s.name;
        btn.onclick = function() {
          document.querySelectorAll('.server-tab').forEach(el => el.classList.remove('active'));
          this.classList.add('active');
          document.getElementById('playerPlaceholder').style.display = 'none';
          const iframe = document.getElementById('playerIframe');
          iframe.style.display = 'block';
          iframe.src = s.embed_url;
        };
        tabsContainer.appendChild(btn);
      });
    } else {
      tabsContainer.innerHTML = '<p style="color:var(--text-muted);">لا توجد سيرفرات متاحة</p>';
    }

    const navDiv = document.getElementById('navButtons');
    navDiv.innerHTML = `<a href="anime.html?id=${data.id}" style="display:inline-flex;align-items:center;gap:6px;padding:10px 24px;border-radius:10px;border:1px solid var(--border);color:var(--text);font-size:.85rem;">← الحلقات</a>`;
    const allEps = data.episodes || [];
    const idx = allEps.findIndex(e => String(e.number) === String(epNum));
    if (idx > 0) navDiv.innerHTML += `<a href="watch.html?id=${data.id}&ep=${allEps[idx-1].number}" style="display:inline-flex;align-items:center;gap:6px;padding:10px 24px;border-radius:10px;border:1px solid var(--border);color:var(--text);font-size:.85rem;">▶ الحلقة السابقة</a>`;
    if (idx < allEps.length - 1) navDiv.innerHTML += `<a href="watch.html?id=${data.id}&ep=${allEps[idx+1].number}" style="display:inline-flex;align-items:center;gap:6px;padding:10px 24px;border-radius:10px;background:var(--bg-elevated);border:1px solid var(--border);color:var(--text);font-size:.85rem;">▶ الحلقة التالية</a>`;

    const tbody = document.getElementById('downloadBody');
    tbody.innerHTML = '';
    if (ep.downloads && ep.downloads.length) {
      ep.downloads.forEach(dl => {
        const qClass = dl.quality === '1080p' ? 'fhd' : dl.quality === '720p' ? 'hd' : 'sd';
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight:600;">${dl.server}</td>
          <td><span class="quality-badge ${qClass}">${dl.quality}</span></td>
          <td><span class="lang-badge">${dl.language || 'مترجم'}</span></td>
          <td style="text-align:end;"><a href="${dl.url}" target="_blank" class="dl-btn">⬇ تحميل</a></td>`;
        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">لا توجد روابط تحميل</td></tr>';
    }
  };

})();
