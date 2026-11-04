// My photos: galleries under each location and each day, and (in upload mode) "+ Add photos" buttons.
// Photos live in the repo (photos/full, photos/thumb) and are listed in photos/photos.json.
// Uploading commits straight to GitHub with a token kept only in this browser; visitors never see the buttons.
(function () {
  var OWNER = 'yavor-mishev', REPO = 'morocco-2026', BRANCH = 'main';
  var API = 'https://api.github.com/repos/' + OWNER + '/' + REPO;
  var RAW = 'https://raw.githubusercontent.com/' + OWNER + '/' + REPO + '/' + BRANCH + '/';
  var FULL_PX = 2000, THUMB_PX = 640;

  var T = {
    en: {
      day: 'My photos', add: 'Add photos', one: 'photo', many: 'photos', alt: 'My photo: ',
      mode: 'Photo uploads are on for this device. Every location has an “Add photos” button.', exit: 'Turn off',
      setupH: 'Turn on photo uploads', setupP: 'Paste a GitHub fine-grained token with access to only the morocco-2026 repository and “Contents: Read and write”. It is saved only in this browser.',
      save: 'Save', cancel: 'Cancel', create: 'Create a token', checking: 'Checking…', bad: 'That token can’t write to the repository.',
      dlgH: function (n, where) { return n + ' ' + (n === 1 ? 'photo' : 'photos') + ' for ' + where; },
      cap: 'Caption (optional)', upload: 'Upload', preparing: 'Preparing photos…',
      sending: function (i, n) { return 'Uploading ' + i + ' of ' + n + '…'; }, saving: 'Saving…',
      done: function (n) { return n + (n === 1 ? ' photo' : ' photos') + ' uploaded. Everyone will see ' + (n === 1 ? 'it' : 'them') + ' in about a minute.'; },
      cant: 'Couldn’t read this file (try JPEG): ', fail: 'Upload failed: ', del: 'Delete this photo from the site?', deleted: 'Photo removed.', remove: 'Delete photo'
    },
    bg: {
      day: 'Моите снимки', add: 'Добави снимки', one: 'снимка', many: 'снимки', alt: 'Моя снимка: ',
      mode: 'Качването на снимки е включено на това устройство. Всяко място има бутон „Добави снимки“.', exit: 'Изключи',
      setupH: 'Включи качването на снимки', setupP: 'Постави GitHub fine-grained токен с достъп само до хранилището morocco-2026 и „Contents: Read and write“. Пази се само в този браузър.',
      save: 'Запази', cancel: 'Отказ', create: 'Създай токен', checking: 'Проверка…', bad: 'Този токен не може да пише в хранилището.',
      dlgH: function (n, where) { return n + ' ' + (n === 1 ? 'снимка' : 'снимки') + ' за ' + where; },
      cap: 'Надпис (по желание)', upload: 'Качи', preparing: 'Подготвям снимките…',
      sending: function (i, n) { return 'Качване ' + i + ' от ' + n + '…'; }, saving: 'Записване…',
      done: function (n) { return n + ' ' + (n === 1 ? 'снимка е качена' : 'снимки са качени') + '. Всички ще ги видят след около минута.'; },
      cant: 'Не мога да прочета този файл (опитай JPEG): ', fail: 'Качването не успя: ', del: 'Да изтрия ли тази снимка от сайта?', deleted: 'Снимката е изтрита.', remove: 'Изтрий снимката'
    }
  };

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  var token = store('gh-photo-token');
  var wantSetup = /[?&]edit\b/.test(location.search) && !token;
  var lang = (document.querySelector('[data-l="bg"]') && !document.querySelector('[data-l="bg"]').hidden) ? 'bg' : 'en';
  var data = [];
  var local = {};   // src -> object URL for photos uploaded in this session, until GitHub Pages has them

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function key(art) { return art.getAttribute('data-pkey') || art.getAttribute('data-stop'); }
  function dayOf(el) { var d = el.closest('.day'); return d ? +d.id.replace(/\D/g, '') : 0; }
  function title(art) { var h = art.querySelector('h3'); return h ? h.childNodes[0].textContent.trim() : ''; }
  function url(p, which) { return local[p[which]] || p[which]; }

  // A photo that isn't on GitHub Pages yet (just uploaded) still loads from the repo itself.
  document.addEventListener('error', function (e) {
    var im = e.target;
    if (im.tagName !== 'IMG' || !im.hasAttribute('data-ph') || im.src.indexOf(RAW) === 0) return;
    if (im.srcset) im.srcset = im.srcset.split(', ').map(function (c) { return c.indexOf('blob:') === 0 ? c : RAW + c; }).join(', ');
    im.src = RAW + im.getAttribute('src');
  }, true);

  function fig(p, l, where) {
    var cap = p[l] || p.en || p.bg || '';
    return '<figure><img data-ph src="' + esc(url(p, 'thumb')) + '" data-full="' + esc(url(p, 'src')) + '" alt="' + esc(cap || T[l].alt + where) + '" loading="lazy" decoding="async">' +
      '<figcaption' + (cap ? '' : ' hidden') + '>' + esc(cap) + '</figcaption>' +
      (token ? '<button type="button" class="ph-del" data-del="' + esc(p.src) + '" aria-label="' + T[l].remove + '" title="' + T[l].remove + '">×</button>' : '') + '</figure>';
  }
  function count(n, l) { return n + ' ' + (n === 1 ? T[l].one : T[l].many); }
  function byTime(a, b) { return (a.taken || '~').localeCompare(b.taken || '~'); }

  function render() {
    ['en', 'bg'].forEach(function (l) {
      var root = document.querySelector('[data-l="' + l + '"]'); if (!root) return;
      root.querySelectorAll('.stopgal, .mygal').forEach(function (g) { g.remove(); });
      // per location: your photos replace the stop's photo with a carousel
      root.querySelectorAll('.day article.stop[data-stop]').forEach(function (art) {
        var k = key(art), ps = data.filter(function (p) { return p.stop === k; }).sort(byTime);
        var canAdd = token || wantSetup, where = title(art);
        restore(art);
        if (ps.length) carousel(art, ps, l, where);
        if (!canAdd) return;
        var box = document.createElement('div'); box.className = 'stopgal';
        box.innerHTML = '<button type="button" class="addph" data-add="' + esc(k) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' + T[l].add + '</button>';
        (art.querySelector(':scope > div') || art).appendChild(box);
      });
      // per day (photos added from the inbox folder, without a location)
      for (var d = 1; d <= 8; d++) {
        var sec = root.querySelector('#' + (l === 'bg' ? 'bg-day-' : 'day-') + d); if (!sec) continue;
        var ps = data.filter(function (p) { return p.day === d && !p.stop; }).sort(byTime);
        if (!ps.length) continue;
        var g = document.createElement('div'); g.className = 'mygal';
        g.innerHTML = '<h3>' + T[l].day + ' <span class="mono">' + count(ps.length, l) + '</span></h3><div class="mygrid">' +
          ps.map(function (p) { return fig(p, l, (l === 'bg' ? 'ден ' : 'day ') + d); }).join('') + '</div>';
        sec.appendChild(g);
      }
    });
    if (window.lbCollect) window.lbCollect();
  }

  // ---------- carousel ----------
  var orig = new WeakMap();   // article -> its original figure (or null) and layout, to restore when photos are removed
  function restore(art) {
    var o = orig.get(art); if (!o) return;
    var car = art.querySelector(':scope > figure.car'); if (car) car.remove();
    if (o.fig) art.insertBefore(o.fig, art.firstChild);
    art.classList.toggle('textonly', o.textonly);
    orig.delete(art);
  }
  function carousel(art, ps, l, where) {
    var f = art.querySelector(':scope > figure');
    orig.set(art, { fig: f, textonly: art.classList.contains('textonly') });
    if (f) f.remove();
    art.classList.remove('textonly');
    var fig = document.createElement('figure'); fig.className = 'car';
    fig.innerHTML = '<div class="car-track">' + ps.map(function (p, i) {
        var cap = p[l] || p.en || p.bg || '';
        return '<div class="car-slide"><img data-ph src="' + esc(url(p, 'thumb')) + '" srcset="' + esc(url(p, 'thumb')) + ' 640w, ' + esc(url(p, 'src')) + ' 2000w" sizes="(max-width: 820px) 100vw, 46vw"' +
          ' data-full="' + esc(url(p, 'src')) + '" data-cap="' + esc(cap) + '" alt="' + esc(cap || T[l].alt + where) + '"' + (i ? ' loading="lazy"' : '') + ' decoding="async">' +
          (token ? '<button type="button" class="ph-del" data-del="' + esc(p.src) + '" aria-label="' + T[l].remove + '" title="' + T[l].remove + '">×</button>' : '') + '</div>';
      }).join('') + '</div>' +
      (ps.length > 1 ? '<button type="button" class="car-nav car-prev" aria-label="' + (l === 'bg' ? 'Предишна' : 'Previous') + '">‹</button><button type="button" class="car-nav car-next" aria-label="' + (l === 'bg' ? 'Следваща' : 'Next') + '">›</button>' +
        '<div class="car-dots" aria-hidden="true">' + ps.map(function () { return '<i></i>'; }).join('') + '</div>' : '') +
      '<figcaption></figcaption>';
    art.insertBefore(fig, art.firstChild);
    var track = fig.querySelector('.car-track'), dots = fig.querySelectorAll('.car-dots i'), cap = fig.querySelector('figcaption');
    function at() { return Math.round(track.scrollLeft / Math.max(1, track.clientWidth)); }
    function draw() {
      var i = Math.min(ps.length - 1, Math.max(0, at())), im = track.children[i].querySelector('img');
      dots.forEach(function (d, j) { d.classList.toggle('on', j === i); });
      cap.textContent = (im.getAttribute('data-cap') || where) + (ps.length > 1 ? '  ·  ' + (i + 1) + ' / ' + ps.length : '');
    }
    var raf = 0; track.addEventListener('scroll', function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }, { passive: true });
    fig.querySelectorAll('.car-nav').forEach(function (b) {
      b.addEventListener('click', function () {
        var n = at() + (b.classList.contains('car-next') ? 1 : -1);
        n = (n + ps.length) % ps.length;
        track.scrollTo({ left: n * track.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      });
    });
    draw();
  }

  // ---------- GitHub ----------
  function gh(path, opt) {
    opt = opt || {};
    var h = { Authorization: 'Bearer ' + (opt.token || token), Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    if (opt.body) h['Content-Type'] = 'application/json';
    return fetch(API + path, { method: opt.method || 'GET', headers: h, body: opt.body ? JSON.stringify(opt.body) : undefined, cache: 'no-store' })
      .then(function (r) {
        if (r.ok) return r.status === 204 ? null : r.json();
        return r.json().catch(function () { return {}; }).then(function (j) { var e = new Error(j.message || ('GitHub ' + r.status)); e.status = r.status; throw e; });
      });
  }
  function b64utf8(s) { return decodeURIComponent(escape(atob(s.replace(/\s/g, '')))); }
  function readManifest(ref) {
    return gh('/contents/photos/photos.json?ref=' + ref).then(function (f) { return JSON.parse(b64utf8(f.content)); })
      .catch(function (e) { if (e.status === 404) return []; throw e; });
  }
  // One commit: add blobs, remove paths, rewrite photos.json. Retries once if someone else committed in between.
  async function commit(message, adds, removes, mutate, tries) {
    var ref = await gh('/git/ref/heads/' + BRANCH), base = ref.object.sha;
    var c = await gh('/git/commits/' + base);
    var man = mutate(await readManifest(base));
    var tree = [];
    for (var i = 0; i < adds.length; i++) {
      if (!adds[i].sha) adds[i].sha = (await gh('/git/blobs', { method: 'POST', body: { content: adds[i].b64, encoding: 'base64' } })).sha;
      if (adds[i].progress) adds[i].progress();
      tree.push({ path: adds[i].path, mode: '100644', type: 'blob', sha: adds[i].sha });
    }
    removes.forEach(function (p) { tree.push({ path: p, mode: '100644', type: 'blob', sha: null }); });
    tree.push({ path: 'photos/photos.json', mode: '100644', type: 'blob', content: JSON.stringify(man, null, 1) + '\n' });
    var t = await gh('/git/trees', { method: 'POST', body: { base_tree: c.tree.sha, tree: tree } });
    var nc = await gh('/git/commits', { method: 'POST', body: { message: message, tree: t.sha, parents: [base] } });
    try { await gh('/git/refs/heads/' + BRANCH, { method: 'PATCH', body: { sha: nc.sha } }); }
    catch (e) { if (e.status === 422 && !tries) return commit(message, adds, removes, mutate, 1); throw e; }
    return man;
  }

  // ---------- image processing (in the browser; re-encoding drops all metadata incl. GPS) ----------
  function loadImg(file) {
    return new Promise(function (ok, no) {
      var u = URL.createObjectURL(file), im = new Image();
      im.onload = function () { ok(im); }; im.onerror = function () { URL.revokeObjectURL(u); no(new Error(file.name)); };
      im.src = u;   // browsers apply the photo's rotation when drawing an <img>
    });
  }
  function scaled(im, max, q) {
    var w = im.naturalWidth, h = im.naturalHeight, s = Math.min(1, max / Math.max(w, h));
    var cv = document.createElement('canvas'); cv.width = Math.round(w * s); cv.height = Math.round(h * s);
    var cx = cv.getContext('2d'); cx.imageSmoothingQuality = 'high'; cx.drawImage(im, 0, 0, cv.width, cv.height);
    return new Promise(function (ok) { cv.toBlob(function (b) { ok({ blob: b, w: cv.width, h: cv.height }); }, 'image/jpeg', q); });
  }
  function toB64(blob) { return new Promise(function (ok) { var r = new FileReader(); r.onload = function () { ok(String(r.result).split(',')[1]); }; r.readAsDataURL(blob); }); }
  function stamp(ms) { var d = new Date(ms), z = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + ':' + z(d.getMonth() + 1) + ':' + z(d.getDate()) + ' ' + z(d.getHours()) + ':' + z(d.getMinutes()) + ':' + z(d.getSeconds()); }

  // ---------- dialog ----------
  var dlg = document.createElement('div');
  dlg.className = 'ph-dlg'; dlg.hidden = true; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true');
  document.body.appendChild(dlg);
  function closeDlg() { dlg.hidden = true; dlg.innerHTML = ''; document.body.classList.remove('lb-open'); }
  function openDlg(html) { dlg.innerHTML = '<div class="ph-card">' + html + '</div>'; dlg.hidden = false; document.body.classList.add('lb-open'); }

  function pick(k, art) {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true;
    inp.onchange = function () { if (inp.files.length) prepare(Array.prototype.slice.call(inp.files), k, art); };
    inp.click();
  }
  function prepare(files, k, art) {
    var l = lang, where = title(art), urls = files.map(function (f) { return URL.createObjectURL(f); });
    openDlg('<h3>' + esc(T[l].dlgH(files.length, where)) + '</h3><div class="ph-prev">' + urls.map(function (u) { return '<img src="' + u + '" alt="">'; }).join('') + '</div>' +
      '<label class="ph-lab">' + T[l].cap + '<input type="text" class="ph-cap" maxlength="200"></label>' +
      '<p class="ph-status mono" aria-live="polite"></p><div class="ph-btns"><button type="button" class="ph-cancel">' + T[l].cancel + '</button><button type="button" class="ph-go">' + T[l].upload + '</button></div>');
    var st = dlg.querySelector('.ph-status');
    dlg.querySelector('.ph-cancel').onclick = function () { urls.forEach(URL.revokeObjectURL); closeDlg(); };
    dlg.querySelector('.ph-go').onclick = function () {
      var cap = dlg.querySelector('.ph-cap').value.trim();
      dlg.querySelectorAll('button, input').forEach(function (b) { b.disabled = true; });
      upload(files, k, dayOf(art), cap, st).then(function (n) {
        st.textContent = T[l].done(n);
        setTimeout(function () { urls.forEach(URL.revokeObjectURL); closeDlg(); }, 1800);
      }).catch(function (e) {
        st.textContent = T[l].fail + e.message;
        dlg.querySelector('.ph-cancel').disabled = false;
      });
    };
  }
  async function upload(files, k, day, cap, st) {
    var l = lang; st.textContent = T[l].preparing;
    var adds = [], items = [], bad = [];
    for (var i = 0; i < files.length; i++) {
      var im;
      try { im = await loadImg(files[i]); } catch (e) { bad.push(files[i].name); continue; }
      var full = await scaled(im, FULL_PX, 0.8), th = await scaled(im, THUMB_PX, 0.72);
      URL.revokeObjectURL(im.src);
      var name = 's-' + k + '-' + stamp(files[i].lastModified || Date.now()).replace(/\D/g, '') + '-' + Math.random().toString(36).slice(2, 6) + '.jpg';
      var item = { src: 'photos/full/' + name, thumb: 'photos/thumb/' + name, day: day, stop: k, w: full.w, h: full.h, taken: stamp(files[i].lastModified || Date.now()), en: cap, bg: cap };
      local[item.src] = URL.createObjectURL(full.blob); local[item.thumb] = URL.createObjectURL(th.blob);
      items.push(item);
      adds.push({ path: item.src, b64: await toB64(full.blob) }, { path: item.thumb, b64: await toB64(th.blob) });
    }
    if (bad.length) st.textContent = T[l].cant + bad.join(', ');
    if (!items.length) throw new Error(T[l].cant + bad.join(', '));
    var done = 0;
    adds.forEach(function (a) { a.progress = function () { done++; st.textContent = done < adds.length ? T[l].sending(Math.ceil(done / 2), items.length) : T[l].saving; }; });
    st.textContent = T[l].sending(1, items.length);
    data = await commit('Add ' + items.length + ' photo(s) to ' + k + ' (Day ' + day + ')', adds, [], function (m) { return m.concat(items); });
    render();
    return items.length;
  }
  function remove(src) {
    var l = lang;
    if (!confirm(T[l].del)) return;
    var p = data.filter(function (x) { return x.src === src; })[0]; if (!p) return;
    commit('Remove photo ' + src.split('/').pop(), [], [p.src, p.thumb], function (m) { return m.filter(function (x) { return x.src !== src; }); })
      .then(function (m) { data = m; render(); toast(T[l].deleted); })
      .catch(function (e) { alert(T[l].fail + e.message); });
  }
  function toast(t) { var d = document.createElement('div'); d.className = 'ph-toast'; d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 2600); }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-add]');
    if (a) {
      e.preventDefault();
      if (!token) { var t = bar.querySelector('.ph-tok'); bar.scrollIntoView({ block: 'center' }); bar.classList.add('ph-flash'); setTimeout(function () { bar.classList.remove('ph-flash'); }, 1200); if (t) t.focus({ preventScroll: true }); return; }
      pick(a.getAttribute('data-add'), a.closest('article')); return;
    }
    var d = e.target.closest('[data-del]');
    if (d) { e.preventDefault(); e.stopPropagation(); remove(d.getAttribute('data-del')); }
  }, true);
  dlg.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !dlg.querySelector('.ph-go[disabled]')) closeDlg(); });

  // ---------- upload mode bar / setup ----------
  var bar = document.createElement('div'); bar.className = 'wrap ph-bar'; bar.hidden = true;
  var langbar = document.querySelector('.langbar'); langbar.parentNode.insertBefore(bar, langbar.nextSibling);
  function drawBar() {
    var l = lang;
    if (token) {
      bar.hidden = false;
      bar.innerHTML = '<span>' + T[l].mode + '</span><button type="button" class="ph-off">' + T[l].exit + '</button>';
      bar.querySelector('.ph-off').onclick = function () { store('gh-photo-token', null); token = null; drawBar(); render(); };
    } else if (wantSetup) {
      bar.hidden = false;
      bar.innerHTML = '<b>' + T[l].setupH + '</b><span>' + T[l].setupP + ' <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">' + T[l].create + '</a></span>' +
        '<span class="ph-row"><input type="password" class="ph-tok" autocomplete="off" placeholder="github_pat_…" aria-label="GitHub token"><button type="button" class="ph-save">' + T[l].save + '</button></span><span class="ph-msg mono" aria-live="polite"></span>';
      bar.querySelector('.ph-save').onclick = function () {
        var t = bar.querySelector('.ph-tok').value.trim(), msg = bar.querySelector('.ph-msg'); if (!t) return;
        msg.textContent = T[l].checking;
        gh('', { token: t }).then(function (r) {
          if (r.permissions && r.permissions.push === false) throw new Error();
          store('gh-photo-token', t); token = t; wantSetup = false;
          history.replaceState(null, '', location.pathname + location.hash);
          drawBar(); render();
        }).catch(function () { msg.textContent = T[l].bad; });
      };
    } else { bar.hidden = true; bar.innerHTML = ''; }
  }

  document.addEventListener('langchange', function (e) { lang = e.detail; drawBar(); });
  drawBar();

  // Visitors read the copy on GitHub Pages; in upload mode read the repo directly so new uploads show at once.
  var load = token ? readManifest(BRANCH) : fetch('photos/photos.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : []; });
  load.catch(function () { return fetch('photos/photos.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : []; }); })
    .then(function (all) { data = Array.isArray(all) ? all : []; render(); })
    .catch(function () { render(); });
})();
