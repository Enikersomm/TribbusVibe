// 🪐 Tribbu'sVibe - Service Worker de Notificações em Segundo Plano
// Arquivo: public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Inicializa o Firebase dentro do Service Worker com as chaves reais do projeto
firebase.initializeApp({
    apiKey: "AIzaSyDFB2j-eRx3f3UvY0c6CQUL_DNsxF1vDl4",
    authDomain: "gen-lang-client-0716024886.firebaseapp.com",
    projectId: "gen-lang-client-0716024886",
    storageBucket: "gen-lang-client-0716024886.firebasestorage.app",
    messagingSenderId: "446606038536",
    appId: "1:446606038536:web:974d776ad2b989a394a3bd"
});

const messaging = firebase.messaging();

// 📥 MONITOR DE SEGUNDO PLANO: Captura o push enviado pelo servidor e monta o balão na tela
messaging.onBackgroundMessage((payload) => {
    console.log("[FCM Service Worker] Notificação recebida em segundo plano:", payload);

    const tituloNotificacao = payload.data?.titulo || payload.notification?.title || "🪐 Tribbu'sVibe";
    const opcoesNotificacao = {
        body: payload.data?.corpo || payload.notification?.body || "Tem novidade na órbita da sua Tribo!",
        icon: "/logo.png", // Logotipo oficial
        badge: "/logo.png", // Ícone para a barra superior
        tag: payload.data?.tag || "vibe-alerta",
        renotify: true,
        data: {
            url: payload.data?.url_destino || "/feed.html" // Redirecionamento ao clicar
        }
    };

    return self.registration.showNotification(tituloNotificacao, opcoesNotificacao);
});

// 🚀 CLIQUE NA NOTIFICAÇÃO: Faz o celular/navegador focar ou abrir a janela correspondente
self.addEventListener('notificationclick', (event) => {
    event.notification.close(); // Fecha o balão para não acumular
    
    const urlDestino = event.notification.data?.url || "/feed.html";
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Se o app já estiver aberto em alguma aba, foca nele
            for (let i = 0; i < windowClients.length; i++) {
                let client = windowClients[i];
                if (client.url.includes(urlDestino) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Se o app estiver fechado ou em outra aba, abre direto na tela desejada
            if (clients.openWindow) {
                return clients.openWindow(urlDestino);
            }
        })
    );
});
