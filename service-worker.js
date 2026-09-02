const CACHE_NAME = "roulette-cache-v1";

const BASE = self.registration.scope;

const FILES_TO_CACHE = [
    BASE,
    `${BASE}index.html`,
    `${BASE}style.css`,
    `${BASE}script.js`,
    `${BASE}manifest.json`,
    `${BASE}icon.png`
];


/* 最初に必要なファイルをiPhone内へ保存 */
self.addEventListener("install", event => {

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))
    );

    self.skipWaiting();
});


/* 古いキャッシュを削除 */
self.addEventListener("activate", event => {

    event.waitUntil(
        caches.keys().then(cacheNames => {

            return Promise.all(
                cacheNames.map(cacheName => {

                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }

                })
            );

        })
    );

    self.clients.claim();
});


/* ネットがあれば最新版、なければ保存済みを使う */
self.addEventListener("fetch", event => {

    if (event.request.method !== "GET") {
        return;
    }

    event.respondWith(

        fetch(event.request)
            .then(response => {

                const copy = response.clone();

                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, copy);
                    });

                return response;

            })
            .catch(() => {

                return caches.match(event.request)
                    .then(cachedResponse => {

                        if (cachedResponse) {
                            return cachedResponse;
                        }

                        return caches.match(`${BASE}index.html`);
                    });

            })

    );

});