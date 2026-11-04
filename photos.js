// My photos: galleries under each location and each day, and (in upload mode) "+ Add photos" buttons.
// Photos live in the repo (photos/full, photos/thumb) and are listed in photos/photos.json.
// Uploading commits straight to GitHub with a token kept only in this browser; visitors never see the buttons.
(function () {
  var OWNER = 'yavor-mishev', REPO = 'morocco-2026', BRANCH = 'main';
  var API = 'https://api.github.com/repos/' + OWNER + '/' + REPO;
  var RAW = 'https://raw.githubusercontent.com/' + OWNER + '/' + REPO + '/' + BRANCH + '/';
  var FULL_PX = 1600, THUMB_PX = 640, POSTER_PX = 1280, PARALLEL = 3, CHUNK = 10, PREVIEWS = 6, MAX_VIDEO_MB = 40;

  var T = {
    en: {
      day: 'My photos', add: 'Add photos & videos', one: 'photo', many: 'photos', alt: 'My photo: ',
      mode: 'Photo uploads are on for this device. Every location has an “Add photos” button.', exit: 'Turn off',
      setupH: 'Turn on photo uploads', setupP: 'Paste a GitHub fine-grained token with access to only the morocco-2026 repository and “Contents: Read and write”. It is saved only in this browser.',
      save: 'Save', cancel: 'Cancel', create: 'Create a token', checking: 'Checking…', bad: 'That token can’t write to the repository.',
      dlgH: function (n, where) { return n + ' ' + (n === 1 ? 'file' : 'files') + ' for ' + where; },
      vid: function (i, n, mb) { return 'Uploading ' + i + ' of ' + n + ' (video, ' + mb + ' MB)…'; }, big: function (mb) { return 'Too large (max ' + mb + ' MB), trim it first: '; }, badv: 'Can’t read this video here (on iPhone, Settings → Camera → Formats → Most Compatible helps): ',
      cap: 'Caption (optional)', upload: 'Upload', preparing: 'Preparing photos…',
      sending: function (i, n) { return 'Uploading ' + i + ' of ' + n + '…'; }, saving: 'Saving…', wait: function (s) { return 'GitHub asked us to slow down. Retrying in ' + s + ' s…'; }, more: function (n) { return '+' + n + ' more'; },
      done: function (n) { return n + (n === 1 ? ' file' : ' files') + ' uploaded. Everyone will see ' + (n === 1 ? 'it' : 'them') + ' in about a minute.'; },
      cant: 'Couldn’t read this file (try JPEG): ', fail: 'Upload failed: ', del: 'Delete this photo from the site?', deleted: 'Photo removed.', remove: 'Delete photo'
    },
    bg: {
      day: 'Моите снимки', add: 'Добави снимки и видео', one: 'снимка', many: 'снимки', alt: 'Моя снимка: ',
      mode: 'Качването на снимки е включено на това устройство. Всяко място има бутон „Добави снимки“.', exit: 'Изключи',
      setupH: 'Включи качването на снимки', setupP: 'Постави GitHub fine-grained токен с достъп само до хранилището morocco-2026 и „Contents: Read and write“. Пази се само в този браузър.',
      save: 'Запази', cancel: 'Отказ', create: 'Създай токен', checking: 'Проверка…', bad: 'Този токен не може да пише в хранилището.',
      dlgH: function (n, where) { return n + ' ' + (n === 1 ? 'файл' : 'файла') + ' за ' + where; },
      vid: function (i, n, mb) { return 'Качване ' + i + ' от ' + n + ' (видео, ' + mb + ' MB)…'; }, big: function (mb) { return 'Твърде голямо (макс. ' + mb + ' MB), първо го скъси: '; }, badv: 'Не мога да прочета това видео тук (на iPhone помага Настройки → Камера → Формати → Най-съвместим): ',
      cap: 'Надпис (по желание)', upload: 'Качи', preparing: 'Подготвям снимките…',
      sending: function (i, n) { return 'Качване ' + i + ' от ' + n + '…'; }, saving: 'Записване…', wait: function (s) { return 'GitHub поиска да забавим. Нов опит след ' + s + ' с…'; }, more: function (n) { return '+ още ' + n; },
      done: function (n) { return n + ' ' + (n === 1 ? 'файл е качен' : 'файла са качени') + '. Всички ще ги видят след около минута.'; },
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
    var nav = l === 'bg' ? ['Предишна', 'Следваща'] : ['Previous', 'Next'];
    fig.innerHTML = '<div class="car-stage"><div class="car-track">' + ps.map(function (p, i) {
        var cap = p[l] || p.en || p.bg || '';
        if (p.type === 'video') return '<div class="car-slide"><video src="' + esc(url(p, 'src')) + '" poster="' + esc(url(p, 'thumb')) + '" controls playsinline preload="none"' +
          ' width="' + p.w + '" height="' + p.h + '" style="aspect-ratio:' + p.w + ' / ' + p.h + '" data-cap="' + esc(cap) + '" aria-label="' + esc(cap || where) + '"></video>' +
          (token ? '<button type="button" class="ph-del" data-del="' + esc(p.src) + '" aria-label="' + T[l].remove + '" title="' + T[l].remove + '">×</button>' : '') + '</div>';
        return '<div class="car-slide"><img data-ph src="' + esc(url(p, 'thumb')) + '" srcset="' + esc(url(p, 'thumb')) + ' ' + Math.round(THUMB_PX * Math.min(1, p.w / p.h)) + 'w, ' + esc(url(p, 'src')) + ' ' + p.w + 'w" sizes="(max-width: 820px) 100vw, 46vw"' +
          ' width="' + p.w + '" height="' + p.h + '" style="aspect-ratio:' + p.w + ' / ' + p.h + '"' +
          ' data-full="' + esc(url(p, 'src')) + '" data-cap="' + esc(cap) + '" alt="' + esc(cap || T[l].alt + where) + '"' + (i ? ' loading="lazy"' : '') + ' decoding="async">' +
          (token ? '<button type="button" class="ph-del" data-del="' + esc(p.src) + '" aria-label="' + T[l].remove + '" title="' + T[l].remove + '">×</button>' : '') + '</div>';
      }).join('') + '</div>' +
      (ps.length > 1 ? '<button type="button" class="car-nav car-prev" aria-label="' + nav[0] + '">‹</button><button type="button" class="car-nav car-next" aria-label="' + nav[1] + '">›</button>' : '') + '</div>' +
      (ps.length > 1 && ps.length <= 15 ? '<div class="car-dots" aria-hidden="true">' + ps.map(function () { return '<i></i>'; }).join('') + '</div>' : '') +
      '<figcaption></figcaption>';
    art.insertBefore(fig, art.firstChild);
    var track = fig.querySelector('.car-track'), dots = fig.querySelectorAll('.car-dots i'), cap = fig.querySelector('figcaption');
    function at() { return Math.round(track.scrollLeft / Math.max(1, track.clientWidth)); }
    // Size every photo from its known width/height, so nothing depends on the image having loaded yet.
    var hs = [];
    function layout() {
      var W = track.clientWidth, maxH = Math.min(window.innerHeight * 0.75, 760);
      if (!W) return;
      hs = ps.map(function (p, i) {
        var h = Math.min(W * p.h / p.w, maxH), w = h * p.w / p.h, im = track.children[i].querySelector('img, video');
        im.style.width = Math.round(w) + 'px'; im.style.height = Math.round(h) + 'px';
        return Math.round(h);
      });
      fit();
    }
    function fit() { if (hs.length) track.style.height = Math.max.apply(null, hs) + 'px'; }   // fixed: room for the tallest photo
    function draw() {
      var i = Math.min(ps.length - 1, Math.max(0, at())), im = track.children[i].querySelector('img, video');
      fit();
      track.querySelectorAll('video').forEach(function (v) { if (v.parentNode !== track.children[i] && !v.paused) v.pause(); });
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
    var lastW = 0;
    if (window.ResizeObserver) new ResizeObserver(function () { if (track.clientWidth !== lastW) { lastW = track.clientWidth; layout(); } }).observe(track);
    else window.addEventListener('resize', layout);
    layout();
    draw();
  }

  // ---------- GitHub ----------
  var onWait = null;   // set during an upload to show "retrying in N s"
  function sleep(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
  function gh(path, opt, attempt) {
    attempt = attempt || 0;
    return gh1(path, opt).catch(function (e) {
      var limited = e.status === 429 || (e.status === 403 && /rate limit|abuse/i.test(e.message)), flaky = !e.status || e.status >= 500;
      if ((!limited && !flaky) || attempt >= 5) throw e;
      var s = e.retry || (limited ? 20 * (attempt + 1) : 3 * (attempt + 1));
      if (onWait && limited) onWait(s);
      return sleep(s * 1000).then(function () { return gh(path, opt, attempt + 1); });
    });
  }
  function gh1(path, opt) {
    opt = opt || {};
    var h = { Authorization: 'Bearer ' + (opt.token || token), Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    if (opt.body) h['Content-Type'] = 'application/json';
    return fetch(API + path, { method: opt.method || 'GET', headers: h, body: opt.body ? JSON.stringify(opt.body) : undefined, cache: 'no-store' })
      .then(function (r) {
        if (r.ok) return r.status === 204 ? null : r.json();
        var ra = +r.headers.get('retry-after') || 0;
        return r.json().catch(function () { return {}; }).then(function (j) { var e = new Error(j.message || ('GitHub ' + r.status)); e.status = r.status; e.retry = ra; throw e; });
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
    var W = cv.width, H = cv.height;
    return new Promise(function (ok, no) {
      cv.toBlob(function (b) {
        cv.width = cv.height = 0;   // release canvas memory right away (iOS Safari has a hard total limit)
        b ? ok({ blob: b, w: W, h: H }) : no(new Error('out of memory'));
      }, 'image/jpeg', q);
    });
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
    var old = document.getElementById('ph-input'); if (old) old.remove();
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*,video/*'; inp.multiple = true; inp.id = 'ph-input';
    inp.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none';   // in the page but invisible (display:none breaks the picker in some WebKit builds)
    document.body.appendChild(inp);   // iOS Safari is more reliable with an input that is in the page
    inp.onchange = function () { var f = Array.prototype.slice.call(inp.files || []); inp.remove(); if (f.length) prepare(f, k, art); };
    inp.click();
  }
  function prepare(files, k, art) {
    var l = lang, where = title(art), urls = files.slice(0, PREVIEWS).map(function (f) { return URL.createObjectURL(f); });
    openDlg('<h3>' + esc(T[l].dlgH(files.length, where)) + '</h3><div class="ph-prev">' + urls.map(function (u, i) { return isVideo(files[i]) ? '<video src="' + u + '#t=0.1" muted playsinline preload="metadata"></video>' : '<img src="' + u + '" alt="" decoding="async">'; }).join('') +
      (files.length > PREVIEWS ? '<span class="ph-more">' + T[l].more(files.length - PREVIEWS) + '</span>' : '') + '</div>' +
      '<label class="ph-lab">' + T[l].cap + '<input type="text" class="ph-cap" maxlength="200"></label>' +
      '<p class="ph-status mono" aria-live="polite"></p><div class="ph-btns"><button type="button" class="ph-cancel">' + T[l].cancel + '</button><button type="button" class="ph-go">' + T[l].upload + '</button></div>');
    var st = dlg.querySelector('.ph-status');
    dlg.querySelector('.ph-cancel').onclick = function () { urls.forEach(URL.revokeObjectURL); closeDlg(); };
    dlg.querySelector('.ph-go').onclick = function () {
      var cap = dlg.querySelector('.ph-cap').value.trim();
      dlg.querySelectorAll('button, input').forEach(function (b) { b.disabled = true; });
      dlg.querySelectorAll('.ph-prev img, .ph-prev video').forEach(function (im) { im.removeAttribute('src'); if (im.load) im.load(); });   // free the big previews before processing
      urls.forEach(URL.revokeObjectURL); urls = [];
      upload(files, k, dayOf(art), cap, st).then(function (n) {
        var warn = st.textContent && !/…$/.test(st.textContent) ? st.textContent : '';
        st.textContent = T[l].done(n) + (warn ? ' ' + warn : '');
        if (warn) { var cb = dlg.querySelector('.ph-cancel'); cb.disabled = false; cb.textContent = 'OK'; cb.onclick = closeDlg; return; }
        setTimeout(function () { urls.forEach(URL.revokeObjectURL); closeDlg(); }, 1800);
      }).catch(function (e) {
        st.textContent = T[l].fail + e.message;
        dlg.querySelector('.ph-cancel').disabled = false;
      });
    };
  }
  function limiter(n) {
    var act = 0, q = [];
    function next() {
      if (act >= n || !q.length) return;
      act++; var t = q.shift();
      t.fn().then(t.ok, t.no).then(function () { act--; next(); });
    }
    return function (fn) { return new Promise(function (ok, no) { q.push({ fn: fn, ok: ok, no: no }); next(); }); };
  }
  // ---------- video ----------
  function isVideo(f) { return /^video\//.test(f.type) || /\.(mov|mp4|m4v)$/i.test(f.name); }
  // Blank out GPS location in MP4/MOV metadata in place (same byte length, so the file stays valid).
  function stripLocation(buf) {
    var u = new Uint8Array(buf), dv = new DataView(buf), pos = 0, n = u.length;
    while (pos + 8 <= n) {
      var size = dv.getUint32(pos), type = String.fromCharCode(u[pos + 4], u[pos + 5], u[pos + 6], u[pos + 7]), hdr = 8;
      if (size === 1) { size = dv.getUint32(pos + 8) * 4294967296 + dv.getUint32(pos + 12); hdr = 16; }
      else if (size === 0) size = n - pos;
      if (size < hdr) break;
      if (type === 'moov') {
        var end = Math.min(n, pos + size), str = '';
        for (var i = pos; i < end; i += 65536) str += String.fromCharCode.apply(null, u.subarray(i, Math.min(end, i + 65536)));
        // ©xyz boxes (QuickTime/Android location) become 'free' boxes that players skip
        var j = -1; while ((j = str.indexOf('©xyz', j + 1)) !== -1) { var o = pos + j; u[o] = 0x66; u[o + 1] = 0x72; u[o + 2] = 0x65; u[o + 3] = 0x65; }
        // ISO 6709 coordinates anywhere in the metadata (Apple keys) -> digits zeroed
        var re = /[+-]\d{1,3}\.\d+[+-]\d{1,3}\.\d+(?:[+-]\d+(?:\.\d+)?)?/g, m;
        while ((m = re.exec(str))) for (var c = 0; c < m[0].length; c++) if (/\d/.test(m[0][c])) u[pos + m.index + c] = 0x30;
      }
      pos += size;
    }
    return buf;
  }
  // Read size and a cover frame from the video (also proves this browser can play it).
  function videoInfo(blob) {
    return new Promise(function (ok, no) {
      var v = document.createElement('video'), u = URL.createObjectURL(blob), done = false;
      function fin(err, val) { if (done) return; done = true; clearTimeout(tm); v.removeAttribute('src'); v.load(); URL.revokeObjectURL(u); err ? no(err) : ok(val); }
      var tm = setTimeout(function () { fin(new Error('timeout')); }, 15000);
      v.muted = true; v.playsInline = true; v.preload = 'auto';
      v.onerror = function () { fin(new Error('decode')); };
      v.onloadeddata = function () { v.currentTime = Math.min(0.5, (v.duration || 1) / 2); };
      v.onseeked = function () {
        var w = v.videoWidth, h = v.videoHeight; if (!w || !h) return fin(new Error('size'));
        var s = Math.min(1, POSTER_PX / Math.max(w, h)), cv = document.createElement('canvas');
        cv.width = Math.round(w * s); cv.height = Math.round(h * s);
        cv.getContext('2d').drawImage(v, 0, 0, cv.width, cv.height);
        cv.toBlob(function (b) { cv.width = cv.height = 0; b ? fin(null, { w: w, h: h, dur: Math.round(v.duration || 0), poster: b }) : fin(new Error('poster')); }, 'image/jpeg', 0.8);
      };
      v.src = u;
    });
  }

  async function upload(files, k, day, cap, st) {
    var l = lang, bad = [], ok = 0;
    onWait = function (sec) { st.textContent = T[l].wait(sec); };
    try {
      for (var c = 0; c < files.length; c += CHUNK) {
        var part = files.slice(c, c + CHUNK), adds = [], items = [], sent = [], run = limiter(PARALLEL);
        for (var i = 0; i < part.length; i++) {
          st.textContent = T[l].sending(c + i + 1, files.length);
          if (isVideo(part[i])) {
            var f = part[i], mb = Math.round(f.size / 1048576);
            if (f.size > MAX_VIDEO_MB * 1048576) { bad.push(T[l].big(MAX_VIDEO_MB) + f.name + ' (' + mb + ' MB)'); continue; }
            var vb, info;
            try { vb = new Blob([stripLocation(await f.arrayBuffer())], { type: 'video/mp4' }); info = await videoInfo(vb); }
            catch (e) { bad.push(T[l].badv + f.name); continue; }
            var vwhen = f.lastModified || Date.now(), vname = 's-' + k + '-' + stamp(vwhen).replace(/\D/g, '') + '-' + Math.random().toString(36).slice(2, 6);
            var vitem = { type: 'video', src: 'photos/video/' + vname + '.mp4', thumb: 'photos/thumb/' + vname + '.jpg', day: day, stop: k, w: info.w, h: info.h, dur: info.dur, taken: stamp(vwhen), en: cap, bg: cap };
            local[vitem.src] = URL.createObjectURL(vb); local[vitem.thumb] = URL.createObjectURL(info.poster);
            var va = { path: vitem.src, b64: await toB64(vb) }, pa = { path: vitem.thumb, b64: await toB64(info.poster) };
            vb = null;
            st.textContent = T[l].vid(c + i + 1, files.length, mb);
            await Promise.all([va, pa].map(function (a) { return run(function () { return gh('/git/blobs', { method: 'POST', body: { content: a.b64, encoding: 'base64' } }).then(function (r) { a.sha = r.sha; a.b64 = null; }); }); }));
            items.push(vitem); adds.push(va, pa);
            continue;
          }
          var im, full, th;
          try {
            im = await loadImg(part[i]);
            full = await scaled(im, FULL_PX, 0.8); th = await scaled(im, THUMB_PX, 0.72);
          } catch (e) { bad.push(part[i].name); continue; }
          finally { if (im) { URL.revokeObjectURL(im.src); im.removeAttribute('src'); } }
          var when = part[i].lastModified || Date.now();
          var name = 's-' + k + '-' + stamp(when).replace(/\D/g, '') + '-' + Math.random().toString(36).slice(2, 6) + '.jpg';
          var item = { src: 'photos/full/' + name, thumb: 'photos/thumb/' + name, day: day, stop: k, w: full.w, h: full.h, taken: stamp(when), en: cap, bg: cap };
          local[item.thumb] = URL.createObjectURL(th.blob);   // shown until GitHub Pages has the file; full size loads from the repo
          var a1 = { path: item.src, b64: await toB64(full.blob) }, a2 = { path: item.thumb, b64: await toB64(th.blob) };
          full = th = null;
          items.push(item); adds.push(a1, a2);
          [a1, a2].forEach(function (a) {
            sent.push(run(function () { return gh('/git/blobs', { method: 'POST', body: { content: a.b64, encoding: 'base64' } }).then(function (r) { a.sha = r.sha; a.b64 = null; }); }));
          });
        }
        if (!items.length) continue;
        await Promise.all(sent);
        st.textContent = T[l].saving;
        data = await commit('Add ' + items.length + ' photo(s) to ' + k + ' (Day ' + day + ')', adds, [], function (m) { return m.concat(items); });
        ok += items.length;
        render();
      }
    } finally { onWait = null; }
    function badMsg() { return bad.map(function (b) { return /:/.test(b) ? b : T[l].cant + b; }).join(' · '); }
    if (!ok) throw new Error(badMsg());
    if (bad.length) { st.textContent = badMsg(); return ok; }
    return ok;
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
