// 🪐 Tribbu'sVibe - Visualizador de Stories/Status em Tela Cheia (Modal Neon)
// Arquivo: src/services/story-viewer.js

let visualizadorContainer = null;
let audioPlayerAtivo = null;

function garantirEstruturaVisualizador() {
  if (visualizadorContainer) return visualizadorContainer;

  visualizadorContainer = document.createElement("div");
  visualizadorContainer.id = "tribbus-story-viewer-modal";
  visualizadorContainer.style.cssText = `
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.88);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    z-index: 99999;
    align-items: center;
    justify-content: center;
    padding: 16px;
    box-sizing: border-box;
  `;

  visualizadorContainer.innerHTML = `
    <div id="story-viewer-card" style="
      position: relative;
      width: 100%;
      max-width: 440px;
      max-height: 85vh;
      background: #121214;
      border: 1px solid rgba(0, 240, 255, 0.4);
      box-shadow: 0 0 30px rgba(0, 240, 255, 0.25), 0 0 50px rgba(255, 0, 127, 0.2);
      border-radius: 24px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: storyModalPop 0.25s ease-out;
    ">
      <!-- Barra superior do Story -->
      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 18px;
        background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%);
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        z-index: 10;
      ">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div id="story-viewer-avatar" style="
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: #1e1e24;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
            border: 2px solid #00F0FF;
            overflow: hidden;
          ">👤</div>
          <div>
            <h4 id="story-viewer-autor" style="margin: 0; font-size: 0.95rem; color: #FFFFFF; font-weight: 700;">Membro da Tribo</h4>
            <span id="story-viewer-tempo" style="font-size: 0.75rem; color: #9AA0A6;">Vibe recente</span>
          </div>
        </div>

        <button id="btn-fechar-story-viewer" style="
          background: rgba(255, 255, 255, 0.15);
          border: none;
          color: #FFFFFF;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        " title="Fechar (Esc)">✕</button>
      </div>

      <!-- Área de Conteúdo Visual -->
      <div id="story-viewer-content" style="
        width: 100%;
        min-height: 380px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #000;
        position: relative;
        overflow: hidden;
      ">
        <!-- Injetado dinamicamente: Imagem, Texto estilizado ou Áudio -->
      </div>
    </div>
  `;

  // Animação CSS
  if (!document.getElementById("story-viewer-style")) {
    const styleEl = document.createElement("style");
    styleEl.id = "story-viewer-style";
    styleEl.textContent = `
      @keyframes storyModalPop {
        from { transform: scale(0.92); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(styleEl);
  }

  document.body.appendChild(visualizadorContainer);

  // Eventos de fechamento
  const btnFechar = visualizadorContainer.querySelector("#btn-fechar-story-viewer");
  if (btnFechar) {
    btnFechar.onclick = fecharVisualizadorStory;
  }

  visualizadorContainer.addEventListener("click", (e) => {
    if (e.target === visualizadorContainer) {
      fecharVisualizadorStory();
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && visualizadorContainer.style.display === "flex") {
      fecharVisualizadorStory();
    }
  });

  return visualizadorContainer;
}

export function fecharVisualizadorStory() {
  if (audioPlayerAtivo) {
    audioPlayerAtivo.pause();
    audioPlayerAtivo = null;
  }
  if (visualizadorContainer) {
    visualizadorContainer.style.display = "none";
  }
}

/**
 * Abre o Story de forma visual e profissional
 * @param {Object} storyObj - Dados do story { tipo, dado, autorNome, autorAvatar, tempo, corFundo }
 */
export function abrirVisualizadorStory(storyObj) {
  const container = garantirEstruturaVisualizador();

  if (audioPlayerAtivo) {
    audioPlayerAtivo.pause();
    audioPlayerAtivo = null;
  }

  const {
    tipo = "foto",
    dado = "",
    autorNome = "Membro da Tribo",
    autorAvatar = "👤",
    tempo = "Vibe de 24h",
    corFundo = "#121214"
  } = storyObj;

  const lblAutor = container.querySelector("#story-viewer-autor");
  const lblTempo = container.querySelector("#story-viewer-tempo");
  const lblAvatar = container.querySelector("#story-viewer-avatar");
  const contentArea = container.querySelector("#story-viewer-content");

  if (lblAutor) lblAutor.textContent = autorNome;
  if (lblTempo) lblTempo.textContent = tempo;

  if (lblAvatar) {
    if (typeof autorAvatar === "string" && autorAvatar.startsWith("http")) {
      lblAvatar.innerHTML = `<img src="${autorAvatar}" style="width:100%; height:100%; object-fit:cover;" onerror="this.parentElement.innerText='👤';">`;
    } else {
      lblAvatar.textContent = autorAvatar || "👤";
    }
  }

  const isVideo = (tipo === "video") ||
                  (typeof dado === "string" && (dado.startsWith("data:video/") || dado.includes(".mp4") || dado.includes(".webm") || dado.includes(".mov")));

  const isAudio = (tipo === "musica" || tipo === "audio") ||
                  (typeof dado === "string" && (dado.startsWith("data:audio/") || dado.includes(".mp3") || dado.includes(".wav") || dado.includes(".ogg") || dado.includes(".m4a") || dado.includes(".aac")));

  // Verifica se o dado é imagem (URL http ou base64 data:image)
  const isImage = !isVideo && !isAudio && (
    (tipo === "foto") || 
    (typeof dado === "string" && (dado.startsWith("data:image/") || dado.startsWith("http://") || dado.startsWith("https://")))
  );

  // 🎥 SE FOR CLIPE DE VÍDEO (Estilo TikTok Vertical)
  if (isVideo) {
    contentArea.innerHTML = `
      <div style="position: relative; width: 100%; max-width: 400px; height: 75vh; margin: 0 auto; background: #000; border-radius: 20px; overflow: hidden; border: 2px solid var(--ciano-neon); box-shadow: 0 0 25px rgba(0, 240, 255, 0.4);">
        <video src="${dado}" autoplay controls loop playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
      </div>
    `;
    const vidEl = contentArea.querySelector("video");
    if (vidEl) {
      vidEl.play().catch(e => console.log("Autoplay bloqueado pelo navegador, aguardando clique:", e));
    }
  } 
  // 🎧 SE FOR TRILHA SONORA OU GRAVAÇÃO EM MP3
  else if (isAudio) {
    contentArea.innerHTML = `
      <div style="background: var(--cinza-card); padding: 30px; border-radius: 20px; text-align: center; border: 2px solid #FFD700; box-shadow: 0 0 25px rgba(255, 215, 0, 0.3); display: flex; flex-direction: column; align-items: center; gap: 15px; width: 100%; box-sizing: border-box;">
        <div style="width: 80px; height: 80px; background: var(--cinza-input); border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 2.5rem; color: #FFD700; animation: pulsarLogo 1.5s infinite;">
          <i class="fas fa-compact-disc fa-spin"></i>
        </div>
        <h4 style="color: var(--branco); margin: 0;">Trilha Sonora da Tribo</h4>
        <p style="font-size: 0.85rem; color: var(--texto-suave); margin: 0;">Ouvindo vibe por voz ou música em MP3</p>
        <audio src="${dado}" autoplay controls style="width: 100%; margin-top: 10px; accent-color: #FFD700;"></audio>
      </div>
    `;
    const audioEl = contentArea.querySelector("audio");
    if (audioEl) {
      audioPlayerAtivo = audioEl;
    }
  } 
  // 📝 SE FOR TEXTO NEON OU FOTO COMUM (Fallback seguro)
  else {
    if (tipo === "texto") {
      contentArea.innerHTML = `
        <div style="background: ${corFundo || 'var(--cinza-card)'}; width: 100%; max-width: 400px; height: 60vh; border-radius: 20px; display: flex; justify-content: center; align-items: center; padding: 25px; border: 2px solid var(--pink-magenta); box-shadow: 0 0 25px rgba(255, 0, 127, 0.35); box-sizing: border-box;">
          <h2 style="font-size: 1.8rem; font-weight: 900; text-align: center; background: var(--gradient-supremo); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0;">${escapeHTML(dado)}</h2>
        </div>
      `;
    } else {
      contentArea.innerHTML = `<img src="${dado}" style="width: 100%; max-height: 70vh; border-radius: 16px; object-fit: contain; border: 2px solid var(--ciano-neon);" onerror="this.onerror=null; this.src='/logo.png';" />`;
    }
  }

  container.style.display = "flex";
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
