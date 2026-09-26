/* WRAP 911 Trainer — offline shell cache; media/videos stay network (no cache) */
var CACHE = "wrap911-trainer-2.9.25-freechip";
var ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/config.js",
  "./js/data.js",
  "./js/data_extra.js",
  "./js/app.js",
  "./js/app-core.js",
  "./js/license-gate.js",
  "./js/plan-fix.js",
  "./js/app_extra.js",
  "./js/coach.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
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
        if (k === CACHE) return Promise.resolve();
        return caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
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
        return caches.match(event.request);
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
      return caches.match(event.request).then(function (cached) {
        if (cached) return cached;
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
        return new Response("", { status: 503, statusText: "Offline" });
      });
    })
  );
});
