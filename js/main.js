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

  var AR_MONTHS = {'يناير':1,'فبراير':2,'مارس':3,'أبريل':4,'إبريل':4,'مايو':5,'يونيو':6,'يوليو':7,'أغسطس':8,'غشت':8,'سبتمبر':9,'أكتوبر':10,'نوفمبر':11,'ديسمبر':12};

  function dateSortValue(item) {
    var d = item.date_sort || item.date || '';
    if (d && d.length === 10 && d[4] === '-' && d[7] === '-') return d;
    var m = d.match(/(\d+)\s+([^,\s]+),?\s*(\d+)/);
    if (m) {
      var monthNum = AR_MONTHS[m[2]] || 1;
      return m[3] + '-' + String(monthNum).padStart(2,'0') + '-' + String(parseInt(m[1])).padStart(2,'0');
    }
    return '';
  }

  function renderCard(item, link, showDate) {
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.onclick = () => window.location.href = link;
    const poster = posterUrl(item.poster || item.anime_poster || '');
    const ep = item.episode || item.ep || '';
    const title = item.title || item.anime_title || item.name || '?';
    const date = item.date || '';
    card.innerHTML = `
      <div class="thumb">${poster ? `<img src="${poster}" alt="${title}">` : '<div style="width:100%;height:100%;background:var(--bg-elevated)"></div>'}
        <div class="overlay"><div class="play-btn">▶</div></div>
        ${ep ? `<span class="episode-badge">الحلقة ${ep}</span>` : ''}
      </div>
      <div class="info"><h3>${title}</h3>${showDate && date ? `<span style="font-size:.7rem;color:var(--text-muted);">📅 ${date}</span>` : ''}</div>`;
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
    if (genreContainer) {
      Object.keys(genreSet).sort().forEach(function(g) {
        var span = document.createElement('span');
        span.className = 'genre-tag';
        span.textContent = g;
        span.setAttribute('data-genre', g);
        span.onclick = function() { filterByGenre(g); };
        genreContainer.appendChild(span);
      });
    }
    var seasonContainer = document.getElementById('homeSeasonTags');
    if (seasonContainer) {
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
    }
    var allGenreContainer = document.getElementById('allGenreTags');
    if (allGenreContainer) {
      Object.keys(genreSet).sort().forEach(function(g) {
        var span = document.createElement('span');
        span.className = 'genre-tag';
        span.textContent = g;
        span.setAttribute('data-genre', g);
        span.onclick = function() { filterAllAnime('genre', g); };
        allGenreContainer.appendChild(span);
      });
    }
    var allSeasonContainer = document.getElementById('allSeasonTags');
    if (allSeasonContainer) {
      Object.keys(seasonSet).sort(function(a,b) {
        var aYear = parseInt(a.split(' ')[1]) || 0;
        var bYear = parseInt(b.split(' ')[1]) || 0;
        return bYear - aYear;
      }).forEach(function(s) {
        var span = document.createElement('span');
        span.className = 'genre-tag';
        span.textContent = s;
        span.setAttribute('data-season', s);
        span.onclick = function() { filterAllAnime('season', s); };
        allSeasonContainer.appendChild(span);
      });
    }
  };

  var _allFilter = {genre:'all', season:'all'};

  /* ─── All Anime page ─── */
  window.filterAllAnime = function(type, value) {
    _allFilter[type] = value;
    var containerId = type === 'genre' ? 'allGenreTags' : 'allSeasonTags';
    document.querySelectorAll('#' + containerId + ' .genre-tag').forEach(function(t) {
      t.classList.remove('active');
    });
    var attr = type === 'genre' ? 'data-genre' : 'data-season';
    var target = document.querySelector('#' + containerId + ' .genre-tag[' + attr + '="' + value + '"]');
    if (target) target.classList.add('active');
    else document.querySelector('#' + containerId + ' .genre-tag:first-child').classList.add('active');
    var otherType = type === 'genre' ? 'season' : 'genre';
    var otherContainer = type === 'genre' ? 'allSeasonTags' : 'allGenreTags';
    if (_allFilter[otherType] !== 'all') {
      _allFilter[otherType] = 'all';
      document.querySelectorAll('#' + otherContainer + ' .genre-tag').forEach(function(t) {
        t.classList.remove('active');
      });
      document.querySelector('#' + otherContainer + ' .genre-tag:first-child').classList.add('active');
    }
    var grid = document.getElementById('allAnimeGrid');
    if (!grid) return;
    grid.innerHTML = '';
    var items = _allAnimesData.filter(function(a) {
      if (_allFilter.genre !== 'all' && (!a.genres || a.genres.indexOf(_allFilter.genre) === -1)) return false;
      if (_allFilter.season !== 'all' && a.season !== _allFilter.season) return false;
      return true;
    });
    items.forEach(function(item) {
      grid.appendChild(renderCard(item, 'anime.html?id=' + item.id));
    });
  };

  window.loadAllAnime = async function() {
    await loadFilters();
    filterAllAnime('genre', 'all');
  };

  /* ─── All Latest Episodes page ─── */
  var _ALL_LATEST_PAGE = 1;
  var _ALL_LATEST_PER = 30;

  window.loadAllLatest = async function() {
    var data = await fetchJSON(DATA_BASE + '/latest.json');
    if (!data) return;
    data = data.slice();
    data.sort(function(a,b) { return dateSortValue(b).localeCompare(dateSortValue(a)); });
    var total = data.length;
    var dateEl = document.getElementById('allLatestDate');
    if (dateEl && data.length) dateEl.textContent = '📅 ' + data[0].date;

    function renderPage(page) {
      var start = (page - 1) * _ALL_LATEST_PER;
      var end = Math.min(start + _ALL_LATEST_PER, total);
      var grid = document.getElementById('allLatestGrid');
      if (!grid) return;
      grid.innerHTML = '';
      for (var i = start; i < end; i++) {
        grid.appendChild(renderCard(data[i], 'watch.html?id=' + data[i].anime_id + '&ep=' + data[i].episode, true));
      }
      var pages = Math.ceil(total / _ALL_LATEST_PER);
      var pg = document.getElementById('pagination');
      if (!pg) return;
      pg.innerHTML = '';
      if (pages <= 1) return;
      if (page > 1) {
        var prev = document.createElement('button');
        prev.textContent = '←';
        prev.onclick = function() { renderPage(page - 1); window.scrollTo(0,0); };
        pg.appendChild(prev);
      }
      var rangeStart = Math.max(1, page - 2);
      var rangeEnd = Math.min(pages, page + 2);
      if (rangeStart > 1) {
        var first = document.createElement('button');
        first.textContent = '1';
        first.onclick = function() { renderPage(1); window.scrollTo(0,0); };
        pg.appendChild(first);
        if (rangeStart > 2) {
          var dots = document.createElement('span');
          dots.textContent = '...';
          dots.style.cssText = 'padding:8px 4px;color:var(--text-muted);';
          pg.appendChild(dots);
        }
      }
      for (var p = rangeStart; p <= rangeEnd; p++) {
        var btn = document.createElement('button');
        btn.textContent = String(p);
        if (p === page) btn.className = 'active';
        btn.onclick = (function(n) { return function() { renderPage(n); window.scrollTo(0,0); }; })(p);
        pg.appendChild(btn);
      }
      if (rangeEnd < pages) {
        if (rangeEnd < pages - 1) {
          var dots2 = document.createElement('span');
          dots2.textContent = '...';
          dots2.style.cssText = 'padding:8px 4px;color:var(--text-muted);';
          pg.appendChild(dots2);
        }
        var last = document.createElement('button');
        last.textContent = String(pages);
        last.onclick = function() { renderPage(pages); window.scrollTo(0,0); };
        pg.appendChild(last);
      }
      if (page < pages) {
        var next = document.createElement('button');
        next.textContent = '→';
        next.onclick = function() { renderPage(page + 1); window.scrollTo(0,0); };
        pg.appendChild(next);
      }
    }
    renderPage(1);
  };

  /* ─── Home page ─── */
  window.loadData = async function() {
    const [latest, popular] = await Promise.all([
      fetchJSON(DATA_BASE + '/latest.json'),
      fetchJSON(DATA_BASE + '/popular.json'),
    ]);

    var _latestFull = (latest || []).slice();
    _latestFull.sort(function(a,b) { return dateSortValue(b).localeCompare(dateSortValue(a)); });

    var dateEl = document.getElementById('latestDate');
    if (dateEl && _latestFull.length) {
      var firstDate = _latestFull[0].date || '';
      dateEl.textContent = firstDate ? '📅 ' + firstDate : '';
    }

    var grid = document.getElementById('latestGrid');
    if (grid) {
      _latestFull.slice(0, 24).forEach(function(ep) {
        grid.appendChild(renderCard(ep, 'pages/watch.html?id=' + ep.anime_id + '&ep=' + ep.episode, true));
      });
    }

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
    document.getElementById('posterImg').src = posterUrl(data.poster);
    document.getElementById('backdropImg').src = posterUrl(data.poster);

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
    if (playerBg) playerBg.src = posterUrl(data.poster);

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

    var placeholder = document.getElementById('playerPlaceholder');
    if (placeholder && ep.servers && ep.servers.length) {
      placeholder.style.cursor = 'pointer';
      placeholder.onclick = function() {
        var firstTab = document.querySelector('.server-tab');
        if (firstTab) firstTab.click();
      };
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
