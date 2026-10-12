// 🪐 Tribbu'sVibe - Central Suprema de Múltiplos Idiomas
export const dicionarioIdiomas = {
    pt: {
        feed: "Feed",
        messenger: "Messenger",
        fundar_tribu: "Fundar Tribu",
        quem_sou_eu: "Quem sou eu",
        vibe_hoje: "Qual é a sua vibe de hoje?",
        btn_enviar_vibe: "Enviar Vibe",
        trava_idade: "❌ Acesso Negado! O Tribbu'sVibe é exclusivo para jovens a partir de 13 anos. 🪐"
    },
    en: {
        feed: "Feed",
        messenger: "Messenger",
        fundar_tribu: "Found Tribe",
        quem_sou_eu: "About me",
        vibe_hoje: "What is your vibe today?",
        btn_enviar_vibe: "Send Vibe",
        trava_idade: "❌ Access Denied! Tribbu'sVibe is exclusive for youth aged 13 and older. 🪐"
    },
    es: {
        feed: "Inicio",
        messenger: "Messenger",
        fundar_tribu: "Fundar Tribu",
        quem_sou_eu: "Quién soy yo",
        vibe_hoje: "¿Cuál é tu vibe de hoy?",
        btn_enviar_vibe: "Enviar Vibe",
        trava_idade: "❌ ¡Acceso Denegado! Tribbu'sVibe es exclusivo para jóvenes a partir de 13 años. 🪐"
    }
};

/**
 * Retorna o idioma salvo no localStorage ou 'pt' por padrão
 */
export function obterIdiomaAtual() {
    return localStorage.getItem("tribbus_idioma_preferido") || "pt";
}

/**
 * Salva e aplica um novo idioma no sistema
 */
export function definirIdioma(idioma) {
    if (dicionarioIdiomas[idioma]) {
        localStorage.setItem("tribbus_idioma_preferido", idioma);
        aplicarTextosPorIdioma(idioma);
    }
}

/**
 * Aplica os textos dinâmicos de tradução na tela ativa
 */
export function aplicarTextosPorIdioma(idioma = obterIdiomaAtual()) {
    const dict = dicionarioIdiomas[idioma] || dicionarioIdiomas.pt;

    // Atualiza botão ou link de fundar tribo
    document.querySelectorAll(".btn-criar-nav").forEach(el => {
        el.innerHTML = `<i class="fas fa-plus-circle"></i> ${dict.fundar_tribu}`;
    });

    // Atualiza links do feed e messenger
    document.querySelectorAll("nav.nav-links a").forEach(link => {
        const href = link.getAttribute("href") || "";
        if (href.includes("feed.html")) link.innerText = dict.feed;
        if (href.includes("chat.html")) link.innerText = dict.messenger;
    });

    // Atualiza placeholder do feed se presente
    const inputVibe = document.getElementById("input-vibe");
    if (inputVibe) {
        inputVibe.placeholder = dict.vibe_hoje;
    }

    const btnPostar = document.getElementById("btn-postar");
    if (btnPostar) {
        btnPostar.innerText = dict.btn_enviar_vibe;
    }
}

// Inicializa a tradução assim que o DOM carregar
if (typeof window !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
        aplicarTextosPorIdioma();
    });
}
