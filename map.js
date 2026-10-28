// Interactive route map. Replaces the static SVG in the visible language block.
(function () {
  if (!window.L) return;

  var DAY_COLORS = { 1: '#0d6b5e', 2: '#b97a10', 3: '#c2571f', 4: '#2c3a8a', 5: '#7a3e8e', 6: '#b5523b', 7: '#1f7a8c', 8: '#6c5f6c' };

  // Road geometry from OSRM (OpenStreetMap), [lat, lon]. Day 3 is off-road, drawn straight.
  var ROUTES = {"1":{"km":204,"h":4.1,"c":[[31.6029,-8.0377],[31.5957,-8.0272],[31.6148,-7.9955],[31.6106,-7.9894],[31.6143,-7.9751],[31.6226,-7.9707],[31.5781,-7.8634],[31.576,-7.8137],[31.5819,-7.7946],[31.5601,-7.6924],[31.5519,-7.6646],[31.5428,-7.6518],[31.5485,-7.6382],[31.543,-7.6213],[31.5522,-7.5875],[31.5456,-7.5717],[31.5477,-7.5635],[31.5338,-7.4877],[31.5234,-7.4734],[31.5114,-7.472],[31.4966,-7.4623],[31.4932,-7.4527],[31.484,-7.4512],[31.4897,-7.4382],[31.4858,-7.4319],[31.4737,-7.4333],[31.4704,-7.3984],[31.461,-7.4072],[31.4492,-7.3942],[31.4323,-7.4112],[31.4258,-7.4111],[31.4179,-7.4059],[31.4124,-7.3911],[31.3963,-7.3983],[31.389,-7.4095],[31.3746,-7.4124],[31.3693,-7.388],[31.367,-7.3923],[31.3425,-7.3933],[31.3326,-7.3792],[31.3261,-7.3793],[31.3314,-7.3839],[31.3215,-7.3805],[31.3239,-7.3762],[31.3164,-7.3792],[31.3123,-7.3703],[31.2991,-7.3715],[31.2865,-7.3817],[31.2764,-7.3759],[31.2623,-7.3846],[31.2588,-7.3984],[31.2708,-7.4131],[31.2529,-7.41],[31.2337,-7.4152],[31.2289,-7.426],[31.2009,-7.4406],[31.1937,-7.4551],[31.173,-7.466],[31.1589,-7.4636],[31.1453,-7.4251],[31.1403,-7.3889],[31.1255,-7.353],[31.1264,-7.3259],[31.1136,-7.3165],[31.1089,-7.3047],[31.0948,-7.3015],[31.0847,-7.2909],[31.0796,-7.2669],[31.0589,-7.2487],[31.0475,-7.2287],[31.0385,-7.197],[31.0283,-7.1904],[31.0226,-7.1765],[31.022,-7.1661],[31.0503,-7.1509],[31.0531,-7.142],[31.0467,-7.1323],[31.0117,-7.1023],[30.9973,-7.1071],[30.9748,-7.1045],[30.9757,-7.0945],[30.9707,-7.092],[30.968,-7.0788],[30.9763,-7.0653],[30.9483,-7.0351],[30.9357,-6.9598],[30.9376,-6.9416],[30.9334,-6.9368]]},"2":{"km":397,"h":7.6,"c":[[30.9334,-6.9368],[30.9267,-6.8898],[30.97,-6.8376],[30.9743,-6.7271],[31.0127,-6.5991],[31.0576,-6.5559],[31.1128,-6.4147],[31.108,-6.377],[31.1899,-6.2239],[31.1985,-6.1592],[31.24,-6.13],[31.2594,-6.0707],[31.3691,-5.988],[31.3463,-5.9966],[31.3725,-5.9864],[31.3715,-5.781],[31.4647,-5.5858],[31.5248,-5.5292],[31.5464,-5.5887],[31.5859,-5.5908],[31.5464,-5.5887],[31.52,-5.5301],[31.5313,-5.5194],[31.4561,-5.3683],[31.4462,-5.301],[31.4641,-5.1764],[31.5164,-5.0145],[31.5067,-5.0019],[31.5549,-4.9127],[31.5448,-4.8539],[31.5896,-4.7698],[31.5142,-4.6005],[31.5219,-4.4476],[31.417,-4.284],[31.4339,-4.2301],[31.2514,-4.0385],[31.2174,-4.0284],[31.1779,-4.0548],[31.1357,-4.0126]]},"4":{"km":474,"h":8.6,"c":[[31.0995,-4.0131],[31.1783,-4.0549],[31.2514,-4.0385],[31.4339,-4.2301],[31.5291,-4.1848],[31.7564,-4.1967],[31.8602,-4.2674],[31.93,-4.4299],[31.989,-4.4975],[32.0472,-4.4028],[32.1205,-4.3691],[32.2556,-4.3876],[32.3296,-4.5523],[32.4305,-4.4736],[32.5859,-4.4949],[32.6554,-4.5721],[32.6851,-4.7447],[32.7349,-4.9086],[32.8236,-4.9614],[32.8764,-4.9458],[32.9399,-5.0607],[33.0286,-5.0718],[33.081,-5.0175],[33.1543,-5.0681],[33.2356,-5.0586],[33.4315,-5.1751],[33.4313,-5.2217],[33.5269,-5.1097],[33.7905,-4.9866],[34.0615,-4.984]]},"6":{"km":543,"h":6.5,"c":[[34.0615,-4.984],[33.9524,-5.0382],[33.928,-5.1675],[33.8858,-5.232],[33.8282,-5.4994],[33.836,-5.5881],[33.8935,-5.6736],[33.8891,-5.7289],[33.8308,-5.8518],[33.7877,-5.8973],[33.7797,-5.942],[33.8031,-6.0282],[33.7983,-6.0771],[33.819,-6.1094],[33.824,-6.217],[33.8545,-6.302],[33.8894,-6.3443],[33.9186,-6.4473],[34.0175,-6.5546],[34.0351,-6.7903],[34.0243,-6.8218],[33.8636,-7.0248],[33.7516,-7.2838],[33.5975,-7.5142],[33.5794,-7.5582],[33.6071,-7.6317],[33.5599,-7.6448],[33.3599,-7.6191],[33.3166,-7.6014],[33.285,-7.547],[33.0666,-7.599],[32.9973,-7.5889],[32.7739,-7.7359],[32.6712,-7.7539],[32.5165,-7.9182],[32.3754,-7.9348],[32.1423,-8.0025],[32.0588,-7.9947],[31.9114,-8.0262],[31.8024,-7.9831],[31.7017,-7.9833],[31.6672,-8.0114],[31.6259,-7.9895]]},"8":{"km":7,"h":0.2,"c":[[31.6259,-7.9895],[31.6236,-7.9906],[31.6241,-7.9912],[31.6239,-7.9918],[31.6224,-7.9917],[31.6221,-7.9931],[31.6186,-7.9913],[31.6168,-7.9907],[31.6136,-7.9931],[31.6151,-7.9956],[31.6133,-7.9979],[31.5985,-8.0218],[31.5968,-8.0258],[31.5958,-8.0273],[31.5979,-8.0284],[31.5978,-8.0321],[31.5994,-8.0326],[31.5997,-8.0336],[31.5994,-8.0347],[31.6004,-8.0352],[31.6008,-8.0366],[31.6029,-8.0377]]}};
  ROUTES[3] = { km: 80, h: 0, off: true, c: [[31.0990, -4.0120], [31.1050, -4.0550], [31.0333, -3.9997], [31.0990, -4.0120]] };

  var T = {
    en: { all: 'All days', day: 'Day', more: 'Read more', km: 'km', h: 'h driving', off: 'off-road 4×4 loop',
          locate: 'Where am I', locating: 'Finding you…', near: 'Nearest stop', away: 'away', noloc: 'Location unavailable. Allow location access for this site and try again.',
          map: 'Map', close: 'Close map' },
    bg: { all: 'Всички дни', day: 'Ден', more: 'Прочети още', km: 'км', h: 'ч път', off: 'обиколка с 4×4 извън пътя',
          locate: 'Къде съм', locating: 'Търся те…', near: 'Най-близка спирка', away: 'оттук', noloc: 'Няма достъп до местоположението. Разреши го за сайта и опитай пак.',
          map: 'Карта', close: 'Затвори картата' }
  };

  // [lat, lon, day, img|null, EN name, EN line, BG name, BG line]
  var STOPS = [
    [31.6069, -8.0363, 1, '-airport', 'Marrakech Menara airport', 'Start of the tour, and where it ends on Day 8.', 'Летище Маракеш Менара', 'Началото на обиколката и краят ѝ на ден 8.'],
    [31.2866, -7.3817, 1, 'tichka', "Tizi n'Tichka pass", 'Highest major road pass in North Africa, 2,260 m.', "Проходът Тизи н'Тишка", 'Най-високият голям автомобилен проход в Северна Африка, 2260 м.'],
    [31.0470, -7.1319, 1, 'benhaddou', 'Aït Benhaddou', 'UNESCO earthen ksar and film set for Gladiator and Game of Thrones.', 'Айт Бен Хаду', 'Глинен ксар на ЮНЕСКО, декор на „Гладиатор“ и „Игра на тронове“.'],
    [30.9335, -6.9370, 1, 'ouarzazate', 'Ouarzazate', 'Gateway to the desert, home of Atlas Studios. Night 1.', 'Уарзазат', 'Портата на пустинята, дом на Atlas Studios. Нощувка 1.'],
    [31.0570, -6.5560, 2, 'amridil', 'Kasbah Amridil, Skoura', '17th-century family kasbah from the old 50-dirham note.', 'Касба Амридил, Скура', 'Семейна касба от XVII век от старата банкнота от 50 дирхама.'],
    [31.2400, -6.1300, 2, '-mgouna', "Kelaat M'Gouna", 'Valley of Roses. Damask roses, harvested in May.', "Келаат М'Гуна", 'Долината на розите. Дамаски рози, беритба през май.'],
    [31.5340, -5.9250, 2, 'dades', 'Dades Valley', 'Road of a Thousand Kasbahs and the Tissadrine hairpins.', 'Долината Дадес', 'Пътят на хилядата касби и серпентините на Тисадрин.'],
    [31.5870, -5.5880, 2, 'todra', 'Todra Gorge', 'Walls ~300 m high, ~10 m apart at the narrowest.', 'Ждрелото Тодра', 'Стени ~300 м, само ~10 м една от друга в най-тясното.'],
    [31.4340, -4.2300, 2, '-erfoud', 'Erfoud', 'Fossil workshops, 350–400 million years old.', 'Ерфуд', 'Работилници за фосили на 350–400 млн. години.'],
    [31.1450, -3.9900, 2, 'chebbi', 'Erg Chebbi desert camp', 'Camel ride at sunset (~18:30). Night 2.', 'Пустинен лагер, Ерг Шеби', 'Камили по залез (~18:30). Нощувка 2.'],
    [31.0990, -4.0120, 3, 'merzouga', 'Merzouga', 'Base for the 4×4 day. Night 3.', 'Мерзуга', 'База за деня с 4×4. Нощувка 3.'],
    [31.1050, -4.0550, 3, '-dayet', 'Dayet Srij', 'Seasonal lake; flamingos when it holds water.', 'Даят Сриж', 'Сезонно езеро; фламинги, когато има вода.'],
    [31.0333, -3.9997, 3, 'gnawa', 'Khamlia', 'Village of Gnawa musicians.', 'Хамлия', 'Село на музикантите гнауа.'],
    [32.1200, -4.3700, 4, 'ziz', 'Ziz gorges', 'Palm groves of the Tafilalt and the Legionnaires’ Tunnel.', 'Ждрелата на Зиз', 'Палмите на Тафилалт и Тунелът на легионерите.'],
    [32.6850, -4.7450, 4, '-midelt', 'Midelt', 'Apple capital of Morocco. Lunch stop.', 'Мидельт', 'Столицата на ябълките. Обяд.'],
    [33.4000, -5.1700, 4, 'macaque', 'Azrou cedar forest', 'Atlas cedars and Barbary macaques.', 'Кедровата гора край Азру', 'Атласки кедри и маготи.'],
    [33.5270, -5.1100, 4, '-ifrane', 'Ifrane', '"Switzerland of Morocco": −23.9 °C record in 1935.', 'Ифран', '„Швейцария на Мароко“: рекорд −23,9 °C през 1935 г.'],
    [34.0617, -4.9838, 5, 'boujeloud', 'Bab Bou Jeloud', 'The Blue Gate into Fes el-Bali. Nights 4–5 in Fes.', 'Баб Бу Джелуд', 'Синята порта към Фес ел-Бали. Нощувки 4–5 във Фес.'],
    [34.0619, -4.9819, 5, 'bouinania', 'Bou Inania Madrasa', 'Marinid college, 1350–55, open to visitors.', 'Медресето Бу Инания', 'Меринидски колеж, 1350–55, отворен за посетители.'],
    [34.0646, -4.9733, 5, 'qarawiyyin', 'Al-Qarawiyyin', 'Oldest operating university in the world, 859.', 'Ал-Карауийн', 'Най-старият действащ университет в света, 859 г.'],
    [34.0665, -4.9714, 5, 'tannery', 'Chouara Tannery', 'Medieval dye vats, viewed from shop terraces.', 'Кожарната Шуара', 'Средновековни вани за боядисване, гледани от терасите.'],
    [34.0533, -4.9930, 5, 'royalfes', 'Royal Palace gates', 'Seven gilded brass doors in Fes el-Jdid.', 'Портите на Кралския дворец', 'Седем позлатени месингови врати във Фес ел-Джедид.'],
    [34.0240, -6.8225, 6, 'hassantower', 'Hassan Tower', 'Unfinished 1195 minaret, with the Mausoleum of Mohammed V beside it.', 'Кулата на Хасан', 'Недовършено минаре от 1195 г., до него е Мавзолеят на Мохамед V.'],
    [34.0314, -6.8364, 6, 'udayas', 'Kasbah of the Udayas', 'Blue-and-white Almohad fortress above the ocean.', 'Касбата Удая', 'Синьо-бяла алмохадска крепост над океана.'],
    [33.6086, -7.6326, 6, 'hassan2', 'Hassan II Mosque', '210 m minaret built out over the Atlantic.', 'Джамията Хасан II', 'Минаре от 210 м, построена над Атлантика.'],
    [31.6237, -7.9936, 7, 'koutoubia', 'Koutoubia Mosque', 'The 77 m "booksellers’ mosque". Nights 6–7 in Marrakech.', 'Джамията Кутубия', '„Джамията на книжарите“, 77 м. Нощувки 6–7 в Маракеш.'],
    [31.6258, -7.9891, 7, 'jemaa', 'Jemaa el-Fnaa', 'The square of storytellers and food stalls.', 'Джемаа ел-Фна', 'Площадът на разказвачите и сергиите за храна.'],
    [31.6216, -7.9832, 7, 'bahia', 'Bahia Palace', 'Grand vizier’s palace, 8 hectares.', 'Дворецът Бахия', 'Дворецът на великия везир, 8 хектара.'],
    [31.6417, -8.0033, 7, '-majorelle', 'Jardin Majorelle', 'Optional: the blue garden saved by Yves Saint Laurent.', 'Градината Мажорел', 'По желание: синята градина на Ив Сен Лоран.']
  ];

  var lang = 'en';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function img(s) { return s[3].charAt(0) === '-' ? null : s[3]; }
  function sid(s) { return s[3].replace(/^-/, ''); }

  var el = document.createElement('div'); el.className = 'lmap';
  var bar = document.createElement('div'); bar.className = 'lmap-bar';
  var status = document.createElement('div'); status.className = 'lmap-status'; status.hidden = true;
  var holder = document.createElement('div'); holder.className = 'lmap-wrap';
  holder.appendChild(bar); holder.appendChild(el); holder.appendChild(status);

  var map = L.map(el, { scrollWheelZoom: false, zoomSnap: 0.25 });
  function setDark(d) { el.classList.toggle('dark', d); }
  setDark(document.documentElement.classList.contains('is-dark'));
  document.addEventListener('themechange', function (e) { setDark(e.detail); });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  var dayLayers = {}, lines = {}, markers = {}, markerDay = {};
  function layerFor(d) { return dayLayers[d] || (dayLayers[d] = L.featureGroup().addTo(map)); }

  Object.keys(ROUTES).forEach(function (d) {
    var r = ROUTES[d];
    lines[d] = L.polyline(r.c, { color: DAY_COLORS[d], weight: 4, opacity: .85, dashArray: r.off ? '6 8' : null })
      .addTo(layerFor(d)).bindTooltip(function () {
        var t = T[lang];
        return t.day + ' ' + d + ' · ' + (r.off ? t.off : '~' + r.km + ' ' + t.km + ', ~' + r.h + ' ' + t.h);
      }, { sticky: true });
  });

  STOPS.forEach(function (s) {
    var icon = L.divIcon({ className: 'lpin', html: '<span style="background:' + DAY_COLORS[s[2]] + '">' + s[2] + '</span>', iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -10] });
    var m = L.marker([s[0], s[1]], { icon: icon, title: s[4] }).addTo(layerFor(s[2]));
    m.bindPopup(function () {
      var bg = lang === 'bg', t = T[lang], p = img(s);
      return (p ? '<img src="img/' + p + '.jpg" alt="" loading="lazy">' : '') +
        '<div class="lp-body"><div class="lp-day">' + t.day + ' ' + s[2] + '</div>' +
        '<b>' + (bg ? s[6] : s[4]) + '</b><p>' + (bg ? s[7] : s[5]) + '</p>' +
        '<a href="#' + (bg ? 'bg-' : '') + 'day-' + s[2] + '">' + t.more + ' →</a></div>';
    }, { maxWidth: 260, minWidth: 220 });
    markers[sid(s)] = m; markerDay[sid(s)] = s[2];
  });

  var all = L.featureGroup(Object.keys(markers).map(function (k) { return markers[k]; }));
  function fit(d) {
    var b = d ? dayLayers[d].getBounds() : all.getBounds();
    map.fitBounds(b, { padding: [24, 24], maxZoom: d === 5 || d === 7 ? 15 : 10, animate: !reduce });
    Array.prototype.forEach.call(bar.querySelectorAll('[data-d]'), function (c) { c.setAttribute('aria-pressed', String(String(d || '') === c.dataset.d)); });
  }

  var locIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5" fill="currentColor"/><circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  function drawBar() {
    var t = T[lang], html = '<button type="button" data-d="">' + t.all + '</button>';
    for (var d = 1; d <= 8; d++) html += '<button type="button" data-d="' + d + '"><i style="background:' + DAY_COLORS[d] + '"></i>' + d + '</button>';
    html += '<button type="button" class="lmap-loc" aria-pressed="' + String(watchId != null) + '">' + locIcon + t.locate + '</button>';
    html += '<button type="button" class="lmap-close" aria-label="' + t.close + '" title="' + t.close + '">×</button>';
    bar.innerHTML = html;
  }
  bar.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('lmap-loc')) return locate();
    if (b.classList.contains('lmap-close')) return closeDock();
    fit(b.dataset.d ? +b.dataset.d : 0);
  });

  // ---------- where am I ----------
  var watchId = null, me = null, meAcc = null, firstFix = true;
  function km(a, b, c, d) {
    var R = 6371, r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r;
    var h = Math.sin(x / 2) * Math.sin(x / 2) + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) * Math.sin(y / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function say(msg) { status.hidden = !msg; status.textContent = msg || ''; }
  function locate() {
    if (!navigator.geolocation) return say(T[lang].noloc);
    if (watchId !== null) {   // second tap: just recentre
      if (me) map.flyTo(me.getLatLng(), Math.max(map.getZoom(), 11), { animate: !reduce });
      return;
    }
    say(T[lang].locating);
    watchId = navigator.geolocation.watchPosition(function (p) {
      var ll = [p.coords.latitude, p.coords.longitude];
      if (!me) {
        me = L.marker(ll, { icon: L.divIcon({ className: 'lme', html: '<span></span>', iconSize: [18, 18], iconAnchor: [9, 9] }), zIndexOffset: 1000, interactive: false }).addTo(map);
        meAcc = L.circle(ll, { radius: p.coords.accuracy, color: '#2f7cf6', weight: 1, fillOpacity: .12, interactive: false }).addTo(map);
      } else { me.setLatLng(ll); meAcc.setLatLng(ll).setRadius(p.coords.accuracy); }
      var best = null, bd = 1e9;
      STOPS.forEach(function (s) { var d = km(ll[0], ll[1], s[0], s[1]); if (d < bd) { bd = d; best = s; } });
      var t = T[lang];
      say(t.near + ': ' + (lang === 'bg' ? best[6] : best[4]) + ' · ' + (bd < 10 ? bd.toFixed(1) : Math.round(bd).toLocaleString()) + ' ' + t.km + ' ' + t.away);
      if (firstFix) {
        firstFix = false;
        if (bd < 300) map.flyTo(ll, 11, { animate: !reduce });
        else map.fitBounds(L.latLngBounds([ll, [best[0], best[1]]]), { padding: [30, 30], animate: !reduce });
      }
      drawLocState();
    }, function () {
      say(T[lang].noloc); navigator.geolocation.clearWatch(watchId); watchId = null; drawLocState();
    }, { enableHighAccuracy: true, maximumAge: 30000, timeout: 20000 });
    drawLocState();
  }
  function drawLocState() { var b = bar.querySelector('.lmap-loc'); if (b) b.setAttribute('aria-pressed', String(watchId !== null)); }

  // ---------- follow the story ----------
  var activeDay = 0, activeStop = null, flyTimer = null;
  function highlight(day, stop) {
    Object.keys(lines).forEach(function (d) {
      var on = !day || +d === day;
      lines[d].setStyle({ opacity: on ? .95 : .2, weight: on && day ? 6 : 4 });
    });
    Object.keys(markers).forEach(function (k) {
      var e = markers[k].getElement(); if (!e) return;
      e.classList.toggle('dim', !!day && markerDay[k] !== day);
      e.classList.toggle('on', k === stop);
    });
  }
  function follow(day, stop) {
    if (day === activeDay && stop === activeStop) return;
    activeDay = day; activeStop = stop;
    highlight(day, stop);
    if (!docked) return;
    clearTimeout(flyTimer);
    flyTimer = setTimeout(function () {
      if (stop && markers[stop]) {
        var z = markerDay[stop] === 5 || markerDay[stop] === 7 ? 15 : 10;
        map.flyTo(markers[stop].getLatLng(), z, { animate: !reduce, duration: 1.1 });
      } else if (day && dayLayers[day]) fit(day);
    }, 250);
  }

  var io = null;
  function observe() {
    if (io) io.disconnect();
    if (!('IntersectionObserver' in window)) return;
    var block = document.querySelector('[data-l="' + lang + '"]');
    io = new IntersectionObserver(function () {
      // pick the element nearest the reading line (40% from top)
      var line = window.innerHeight * 0.4, day = 0, stop = null;
      block.querySelectorAll('.day').forEach(function (s) {
        var r = s.getBoundingClientRect(); if (r.top <= line && r.bottom > line) day = +s.id.replace(/\D/g, '');
      });
      block.querySelectorAll('[data-stop]').forEach(function (a) {
        var r = a.getBoundingClientRect(); if (r.top <= line && r.bottom > line) stop = a.getAttribute('data-stop');
      });
      follow(day, stop);
    }, { rootMargin: '-40% 0px -59% 0px' });
    block.querySelectorAll('.day, [data-stop]').forEach(function (n) { io.observe(n); });
  }

  // ---------- inline slot vs. floating dock ----------
  var slot = null, docked = false;
  var dock = document.createElement('div'); dock.className = 'mapdock'; dock.hidden = true;
  document.body.appendChild(dock);
  var fab = document.createElement('button'); fab.type = 'button'; fab.className = 'mapfab';
  document.body.appendChild(fab);
  function drawFab() {
    fab.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 4v13.5M15 6.5V20" stroke="currentColor" stroke-width="1.8"/></svg><span>' + T[lang].map + '</span>';
  }
  function place(target) {
    target.appendChild(holder);
    map.invalidateSize();
  }
  function openDock() {
    docked = true; dock.hidden = false; document.body.classList.add('dock-open');
    place(dock);
    if (slot) slot.querySelector(':scope > svg').style.display = '';
    var d = activeDay, s = activeStop; activeDay = -1; follow(d, s);
    if (!d) fit(0);
  }
  function closeDock() {
    docked = false; dock.hidden = true; document.body.classList.remove('dock-open');
    if (slot) { slot.querySelector(':scope > svg').style.display = 'none'; place(slot); }
  }
  fab.addEventListener('click', function () { docked ? closeDock() : openDock(); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.daymap'); if (!b) return;
    var d = +b.getAttribute('data-day');
    if (!docked) openDock();
    activeDay = d; activeStop = null; highlight(d, null);
    setTimeout(function () { map.invalidateSize(); fit(d); }, 60);
  });

  function onScroll() {
    if (!slot) return;
    var r = slot.getBoundingClientRect();
    var away = r.bottom < window.innerHeight * 0.3 || r.top > window.innerHeight;
    fab.classList.toggle('show', away && !docked);
    if (docked && !away && r.top > -40 && r.top < window.innerHeight * .6) closeDock();
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  function mount(l) {
    lang = l;
    if (docked) closeDock();
    slot = document.querySelector('[data-l="' + l + '"] .map');
    if (!slot) return;
    document.querySelectorAll('.map > svg').forEach(function (s) { s.style.display = ''; });
    slot.querySelector(':scope > svg').style.display = 'none';
    slot.removeAttribute('role');
    place(slot);
    map.closePopup();
    drawBar(); drawFab(); say('');
    fit(0);
    activeDay = -1; observe(); onScroll();
  }

  document.addEventListener('langchange', function (e) { mount(e.detail); });
  map.on('popupopen', function (e) {
    var a = e.popup.getElement().querySelector('a[href^="#"]');
    if (a) a.addEventListener('click', function () { map.closePopup(); });
  });
})();
