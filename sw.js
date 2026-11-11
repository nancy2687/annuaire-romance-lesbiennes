
// ========================================
// ANNUAIRE DES ROMANCES LESBIENNES
// SERVICE WORKER
// ========================================

const CACHE_NAME = "annuaire-romance-v1";

const FICHIERS_A_CACHER = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",

    // Données du catalogue
    "./data/livre.csv",
    "./data/auteurs.csv",
    "./data/ecrits.csv",
    "./data/genres.csv",
    "./data/editeurs.csv"
];


// ========================================
// INSTALLATION
// ========================================

self.addEventListener("install", (event) => {

    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {

            for (const fichier of FICHIERS_A_CACHER) {

                try {
                    const url = new URL(fichier, self.registration.scope);
                    await cache.add(url);

                } catch (erreur) {
                    console.warn(
                        "Impossible de mettre en cache :",
                        fichier,
                        erreur
                    );
                }

            }

        })
    );

});


// ========================================
// ACTIVATION
// ========================================

self.addEventListener("activate", (event) => {

    event.waitUntil(
        caches.keys().then((noms) => {

            return Promise.all(

                noms.map((nom) => {

                    // Supprime uniquement les anciennes versions
                    // du cache de cet annuaire.

                    if (
                        nom.startsWith("annuaire-romance-") &&
                        nom !== CACHE_NAME
                    ) {
                        return caches.delete(nom);
                    }

                })

            );

        }).then(() => self.clients.claim())
    );

});


// ========================================
// REQUÊTES ET MODE HORS LIGNE
// ========================================

self.addEventListener("fetch", (event) => {

    const requete = event.request;

    // Ignore les requêtes autres que GET
    if (requete.method !== "GET") return;

    const url = new URL(requete.url);

    // Ignore les requêtes externes
    if (url.origin !== self.location.origin) return;

    // Ignore les requêtes hors du périmètre du SW
    if (!url.href.startsWith(self.registration.scope)) return;

    event.respondWith(

        fetch(requete)

            .then((reponse) => {

                // Mise en cache des réponses valides
                if (reponse && reponse.status === 200 && reponse.type === "basic") {

                    const copie = reponse.clone();

                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(requete, copie);
                    });

                }

                return reponse;

            })

            .catch(async () => {

                // Recherche dans le cache
                const reponseCache = await caches.match(requete);

                if (reponseCache) {
                    return reponseCache;
                }

                // Secours pour les pages HTML
                if (requete.mode === "navigate") {

                    return await caches.match(
                        new URL("./index.html", self.registration.scope).toString()
                    );

                }

                return new Response(
                    "Contenu indisponible hors ligne.",
                    {
                        status: 503,
                        headers: {
                            "Content-Type": "text/plain; charset=utf-8"
                        }
                    }
                );

            })

    );

});
