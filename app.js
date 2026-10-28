// Today banner, photo viewer and offline support.
(function () {
  var lang = 'en';

  // ---------- today ----------
  var START = Date.UTC(2026, 9, 31);
  var DAYS = {
    1: { en: 'Marrakech → Ouarzazate', bg: 'Маракеш → Уарзазат', rise: '07:50', set: '18:41', nen: 'Ouarzazate', nbg: 'Уарзазат' },
    2: { en: 'Ouarzazate → Merzouga', bg: 'Уарзазат → Мерзуга', rise: '07:42', set: '18:28', nen: 'desert camp', nbg: 'пустинен лагер' },
    3: { en: '4×4 around Merzouga', bg: '4×4 около Мерзуга', rise: '07:32', set: '18:28', nen: 'Merzouga', nbg: 'Мерзуга' },
    4: { en: 'Merzouga → Fes', bg: 'Мерзуга → Фес', rise: '07:32', set: '18:27', nen: 'Fes', nbg: 'Фес' },
    5: { en: 'Guided tour of Fes', bg: 'Обиколка на Фес', rise: '07:42', set: '18:26', nen: 'Fes', nbg: 'Фес' },
    6: { en: 'Fes → Rabat → Casablanca → Marrakech', bg: 'Фес → Рабат → Казабланка → Маракеш', rise: '07:42', set: '18:41', nen: 'Marrakech', nbg: 'Маракеш' },
    7: { en: 'Guided tour of Marrakech', bg: 'Обиколка на Маракеш', rise: '07:52', set: '18:40', nen: 'Marrakech', nbg: 'Маракеш' },
    8: { en: 'Flight home', bg: 'Полет към дома', rise: '07:53', set: '18:39', nen: '', nbg: '' }
  };
  var TT = {
    en: { today: 'Today', of: 'of', day: 'Day', rise: 'Sunrise', set: 'Sunset', night: 'Night', open: 'Open today', soon: function (n) { return n === 1 ? 'Morocco starts tomorrow' : 'Morocco starts in ' + n + ' days'; }, first: 'See Day 1' },
    bg: { today: 'Днес', of: 'от', day: 'Ден', rise: 'Изгрев', set: 'Залез', night: 'Нощувка', open: 'Към днешния ден', soon: function (n) { return n === 1 ? 'Мароко започва утре' : 'Мароко започва след ' + n + ' дни'; }, first: 'Виж ден 1' }
  };

  function moroccoDate() {
    var q = /[?&]day=(\d)/.exec(location.search);   // ?day=3 to preview
    if (q) return START + (q[1] - 1) * 864e5;
    try {
      var p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Casablanca', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).split('-');
      return Date.UTC(+p[0], p[1] - 1, +p[2]);
    } catch (e) { var d = new Date(); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); }
  }
  var dayNo = Math.round((moroccoDate() - START) / 864e5) + 1;

  var banner = document.createElement('div');
  banner.className = 'today wrap'; banner.hidden = true;
  var langbar = document.querySelector('.langbar');
  langbar.parentNode.insertBefore(banner, langbar.nextSibling);

  function drawToday() {
    var t = TT[lang], pre = lang === 'bg' ? '#bg-' : '#';
    document.querySelectorAll('.daynav a.is-today').forEach(function (a) { a.classList.remove('is-today'); });
    if (dayNo >= 1 && dayNo <= 8) {
      var d = DAYS[dayNo];
      banner.innerHTML =
        '<div class="today-k">' + t.today + ' · ' + t.day + ' ' + dayNo + ' ' + t.of + ' 8</div>' +
        '<div class="today-t">' + d[lang] + '</div>' +
        '<div class="today-m">' +
          '<span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18h16M7 18a5 5 0 0 1 10 0M12 6v3M5.6 9.6l1.8 1.8M18.4 9.6l-1.8 1.8" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>' + t.rise + ' ' + d.rise + '</span>' +
          '<span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18h16M7 18a5 5 0 0 1 10 0M12 13V8M9.5 10.5 12 13l2.5-2.5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' + t.set + ' ' + d.set + '</span>' +
          (d.nen ? '<span>' + t.night + ': ' + (lang === 'bg' ? d.nbg : d.nen) + '</span>' : '') +
        '</div>' +
        '<a class="today-go" href="' + pre + 'day-' + dayNo + '">' + t.open + ' →</a>';
      banner.hidden = false;
      var a = document.querySelector('[data-l="' + lang + '"] .daynav a[href="' + pre + 'day-' + dayNo + '"]');
      if (a) a.classList.add('is-today');
    } else if (dayNo < 1 && dayNo > -14) {
      banner.innerHTML = '<div class="today-t">' + t.soon(1 - dayNo) + '</div><a class="today-go" href="' + pre + 'day-1">' + t.first + ' →</a>';
      banner.hidden = false;
    } else banner.hidden = true;
  }

  var jumped = false;
  function jumpToToday() {
    if (jumped) return; jumped = true;
    if (location.hash || dayNo < 1 || dayNo > 8) return;
    var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (nav && nav.type === 'reload') return;
    var key = 'jumped-' + dayNo;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch (e) {}
    var sec = document.getElementById((lang === 'bg' ? 'bg-' : '') + 'day-' + dayNo);
    if (sec) setTimeout(function () { sec.scrollIntoView(); }, 50);
  }

  // ---------- photo viewer ----------
  var lb = document.createElement('div');
  lb.className = 'lb'; lb.hidden = true;
  lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
  lb.innerHTML =
    '<button type="button" class="lb-x" data-lb="close" aria-label="Close">×</button>' +
    '<button type="button" class="lb-nav lb-prev" data-lb="prev" aria-label="Previous">‹</button>' +
    '<figure><img alt=""><figcaption><span class="lb-cap"></span><span class="lb-n"></span></figcaption></figure>' +
    '<button type="button" class="lb-nav lb-next" data-lb="next" aria-label="Next">›</button>';
  document.body.appendChild(lb);
  var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('.lb-cap'), lbN = lb.querySelector('.lb-n');
  var list = [], idx = 0, lastFocus = null;

  function collect() {
    list = Array.prototype.slice.call(document.querySelectorAll('[data-l="' + lang + '"] .stop figure img, [data-l="' + lang + '"] .hero figure img'));
    list.forEach(function (im) { im.classList.add('zoomable'); im.tabIndex = 0; im.setAttribute('role', 'button'); });
  }
  function show(i) {
    idx = (i + list.length) % list.length;
    var im = list[idx], fig = im.closest('figure'), day = im.closest('.day');
    lbImg.src = im.src; lbImg.alt = im.alt;
    var lbl = day ? day.querySelector('.dayhead .label').textContent + ' · ' : '';
    lbCap.textContent = lbl + (fig.querySelector('figcaption') || {}).textContent;
    lbN.textContent = (idx + 1) + ' / ' + list.length;
    [idx - 1, idx + 1].forEach(function (j) { var n = list[(j + list.length) % list.length]; if (n) (new Image()).src = n.src; });
  }
  function open(i) {
    lastFocus = document.activeElement;
    lb.hidden = false; document.body.classList.add('lb-open');
    show(i); lb.querySelector('.lb-x').focus();
  }
  function close() {
    lb.hidden = true; document.body.classList.remove('lb-open');
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener('click', function (e) {
    var im = e.target.closest('img.zoomable');
    if (im) { open(list.indexOf(im)); return; }
    var b = e.target.closest('[data-lb]');
    if (b) { var a = b.getAttribute('data-lb'); a === 'close' ? close() : show(idx + (a === 'next' ? 1 : -1)); return; }
    if (!lb.hidden && e.target === lb) close();
  });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('zoomable')) { e.preventDefault(); open(list.indexOf(e.target)); }
      return;
    }
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') show(idx + 1);
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'Tab') {   // keep focus inside
      var f = lb.querySelectorAll('button'), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  var x0 = null, y0 = null;
  lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(idx + (dx < 0 ? 1 : -1));
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close();
  });

  // ---------- offline ----------
  var chip = document.createElement('span');
  chip.className = 'offline-chip'; chip.hidden = true;
  langbar.insertBefore(chip, langbar.firstChild);
  function drawChip() { chip.textContent = lang === 'bg' ? '✓ Работи и офлайн' : '✓ Works offline'; }
  if ('serviceWorker' in navigator && window.isSecureContext) {
    // When a newer version of the site takes over, reload once so it shows right away.
    var hadController = !!navigator.serviceWorker.controller, reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!hadController || reloaded) return; reloaded = true; location.reload();
    });
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function () { return navigator.serviceWorker.ready; })
      .then(function () { chip.hidden = false; }).catch(function () {});
    navigator.serviceWorker.addEventListener('message', function (e) {
      if (e.data === 'precached') chip.hidden = false;
    });
  }

  document.addEventListener('langchange', function (e) {
    lang = e.detail;
    var lbl = lang === 'bg' ? ['Затвори', 'Предишна', 'Следваща'] : ['Close', 'Previous', 'Next'];
    lb.querySelector('.lb-x').setAttribute('aria-label', lbl[0]);
    lb.querySelector('.lb-prev').setAttribute('aria-label', lbl[1]);
    lb.querySelector('.lb-next').setAttribute('aria-label', lbl[2]);
    drawToday(); drawChip(); collect(); jumpToToday();
  });
})();
