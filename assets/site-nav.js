/* Phones: music store links open in the same tab, so the app launches without leaving a blank tab behind.
   Computers keep opening them in a new window. Runs on its own, before the menu code, and also catches
   links the menu adds later (checked again at tap time). */
(function () {
  var stores = ["open.spotify.com", "music.apple.com", "music.youtube.com", "soundcloud.com"];
  var redirects = ["/spotify/", "/apple/", "/youtube-music/"];

  function isPhone() {
    var ua = navigator.userAgent || "";
    if (/iPhone|iPad|iPod|Android/i.test(ua)) return true;
    if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return true; /* iPadOS */
    return !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  }

  function isMusicLink(a) {
    var raw = a.getAttribute("href");
    if (!raw) return false;
    var url;
    try { url = new URL(raw, location.href); } catch (err) { return false; }
    var host = url.hostname.toLowerCase();
    if (stores.indexOf(host) !== -1) return true;
    if (url.origin !== location.origin) return false;
    var path = url.pathname.replace(/index\.html$/, "");
    if (path.charAt(path.length - 1) !== "/") path += "/";
    return redirects.indexOf(path) !== -1;
  }

  function sameTab(a) {
    if (a.getAttribute("target") === "_blank" && isMusicLink(a)) a.removeAttribute("target");
  }

  function sweep() {
    if (!isPhone()) return;
    var links = document.querySelectorAll("a[target=_blank]");
    for (var i = 0; i < links.length; i++) sameTab(links[i]);
  }

  /* Tap time, capture phase: runs before the browser follows the link and leaves other click handlers alone. */
  document.addEventListener("click", function (event) {
    if (!isPhone()) return;
    var a = event.target && event.target.closest ? event.target.closest("a[href]") : null;
    if (a) sameTab(a);
  }, true);

  /* After the menu code below has built its links (and on sites where it re-adds new-window targets). */
  setTimeout(sweep, 0);
  window.addEventListener("load", sweep);
})();

