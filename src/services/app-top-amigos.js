// 🪐 Tribbu'sVibe - Encanamento da Vitrine de Amigos Favoritos
// Arquivo: app-top-amigos.js

import { escutarVitrineAmigos } from "./firebase-top-amigos.js";

export function inicializarVitrineAmigosLateral(uidOverride) {
    const containerGradeAmigos = document.getElementById("grade-favoritos-lateral");
    const contadorAmigos = document.getElementById("lbl-total-favoritos");
    const meuUID = uidOverride || auth?.currentUser?.uid || "";

    if (!containerGradeAmigos) return () => {};

    // 🔄 ESCUTA A VITRINE EM TEMPO REAL
    return escutarVitrineAmigos(meuUID, (amigosFavoritos) => {
        // Reseta o container visual da barra lateral
        containerGradeAmigos.innerHTML = "";
        
        // Atualiza a contagem total de amigos na vitrine
        if (contadorAmigos) {
            contadorAmigos.innerText = `(${amigosFavoritos.length})`;
        }

        if (amigosFavoritos.length === 0) {
            containerGradeAmigos.innerHTML = `<p style="font-size:0.8rem; color:var(--texto-suave, #9AA0A6); font-style:italic; grid-column: 1/-1;">Nenhum favorito fixado ainda. 🪐</p>`;
            return;
        }

        // Injeta cada amigo favoritado na grade infinita
        amigosFavoritos.forEach((amigo) => {
            const avatarContent = amigo.amigo_avatar && amigo.amigo_avatar.startsWith('http')
                ? `<img src="${escapeHTML(amigo.amigo_avatar)}" alt="${escapeHTML(amigo.amigo_nome)}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover;" />`
                : `<span style="font-size: 1.3rem;">${escapeHTML(amigo.amigo_avatar || '👤')}</span>`;

            containerGradeAmigos.innerHTML += `
                <div class="membro-avatar-mini" title="${escapeHTML(amigo.amigo_nome)}" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4px; border-radius: 8px; border: 2px solid var(--ciano-neon, #00F0FF); filter: drop-shadow(0 0 3px var(--ciano-neon, #00F0FF)); cursor: pointer; transition: transform 0.2s;">
                    ${avatarContent}
                    <span style="font-size: 0.65rem; color: var(--branco, #FFFFFF); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; text-align: center; margin-top: 2px;">${escapeHTML(amigo.amigo_nome)}</span>
                </div>
            `;
        });
    });
}

function escapeHTML(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

if (typeof window !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => inicializarVitrineAmigosLateral());
    } else {
        inicializarVitrineAmigosLateral();
    }
}

export default {
    inicializarVitrineAmigosLateral
};
