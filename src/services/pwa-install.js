// 🪐 Tribbu'sVibe - Gerenciador de Instalação PWA
// Arquivo: src/services/pwa-install.js

let eventoInstalacaoDiferido = null;

export function inicializarInstaladorPWA() {
    // Registra o Service Worker do PWA se suportado
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js").then((reg) => {
            console.log("[PWA] Service Worker registrado com sucesso:", reg.scope);
        }).catch((err) => {
            console.warn("[PWA] Aviso ao registrar Service Worker:", err);
        });
    }

    // Detecta se já está rodando em modo standalone (app instalado)
    const estaInstalado = 
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;

    if (estaInstalado) {
        console.log("[PWA] Tribbu'sVibe já está rodando como App nativo standalone.");
        return;
    }

    // Monitora evento beforeinstallprompt do Chrome/Android/Edge
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        eventoInstalacaoDiferido = e;
        console.log("[PWA] Prompt de instalação pronto.");
        exibirBotaoInstalar();
    });

    window.addEventListener("appinstalled", () => {
        console.log("[PWA] Tribbu'sVibe instalado com sucesso na tela inicial!");
        eventoInstalacaoDiferido = null;
        removerBotaoInstalar();
    });

    // Detecta iOS para orientar caso o usuário queira adicionar à tela de início
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;

    if (isIOS && !estaInstalado) {
        // Se estiver no iOS Safari, exibe botão discreto com guia
        exibirBotaoInstalarIOS();
    }
}

function exibirBotaoInstalar() {
    if (document.getElementById("btn-pwa-instalar-flutuante")) return;

    const nav = document.querySelector(".nav-links") || document.querySelector(".navbar");
    if (!nav) return;

    const btn = document.createElement("button");
    btn.id = "btn-pwa-instalar-flutuante";
    btn.innerHTML = `<i class="fas fa-download"></i> <span>Instalar App</span>`;
    btn.style.cssText = `
        background: var(--gradient-supremo, linear-gradient(135deg, #FF007F, #00F0FF));
        color: #fff;
        border: none;
        padding: 6px 14px;
        border-radius: 50px;
        font-size: 0.8rem;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 0 12px rgba(0, 240, 255, 0.4);
        transition: transform 0.2s ease;
        margin-left: 10px;
    `;

    btn.onmouseover = () => { btn.style.transform = "scale(1.05)"; };
    btn.onmouseout = () => { btn.style.transform = "scale(1)"; };

    btn.onclick = async () => {
        if (!eventoInstalacaoDiferido) return;
        btn.disabled = true;
        await eventoInstalacaoDiferido.prompt();
        const escolha = await eventoInstalacaoDiferido.userChoice;
        if (escolha.outcome === "accepted") {
            removerBotaoInstalar();
        }
        btn.disabled = false;
        eventoInstalacaoDiferido = null;
    };

    nav.appendChild(btn);
}

function exibirBotaoInstalarIOS() {
    if (document.getElementById("btn-pwa-instalar-ios")) return;

    const nav = document.querySelector(".nav-links") || document.querySelector(".navbar");
    if (!nav) return;

    const btn = document.createElement("button");
    btn.id = "btn-pwa-instalar-ios";
    btn.innerHTML = `<i class="fas fa-plus-square"></i> <span>Instalar</span>`;
    btn.style.cssText = `
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        border: 1px solid var(--ciano-neon, #00F0FF);
        padding: 6px 12px;
        border-radius: 50px;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-left: 10px;
    `;

    btn.onclick = () => {
        alert("📲 Para instalar o Tribbu'sVibe no iPhone/iPad:\n\n1. Toque no botão de Compartilhar (ícone com quadrado e seta para cima no Safari)\n2. Role para baixo e selecione 'Adicionar à Tela de Início'\n3. Pronto! O app aparecerá com o ícone oficial da Tribo.");
    };

    nav.appendChild(btn);
}

function removerBotaoInstalar() {
    const btn = document.getElementById("btn-pwa-instalar-flutuante");
    if (btn) btn.remove();
}

if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inicializarInstaladorPWA);
    } else {
        inicializarInstaladorPWA();
    }
}