/* Site menu. Add a destination by appending one entry. The open menu lists every other destination. Subscribe confirmation and thank-you pages are not destinations. */
(function () {
  var pages = [
    { href: "/", label: "Album" },
    { href: "https://music.apple.com/us/album/smitten-with-the-muses/839652860?ls=1", label: "Apple Music", blank: true },
    { href: "https://open.spotify.com/album/4dFca0jJcTbgbZEPO2EU0A", label: "Spotify", blank: true },
    { href: "https://lackadaisicalperfection.com/scores/", label: "Scores", blank: true }
  ];

  function normalize(path) {
    var p = path || "/";
    var base = location.origin && location.origin !== "null"
      ? location.origin
      : "https://smittenwiththemuses.com";
    try {
      p = new URL(p, base).pathname;
    } catch (err) {
      p = "/";
    }
    if (p === "/index.html" || p.slice(-11) === "/index.html") {
      p = p.slice(0, -10);
    }
    if (p.charAt(p.length - 1) !== "/") p += "/";
    return p;
  }

  function isConfirmation(path) {
    return /\/(confirmed|thank-you|thanks)\/$/.test(path);
  }

  function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  var here = normalize(location.pathname);
  var links = pages.filter(function (page) {
    var path = normalize(page.href);
    if (isConfirmation(path)) return false;
    if (page.blank) return true;
    return path !== here;
  });

  var button = document.createElement("button");
  button.type = "button";
  button.className = "nav-toggle";
  button.setAttribute("aria-label", "Open menu");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", "site-menu");

  var img = document.createElement("img");
  img.src = "/assets/david-with-lp.jpg";
  img.srcset = "/assets/david-with-lp.jpg 1x, /assets/david-with-lp@2x.jpg 2x";
  img.width = 160;
  img.height = 160;
  img.alt = "";
  img.decoding = "async";
  button.appendChild(img);

  var list = document.createElement("ul");
  list.setAttribute("role", "list");
  links.forEach(function (page) {
    var item = document.createElement("li");
    var link = document.createElement("a");
    link.href = page.href;
    link.textContent = page.label;
    if (page.blank) {
      link.target = "_blank";
      link.rel = "noopener";
    }
    item.appendChild(link);
    list.appendChild(item);
  });

  /* Newest first, from each album's release year. Titles and domains come from each album repo. */
  var albums = [
    { title: "Lackadaisical Perfection", href: "https://lackadaisicalperfection.com/", host: "lackadaisicalperfection.com", slug: "lackadaisical-perfection" },
    { title: "Piano Reveries and Phantasies", href: "https://pianoreveries.com/", host: "pianoreveries.com", slug: "piano-reveries-and-phantasies" },
    { title: "Smitten with the Muses", href: "https://smittenwiththemuses.com/", host: "smittenwiththemuses.com", slug: "smitten-with-the-muses" },
    { title: "Where In The World Is Diane", href: "https://whereintheworldisdiane.com/", host: "whereintheworldisdiane.com", slug: "where-in-the-world-is-diane" },
    { title: "Clean Calm Piano", href: "https://cleancalmpiano.com/", host: "cleancalmpiano.com", slug: "clean-calm-piano" },
    { title: "Tantalizing Proof", href: "https://tantalizingproof.com/", host: "tantalizingproof.com", slug: "tantalizing-proof" },
    { title: "Piano In Colors", href: "https://pianoincolors.com/", host: "pianoincolors.com", slug: "piano-in-colors" },
    { title: "Melodic Subtlety – Solo Piano", href: "https://melodicsubtlety.com/", host: "melodicsubtlety.com", slug: "melodic-subtlety" }
  ];

  function currentAlbumHost() {
    var host = (location.hostname || "").toLowerCase().replace(/^www\./, "");
    for (var i = 0; i < albums.length; i++) {
      if (albums[i].host === host) return host;
    }
    return "smittenwiththemuses.com";
  }

  function albumImage(slug) {
    var img = document.createElement("img");
    var base = "/assets/albums/" + slug;
    img.src = base + ".jpg";
    img.srcset = base + ".jpg 1x, " + base + "@2x.jpg 2x";
    img.width = 48;
    img.height = 48;
    img.alt = "";
    img.decoding = "async";
    return img;
  }

  var albumsWrap = document.createElement("div");
  albumsWrap.className = "menu-albums";

  var albumsLabel = document.createElement("p");
  albumsLabel.className = "menu-albums-label";
  albumsLabel.id = "menu-albums-label";
  albumsLabel.textContent = "Albums";

  var albumList = document.createElement("ul");
  albumList.setAttribute("aria-labelledby", "menu-albums-label");

  var hereHost = currentAlbumHost();
  albums.forEach(function (album) {
    var item = document.createElement("li");
    var title = document.createElement("span");
    title.className = "album-title";
    title.textContent = album.title;
    if (album.host === hereHost) {
      var row = document.createElement("div");
      row.className = "album-here";
      row.setAttribute("aria-current", "page");
      var copy = document.createElement("span");
      copy.className = "album-copy";
      var note = document.createElement("span");
      note.className = "album-note";
      note.textContent = "You're here";
      copy.appendChild(title);
      copy.appendChild(note);
      row.appendChild(albumImage(album.slug));
      row.appendChild(copy);
      item.appendChild(row);
    } else {
      var albumLink = document.createElement("a");
      albumLink.href = album.href;
      albumLink.target = "_blank";
      albumLink.rel = "noopener";
      albumLink.appendChild(albumImage(album.slug));
      albumLink.appendChild(title);
      item.appendChild(albumLink);
    }
    albumList.appendChild(item);
  });

  albumsWrap.appendChild(albumsLabel);
  albumsWrap.appendChild(albumList);

  var menu = document.createElement("nav");
  menu.id = "site-menu";
  menu.className = "site-menu";
  menu.setAttribute("aria-label", "Pages");
  menu.hidden = true;
  menu.appendChild(list);
  menu.appendChild(albumsWrap);

  document.body.appendChild(button);
  document.body.appendChild(menu);

  var generation = 0;
  var open = false;

  function setOpenState(next) {
    open = next;
    button.setAttribute("aria-expanded", next ? "true" : "false");
    button.setAttribute("aria-label", next ? "Close menu" : "Open menu");
  }

  function finishClose(gen) {
    if (gen !== generation || open) return;
    menu.hidden = true;
    if ("inert" in menu) menu.inert = true;
  }

  function openMenu() {
    generation += 1;
    menu.hidden = false;
    if ("inert" in menu) menu.inert = false;
    if (reducedMotion()) {
      menu.classList.add("is-open");
    } else {
      menu.classList.remove("is-open");
      void menu.offsetWidth;
      menu.classList.add("is-open");
    }
    setOpenState(true);
  }

  function closeMenu(restoreFocus) {
    var gen = generation += 1;
    setOpenState(false);
    menu.classList.remove("is-open");
    if ("inert" in menu) menu.inert = true;
    if (reducedMotion()) {
      finishClose(gen);
    } else {
      var timer = setTimeout(function () { finishClose(gen); }, 400);
      menu.addEventListener("transitionend", function onEnd(event) {
        if (event.target !== menu || event.propertyName !== "opacity") return;
        menu.removeEventListener("transitionend", onEnd);
        clearTimeout(timer);
        finishClose(gen);
      });
    }
    if (restoreFocus) button.focus();
  }

  button.addEventListener("click", function (event) {
    event.stopPropagation();
    if (open) closeMenu(false);
    else openMenu();
  });

  document.addEventListener("click", function (event) {
    if (!open) return;
    if (menu.contains(event.target)) return;
    closeMenu(false);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape" || !open) return;
    event.preventDefault();
    closeMenu(true);
  });
})();
