// 🪐 Tribbu'sVibe - Service Worker Oficial do PWA (Estratégia Network-First para Desenvolvimento e Produção)
const CACHE_NAME = "tribbus-vibe-cache-v11";

// Ativação imediata e eliminação de caches obsoletos
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((nomes) => {
      return Promise.all(
        nomes.map((nome) => caches.delete(nome)) // Limpa todos os caches antigos imediatamente
      );
    })
  );
  self.clients.claim();
});

// Estratégia Network-First: Sempre busca a versão mais recente na rede!
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || !e.request.url.startsWith("http")) return;

  // Ignora chamadas em tempo real do Firebase e APIs
  if (
    e.request.url.includes("firestore.googleapis.com") ||
    e.request.url.includes("identitytoolkit.googleapis.com") ||
    e.request.url.includes("firebase") ||
    e.request.url.includes("/api/")
  ) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        // Se a resposta for válida, atualiza o cache em segundo plano
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback offline: se a internet cair, busca do cache
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (e.request.mode === "navigate") {
            return caches.match("/feed.html") || caches.match("/index.html");
          }
        });
      })
  );
});
