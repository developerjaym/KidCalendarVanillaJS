const cacheName = "KidCalendar";

// Cache all the files to make a PWA
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(cacheName).then((cache) => {
      // Our application only has two files here index.html and manifest.json
      // but you can add more such as style.css as your app grows
      return cache.addAll([
        "./",
        "./index.html",
        "./manifest.json",
        "./main-calendar.js",

        "./modules/environments/environment.js",

        "./modules/authentication/authentication.js",

        "./modules/calendar/calendar.js",
        "./modules/calendar/DayOfWeek.js",
        "./modules/calendar/LocalDate.js",
        
        "./modules/common/form.js",
        "./modules/common/ui.js",
        "./modules/common/utility.js",
        "./assets/pwa/x128.png",
        "./assets/pwa/x192.png",
        "./assets/pwa/x384.png",
        "./assets/pwa/x48.png",
        "./assets/pwa/x512.png",
        "./assets/pwa/x72.png",
        "./assets/pwa/x96.png",
        "./assets/favicon.png",
        "./styles/styles.css",
      ]);
    })
  );
});

// Our service worker will intercept all fetch requests
// and check if we have cached the file
// if so it will serve the cached file
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .open(cacheName)
      .then((cache) => cache.match(event.request, { ignoreSearch: true }))
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});
