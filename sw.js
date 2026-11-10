const CACHE_NAME = "lsf-cache-safe-v2";

const urlsToCache = [
  "./",
  "./index.html",
  "./presentation-de-la-LSF-1.html",
  "./histoire-de-la-lsf-2.html",
  "./mots-de-base-et-vocabulaire-3.html",
  "./calendrier-en-lsf-4.html",
  "./image-LSF.png",
  "./image-abbee-de-lepee.jpg",
  "./dactylologie.jpg",
  "./Politesse_signaire.jpg"
];

// INSTALL → cache simple (sans tout casser si erreur)
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of urlsToCache) {
        try {
          await cache.add(url);
        } catch (e) {
          console.warn("Erreur cache :", url);
        }
      }
    })
  );
});

// ACTIVATE → prend le contrôle immédiatement
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      )
    )
  );

  self.clients.claim();
});

// FETCH → stratégie SAFARI SAFE
self.addEventListener("fetch", (event) => {
  // IMPORTANT : ignorer certaines requêtes problématiques
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // met en cache seulement si OK
        if (response && response.status === 200 && response.type === "basic") {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // fallback cache si offline
        return caches.match(event.request).then((response) => {
          if (response) return response;

          // fallback page principale
          if (event.request.destination === "document") {
            return caches.match("./presentation-de-la-LSF-1.html");
          }
        });
      })
  );
});
