/* WRAP 911 Trainer — offline shell cache; media/videos stay network (no cache) */
var CACHE = "wrap911-trainer-2.6.5-ship";
var IMG_CACHE = "wrap911-img-v1"; /* photos the user already opened; videos are never cached */
/* Precached without ?v=. Fetch fallbacks use ignoreSearch so ?v= script URLs still match offline. */
var ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./css/theme-dark.css",
  "./js/about.js",
  "./js/app-core.js",
  "./js/app.js",
  "./js/app_extra.js",
  "./js/captions-fix.js",
  "./js/coach.js",
  "./js/config.js",
  "./js/data.js",
  "./js/data_extra.js",
  "./js/games.js",
  "./js/ios-license-bridge.js",
  "./js/jobs-trim.js",
  "./js/labels-fix.js",
  "./js/license-gate.js",
  "./js/photos-boost.js",
  "./js/photos-pack.js",
  "./js/photos-unique.js",
  "./js/plan-fix.js",
  "./js/practice-fix.js",
  "./js/problem-upload.js",
  "./js/problems-db.js",
  "./js/video-fix.js",
  "./manifest.webmanifest",
  /* 2.6.4: extra game sets (fetched without ?v=; network-first, this copy answers offline) */
  "./data/games/fix-it-fast.json",
  "./data/games/spot-it.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  /* 2.6.2: shell fonts + header logo so the first screen renders offline (small files; no photos/mp4s here) */
  "../fonts/bebas-neue.woff2",
  "../fonts/outfit-400.woff2",
  "../fonts/outfit-700.woff2",
  "../assets/wrap911-logo.jpg"
];

function isMediaRequest(url) {
  try {
    var u = new URL(url);
    var path = u.pathname.toLowerCase();
    if (path.indexOf("/media/") !== -1) return true;
    return /\.(mp4|webm|mov|m4v|mp3|wav|ogg|m3u8|ts)(\?|$)/i.test(path);
  } catch (e) {
    return false;
  }
}

function isJsOrCssRequest(url) {
  try {
    var u = new URL(url);
    var path = u.pathname.toLowerCase();
    if (path.indexOf("/js/") !== -1 || path.indexOf("/css/") !== -1) return true;
    return /\.(js|css)(\?|$)/i.test(path);
  } catch (e) {
    return false;
  }
}

function isIconRequest(url) {
  try {
    var u = new URL(url);
    var path = u.pathname.toLowerCase();
    return path.indexOf("/icons/") !== -1 || /\.(png|ico|svg|webp)(\?|$)/i.test(path);
  } catch (e) {
    return false;
  }
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k === CACHE || k === IMG_CACHE) return Promise.resolve();
        return caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  if (/\.(jpe?g|png|webp)$/i.test(new URL(event.request.url).pathname) && new URL(event.request.url).origin === self.location.origin) {
    event.respondWith(
      caches.open(IMG_CACHE).then(function (cache) {
        return cache.match(event.request).then(function (hit) {
          if (hit) return hit;
          return fetch(event.request).then(function (res) {
            if (res && res.ok && new URL(event.request.url).origin === self.location.origin) cache.put(event.request, res.clone());
            return res;
          });
        });
      }).catch(function () { return new Response("", { status: 503, statusText: "Photo offline" }); })
    );
    return;
  }
  if (isMediaRequest(event.request.url)) {
    event.respondWith(
      fetch(event.request).catch(function () {
        return new Response("", { status: 503, statusText: "Media offline" });
      })
    );
    return;
  }
  if (isJsOrCssRequest(event.request.url)) {
    event.respondWith(
      fetch(event.request).then(function (res) {
        try {
          var url = new URL(event.request.url);
          if (url.origin === self.location.origin && res && res.ok) {
            var copy = res.clone();
            caches.open(CACHE).then(function (cache) {
              cache.put(event.request, copy);
            });
          }
        } catch (e) {}
        return res;
      }).catch(function () {
        return caches.match(event.request, { ignoreSearch: true });
      })
    );
    return;
  }
  if (isIconRequest(event.request.url)) {
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        if (cached) return cached;
        return fetch(event.request).then(function (res) {
          try {
            var url = new URL(event.request.url);
            if (url.origin === self.location.origin && res && res.ok) {
              var copy = res.clone();
              caches.open(CACHE).then(function (cache) {
                cache.put(event.request, copy);
              });
            }
          } catch (e) {}
          return res;
        });
      })
    );
    return;
  }
  var net = fetch(event.request);
  var timed = new Promise(function (_, reject) {
    setTimeout(function () { reject(new Error("slow")); }, 8000);
  });
  event.respondWith(
    Promise.race([net, timed]).then(function (res) {
      try {
        var url = new URL(event.request.url);
        if (url.origin === self.location.origin && res && res.ok && !isMediaRequest(event.request.url)) {
          var copy = res.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(event.request, copy);
          });
        }
      } catch (e) {}
      return res;
    }).catch(function () {
      return caches.match(event.request, { ignoreSearch: event.request.mode === "navigate" }).then(function (cached) {
        if (cached) return cached;
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
        return new Response("", { status: 503, statusText: "Offline" });
      });
    })
  );
});
