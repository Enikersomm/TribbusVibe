// 🪐 Tribbu'sVibe - Service Worker do PWA
const CACHE_NAME = "tribbus-vibe-cache-v1";
const ARQUIVOS_CACHE = [
  "/index.html",
  "/login.html",
  "/feed.html",
  "/perfil.html",
  "/img/image_p_Y_em.png",
  "/img/image_MfX5Z6.png"
];

// Instala o cache local no celular do usuário
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Usa Promise.allSettled ou addAll defensivo para garantir a instalação sem falha
      return Promise.allSettled(
        ARQUIVOS_CACHE.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[PWA Cache] Aviso ao salvar ${url}:`, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((nomes) => {
      return Promise.all(
        nomes
          .filter((nome) => nome !== CACHE_NAME)
          .map((nome) => caches.delete(nome))
      );
    })
  );
  self.clients.claim();
});

// Responde instantaneamente usando os arquivos salvos se estiver offline
self.addEventListener("fetch", (e) => {
  // Ignora requisições que não sejam GET ou extensões do Chrome
  if (e.request.method !== "GET" || !e.request.url.startsWith("http")) return;

  // Ignora chamadas do Firestore e APIs externas em tempo real
  if (
    e.request.url.includes("firestore.googleapis.com") ||
    e.request.url.includes("identitytoolkit.googleapis.com") ||
    e.request.url.includes("firebase") ||
    e.request.url.includes("/api/")
  ) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((response) => {
      if (response) return response;

      return fetch(e.request).then((networkResponse) => {
        // Se a resposta for válida, armazena no cache para uso offline
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === "basic"
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Se estiver totalmente offline e for navegação de página, tenta entregar index.html
        if (e.request.mode === "navigate") {
          return caches.match("/index.html") || caches.match("/feed.html");
        }
      });
    })
  );
});
