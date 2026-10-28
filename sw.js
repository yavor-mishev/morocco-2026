// Offline support: precache the booklet, cache fonts and viewed map tiles as you go.
var V = 'morocco-v5';
var LOCAL = [
"./",
"index.html",
"map.js",
"app.js",
"img/amridil.jpg",
"img/bahia.jpg",
"img/benhaddou.jpg",
"img/bouinania.jpg",
"img/boujeloud.jpg",
"img/chebbi.jpg",
"img/dades.jpg",
"img/gnawa.jpg",
"img/hassan2.jpg",
"img/hassantower.jpg",
"img/jemaa.jpg",
"img/koutoubia.jpg",
"img/macaque.jpg",
"img/mausoleum.jpg",
"img/merzouga.jpg",
"img/ouarzazate.jpg",
"img/qarawiyyin.jpg",
"img/royalfes.jpg",
"img/tannery.jpg",
"img/tichka.jpg",
"img/todra.jpg",
"img/udayas.jpg",
"img/ziz.jpg",
"audio/azul.m4a",
"audio/bshhal.m4a",
"audio/bslama.m4a",
"audio/ghali.m4a",
"audio/inshallah.m4a",
"audio/lashukran.m4a",
"audio/mezyan.m4a",
"audio/safi.m4a",
"audio/salam.m4a",
"audio/shukran.m4a"
];
var CDN = ["https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css", "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"];
var TILES = 'morocco-tiles', TILE_MAX = 1500;

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(V).then(function (c) {
    return c.addAll(LOCAL).then(function () {
      return Promise.all(CDN.map(function (u) { return c.add(new Request(u, { mode: 'cors' })).catch(function () {}); }));
    });
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== V && k !== TILES && k !== 'morocco-fonts'; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }).then(function () {
    return self.clients.matchAll().then(function (cs) { cs.forEach(function (c) { c.postMessage('precached'); }); });
  }));
});

function trim(name, max) {
  caches.open(name).then(function (c) { c.keys().then(function (ks) { if (ks.length > max) c.delete(ks[0]).then(function () { trim(name, max); }); }); });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  if (url.hostname === 'tile.openstreetmap.org') {
    e.respondWith(caches.open(TILES).then(function (c) {
      return c.match(req).then(function (hit) {
        if (hit) return hit;
        return fetch(req).then(function (res) {
          if (res.ok || res.type === 'opaque') { c.put(req, res.clone()); trim(TILES, TILE_MAX); }
          return res;
        });
      });
    }));
    return;
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com' || url.hostname === 'cdnjs.cloudflare.com') {
    e.respondWith(caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(url.hostname === 'cdnjs.cloudflare.com' ? V : 'morocco-fonts').then(function (c) { c.put(req, copy); });
        return res;
      });
    }));
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Same origin: always try the network first (revalidated), fall back to the saved copy offline.
  e.respondWith(caches.open(V).then(function (c) {
    return fetch(req, { cache: 'no-cache' }).then(function (res) {
      if (res.ok) c.put(req, res.clone());
      return res;
    }).catch(function () {
      return c.match(req, { ignoreSearch: req.mode === 'navigate' }).then(function (hit) {
        return hit || (req.mode === 'navigate' ? c.match('./') : Response.error());
      });
    });
  }));
});
