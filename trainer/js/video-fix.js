/* WRAP 911 — video play fix
   Catalog lists many .mp4 paths that are stills-only (jpg on disk, no movie).
   Old player: create <video>, autoplay, error, tear down in <1s.
*/
(function () {
  function showMissing(host, btn) {
    if (!host) return;
    if (!host.querySelector(".video-play-error")) {
      var p = document.createElement("p");
      p.className = "muted video-play-error";
      p.textContent = "Still only. No movie on this card.";
      var links = host.querySelector(".video-links");
      if (links) host.insertBefore(p, links);
      else host.appendChild(p);
    }
    if (btn) btn.hidden = false;
  }

  function youtubeId(src) {
    src = String(src || "").trim();
    var patterns = [
      /[?&]v=([A-Za-z0-9_-]{11})/,
      /youtu\.be\/([A-Za-z0-9_-]{11})/,
      /youtube(?:-nocookie)?\.com\/embed\/([A-Za-z0-9_-]{11})/,
      /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/
    ];
    for (var i = 0; i < patterns.length; i++) {
      var m = src.match(patterns[i]);
      if (m) return m[1];
    }
    return "";
  }

  function playYoutube(host, id) {
    var list = document.getElementById("video-list");
    if (list) {
      var olds = list.querySelectorAll(".catalog-youtube");
      for (var i = 0; i < olds.length; i++) {
        if (olds[i].parentNode) olds[i].parentNode.removeChild(olds[i]);
      }
    }
    var card = host.closest(".video-card") || host;
    card.style.flexWrap = "wrap";
    var frame = document.createElement("iframe");
    frame.className = "catalog-clip catalog-youtube";
    frame.src = "https://www.youtube-nocookie.com/embed/" + id + "?rel=0&modestbranding=1&playsinline=1";
    frame.title = "WRAP 911 shop video";
    frame.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
    frame.setAttribute("allowfullscreen", "");
    frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    frame.style.cssText = "width:100%;flex:1 0 100%;aspect-ratio:16/9;border:0;border-radius:8px;background:#000;display:block;margin:0 0 8px";
    card.insertBefore(frame, card.firstChild);
  }

  function playSafe(btn) {
    var host = btn && btn.closest ? btn.closest(".video-player-host") : null;
    if (!host) return;
    var src = host.getAttribute("data-video-src") || "";
    var still = host.getAttribute("data-video-still") || "";
    var yid = youtubeId(src);
    if (yid) {
      btn.hidden = true;
      playYoutube(host, yid);
      return;
    }
    if (!src) {
      showMissing(host, btn);
      return;
    }
    btn.hidden = true;
    fetch(src, { method: "HEAD", cache: "no-store" }).then(function (res) {
      var type = (res.headers.get("content-type") || "").toLowerCase();
      if (!res.ok || type.indexOf("video") === -1) throw new Error("not-video");
      var card = host.closest(".video-card") || host;
      card.style.display = "block";
      var old = card.querySelector("video.catalog-clip");
      if (old && old.parentNode) old.parentNode.removeChild(old);
      var video = document.createElement("video");
      video.className = "catalog-clip";
      video.controls = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.preload = "metadata";
      if (still) video.poster = still;
      video.style.cssText = "width:100%;max-height:70vh;margin:0 0 8px;border-radius:8px;background:#000;display:block";
      video.addEventListener("error", function () { showMissing(host, btn); });
      video.src = src;
      card.insertBefore(video, card.firstChild);
      var playPromise = video.play();
      if (playPromise && playPromise.catch) playPromise.catch(function () {});
    }).catch(function () {
      showMissing(host, btn);
    });
  }

  function bind() {
    var list = document.getElementById("video-list");
    if (!list) return;
    list.addEventListener("click", function (ev) {
      var btn = ev.target.closest(".video-play-btn");
      if (!btn) return;
      ev.preventDefault();
      ev.stopPropagation();
      playSafe(btn);
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
