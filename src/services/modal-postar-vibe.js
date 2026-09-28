// 🪐 Tribbu'sVibe - Modal Unificado e Neon para Lançar Vibes (Stories)
// Suporta: Foto/Galeria, Áudio/Música (Upload ou Gravação de Voz), e Vídeo (Galeria ou Câmera)
// Arquivo: src/services/modal-postar-vibe.js

import { postarStoryComunidade } from "./firebase-stories.js";
import { redimensionarEComprimirImagem, fazerUploadDeAudio } from "./firebase-storage.js";
import { auth } from "./tribbusFirebase.js";

let modalElement = null;
let mediaRecorderVoz = null;
let gravadorVideo = null;
let chunksAudioGravado = [];
let chunksVideoGravado = [];
let streamCameraAtiva = null;

export function abrirModalPostarVibe(triboId = "geral", callbackSucesso = null) {
    garantirModalVibe();
    configurarEventosModal(triboId, callbackSucesso);
    modalElement.style.display = "flex";
}

export function fecharModalPostarVibe() {
    if (modalElement) {
        modalElement.style.display = "none";
        pararStreams();
        resetarFormulario();
    }
}

function pararStreams() {
    if (streamCameraAtiva) {
        streamCameraAtiva.getTracks().forEach(track => track.stop());
        streamCameraAtiva = null;
    }
}

function garantirModalVibe() {
    if (modalElement) return;

    modalElement = document.createElement("div");
    modalElement.id = "tribbus-modal-postar-vibe";
    modalElement.style.cssText = `
        display: none;
        position: fixed;
        top: 0; left: 0;
        width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.88);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 99999;
        align-items: center; justify-content: center;
        padding: 16px; box-sizing: border-box;
    `;

    modalElement.innerHTML = `
        <div style="
            position: relative;
            width: 100%;
            max-width: 480px;
            max-height: 90vh;
            background: #121214;
            border: 1px solid rgba(0, 240, 255, 0.4);
            box-shadow: 0 0 30px rgba(0, 240, 255, 0.25), 0 0 50px rgba(255, 0, 127, 0.2);
            border-radius: 20px;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            color: #FFFFFF;
            font-family: inherit;
        ">
            <!-- Topo -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.08);">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.3rem;">✨</span>
                    <h3 style="margin: 0; font-size: 1.1rem; color: #FFFFFF; font-weight: 700;">Lançar Vibe na Tribo (24h)</h3>
                </div>
                <button id="btn-fechar-modal-vibe" style="background: rgba(255,255,255,0.1); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 1rem;">✕</button>
            </div>

            <!-- Seleção de Abas (Foto, Trilha Sonora/Áudio, Vídeo, Texto) -->
            <div style="display: flex; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.3); overflow-x: auto;">
                <button class="tab-vibe-btn active" data-tab="foto" style="flex: 1; padding: 12px 8px; background: none; border: none; border-bottom: 2px solid #00F0FF; color: #00F0FF; font-weight: bold; font-size: 0.85rem; cursor: pointer; white-space: nowrap;">
                    📸 Foto
                </button>
                <button class="tab-vibe-btn" data-tab="audio" style="flex: 1; padding: 12px 8px; background: none; border: none; border-bottom: 2px solid transparent; color: #9AA0A6; font-weight: bold; font-size: 0.85rem; cursor: pointer; white-space: nowrap;">
                    🎵 Áudio / Música
                </button>
                <button class="tab-vibe-btn" data-tab="video" style="flex: 1; padding: 12px 8px; background: none; border: none; border-bottom: 2px solid transparent; color: #9AA0A6; font-weight: bold; font-size: 0.85rem; cursor: pointer; white-space: nowrap;">
                    🎥 Vídeo
                </button>
                <button class="tab-vibe-btn" data-tab="texto" style="flex: 1; padding: 12px 8px; background: none; border: none; border-bottom: 2px solid transparent; color: #9AA0A6; font-weight: bold; font-size: 0.85rem; cursor: pointer; white-space: nowrap;">
                    ✍️ Texto Neon
                </button>
            </div>

            <div style="padding: 20px;">
                <!-- ABA 1: FOTO -->
                <div id="vibe-painel-foto" class="vibe-painel" style="display: block;">
                    <label style="display: block; font-size: 0.85rem; color: #9AA0A6; margin-bottom: 8px;">Escolha uma imagem da galeria ou tire uma foto:</label>
                    <input type="file" id="input-arquivo-foto" accept="image/*" style="display: none;">
                    <button type="button" id="btn-selecionar-foto" style="width: 100%; padding: 16px; border: 2px dashed rgba(0, 240, 255, 0.4); border-radius: 12px; background: rgba(0, 240, 255, 0.05); color: #00F0FF; font-weight: bold; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                        <span style="font-size: 1.8rem;">🖼️</span>
                        <span>Toque para Escolher Foto</span>
                    </button>
                    <div id="preview-foto-container" style="display: none; margin-top: 15px; text-align: center;">
                        <img id="preview-foto-img" style="max-width: 100%; max-height: 220px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); object-fit: contain;">
                    </div>
                </div>

                <!-- ABA 2: ÁUDIO & MÚSICA -->
                <div id="vibe-painel-audio" class="vibe-painel" style="display: none;">
                    <label style="display: block; font-size: 0.85rem; color: #9AA0A6; margin-bottom: 12px;">Compartilhe uma música ou grave sua voz:</label>
                    
                    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                        <button type="button" id="btn-upload-audio-musica" style="flex: 1; padding: 14px; background: rgba(255, 0, 127, 0.1); border: 1px solid #FF007F; color: #FF007F; border-radius: 10px; font-weight: bold; font-size: 0.85rem; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                            <span style="font-size: 1.4rem;">📁</span>
                            <span>Música / Áudio da Galeria</span>
                        </button>
                        <input type="file" id="input-arquivo-audio" accept="audio/*" style="display: none;">

                        <button type="button" id="btn-gravar-voz" style="flex: 1; padding: 14px; background: rgba(0, 240, 255, 0.1); border: 1px solid #00F0FF; color: #00F0FF; border-radius: 10px; font-weight: bold; font-size: 0.85rem; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                            <span style="font-size: 1.4rem;" id="icone-btn-gravar">🎙️</span>
                            <span id="texto-btn-gravar">Gravar Voz</span>
                        </button>
                    </div>

                    <div id="preview-audio-container" style="display: none; padding: 12px; background: rgba(255,255,255,0.04); border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); margin-top: 10px;">
                        <p id="label-audio-nome" style="font-size: 0.8rem; color: #00F0FF; margin: 0 0 6px 0;">Áudio pronto para envio</p>
                        <audio id="player-audio-preview" controls style="width: 100%; height: 36px;"></audio>
                    </div>
                </div>

                <!-- ABA 3: VÍDEO -->
                <div id="vibe-painel-video" class="vibe-painel" style="display: none;">
                    <label style="display: block; font-size: 0.85rem; color: #9AA0A6; margin-bottom: 12px;">Envie um vídeo da galeria ou grave agora com a câmera:</label>

                    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                        <button type="button" id="btn-upload-video-galeria" style="flex: 1; padding: 14px; background: rgba(0, 240, 255, 0.1); border: 1px solid #00F0FF; color: #00F0FF; border-radius: 10px; font-weight: bold; font-size: 0.85rem; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                            <span style="font-size: 1.4rem;">🎬</span>
                            <span>Vídeo da Galeria</span>
                        </button>
                        <input type="file" id="input-arquivo-video" accept="video/*" style="display: none;">

                        <button type="button" id="btn-abrir-camera-video" style="flex: 1; padding: 14px; background: rgba(255, 0, 127, 0.1); border: 1px solid #FF007F; color: #FF007F; border-radius: 10px; font-weight: bold; font-size: 0.85rem; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                            <span style="font-size: 1.4rem;" id="icone-btn-camera">📹</span>
                            <span id="texto-btn-camera">Gravar na Hora</span>
                        </button>
                    </div>

                    <!-- Container da Câmera ao vivo para gravação -->
                    <div id="camera-stream-container" style="display: none; margin-bottom: 12px; position: relative;">
                        <video id="video-stream-camera" autoplay playsinline muted style="width: 100%; max-height: 220px; border-radius: 10px; background: #000; object-fit: cover;"></video>
                        <button type="button" id="btn-iniciar-parar-rec-video" style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: #FF007F; color: #fff; border: none; padding: 8px 18px; border-radius: 20px; font-weight: bold; cursor: pointer; box-shadow: 0 0 10px rgba(255,0,127,0.5);">
                            🔴 Gravar
                        </button>
                    </div>

                    <!-- Preview do Vídeo Carregado ou Gravado -->
                    <div id="preview-video-container" style="display: none; margin-top: 10px; text-align: center;">
                        <video id="player-video-preview" controls playsinline style="width: 100%; max-height: 220px; border-radius: 10px; background: #000;"></video>
                    </div>
                </div>

                <!-- ABA 4: TEXTO NEON -->
                <div id="vibe-painel-texto" class="vibe-painel" style="display: none;">
                    <label style="display: block; font-size: 0.85rem; color: #9AA0A6; margin-bottom: 8px;">Escreva uma mensagem rápida de 24h:</label>
                    <textarea id="texto-vibe-input" placeholder="Qual é a vibe da sua Tribo agora?" maxlength="200" style="width: 100%; height: 90px; background: #1a1a24; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 12px; color: #fff; resize: none; font-size: 1rem; box-sizing: border-box;"></textarea>
                </div>

                <!-- Legenda opcional para Foto / Áudio / Vídeo -->
                <div id="container-legenda-opcional" style="margin-top: 15px;">
                    <input type="text" id="legenda-vibe-input" placeholder="Adicionar legenda / título (opcional)..." maxlength="80" style="width: 100%; background: #181820; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 10px 14px; color: #fff; font-size: 0.9rem; box-sizing: border-box;">
                </div>

                <!-- Botão Postar -->
                <div style="margin-top: 20px;">
                    <button type="button" id="btn-enviar-vibe-final" style="width: 100%; padding: 14px; background: linear-gradient(135deg, #00F0FF 0%, #FF007F 100%); border: none; border-radius: 30px; color: #FFFFFF; font-weight: 800; font-size: 1rem; cursor: pointer; box-shadow: 0 0 20px rgba(0, 240, 255, 0.4); display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <span>🚀 Lançar Vibe de 24h</span>
                    </button>
                    <div id="status-envio-vibe" style="display: none; text-align: center; margin-top: 10px; font-size: 0.85rem; color: #00F0FF;">Enviando sua vibe...</div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modalElement);
}

let dadoVibeAtivo = null;
let tipoVibeAtivo = "foto";

function configurarEventosModal(triboId, callbackSucesso) {
    const modal = modalElement;
    const btnFechar = modal.querySelector("#btn-fechar-modal-vibe");
    btnFechar.onclick = fecharModalPostarVibe;

    // Alternância de Abas
    const tabBtns = modal.querySelectorAll(".tab-vibe-btn");
    const paineis = modal.querySelectorAll(".vibe-painel");

    tabBtns.forEach(btn => {
        btn.onclick = () => {
            tabBtns.forEach(b => {
                b.classList.remove("active");
                b.style.borderColor = "transparent";
                b.style.color = "#9AA0A6";
            });
            paineis.forEach(p => p.style.display = "none");

            btn.classList.add("active");
            btn.style.borderColor = "#00F0FF";
            btn.style.color = "#00F0FF";

            const tab = btn.getAttribute("data-tab");
            tipoVibeAtivo = tab;
            const painelAlvo = modal.querySelector(`#vibe-painel-${tab}`);
            if (painelAlvo) painelAlvo.style.display = "block";

            // Se mudou de aba, para streams de gravação em andamento
            pararStreams();
            const camContainer = modal.querySelector("#camera-stream-container");
            if (camContainer) camContainer.style.display = "none";
        };
    });

    // 📸 ABA FOTO
    const btnSelFoto = modal.querySelector("#btn-selecionar-foto");
    const inputFoto = modal.querySelector("#input-arquivo-foto");
    const previewFotoContainer = modal.querySelector("#preview-foto-container");
    const previewFotoImg = modal.querySelector("#preview-foto-img");

    btnSelFoto.onclick = () => inputFoto.click();
    inputFoto.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const dataUrl = await redimensionarEComprimirImagem(file, 1080, 0.72);
            dadoVibeAtivo = dataUrl;
            previewFotoImg.src = dataUrl;
            previewFotoContainer.style.display = "block";
        } catch (err) {
            console.error("Erro ao carregar foto:", err);
        }
    };

    // 🎵 ABA ÁUDIO & MÚSICA
    const btnUploadAudio = modal.querySelector("#btn-upload-audio-musica");
    const inputAudio = modal.querySelector("#input-arquivo-audio");
    const btnGravarVoz = modal.querySelector("#btn-gravar-voz");
    const previewAudioContainer = modal.querySelector("#preview-audio-container");
    const playerAudioPreview = modal.querySelector("#player-audio-preview");
    const labelAudioNome = modal.querySelector("#label-audio-nome");

    btnUploadAudio.onclick = () => inputAudio.click();
    inputAudio.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const dataUrl = await fazerUploadDeAudio(file);
            dadoVibeAtivo = dataUrl;
            labelAudioNome.textContent = `🎵 Música: ${file.name}`;
            playerAudioPreview.src = dataUrl;
            previewAudioContainer.style.display = "block";
        } catch (err) {
            console.error("Erro ao carregar áudio de música:", err);
        }
    };

    // Gravação de microfone
    btnGravarVoz.onclick = async () => {
        if (mediaRecorderVoz && mediaRecorderVoz.state === "recording") {
            mediaRecorderVoz.stop();
            btnGravarVoz.querySelector("#icone-btn-gravar").textContent = "🎙️";
            btnGravarVoz.querySelector("#texto-btn-gravar").textContent = "Gravar Voz";
            btnGravarVoz.style.background = "rgba(0, 240, 255, 0.1)";
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                chunksAudioGravado = [];
                mediaRecorderVoz = new MediaRecorder(stream);
                mediaRecorderVoz.ondataavailable = (e) => {
                    if (e.data.size > 0) chunksAudioGravado.push(e.data);
                };
                mediaRecorderVoz.onstop = async () => {
                    stream.getTracks().forEach(t => t.stop());
                    const audioBlob = new Blob(chunksAudioGravado, { type: "audio/webm" });
                    const dataUrl = await fazerUploadDeAudio(audioBlob);
                    dadoVibeAtivo = dataUrl;
                    labelAudioNome.textContent = "🎙️ Gravação de Voz Concluída";
                    playerAudioPreview.src = dataUrl;
                    previewAudioContainer.style.display = "block";
                };
                mediaRecorderVoz.start();
                btnGravarVoz.querySelector("#icone-btn-gravar").textContent = "⏹️";
                btnGravarVoz.querySelector("#texto-btn-gravar").textContent = "Parar Gravação";
                btnGravarVoz.style.background = "rgba(255, 0, 127, 0.25)";
            } catch (err) {
                alert("Permissão de microfone necessária para gravar áudio.");
                console.error(err);
            }
        }
    };

    // 🎥 ABA VÍDEO
    const btnUploadVideo = modal.querySelector("#btn-upload-video-galeria");
    const inputVideo = modal.querySelector("#input-arquivo-video");
    const btnAbrirCamera = modal.querySelector("#btn-abrir-camera-video");
    const cameraContainer = modal.querySelector("#camera-stream-container");
    const videoStreamEl = modal.querySelector("#video-stream-camera");
    const btnRecVideo = modal.querySelector("#btn-iniciar-parar-rec-video");
    const previewVideoContainer = modal.querySelector("#preview-video-container");
    const playerVideoPreview = modal.querySelector("#player-video-preview");

    btnUploadVideo.onclick = () => inputVideo.click();
    inputVideo.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            dadoVibeAtivo = reader.result;
            playerVideoPreview.src = reader.result;
            previewVideoContainer.style.display = "block";
        };
        reader.readAsDataURL(file);
    };

    // Gravação com Câmera
    btnAbrirCamera.onclick = async () => {
        try {
            cameraContainer.style.display = "block";
            previewVideoContainer.style.display = "none";
            streamCameraAtiva = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
                audio: true
            });
            videoStreamEl.srcObject = streamCameraAtiva;
        } catch (err) {
            alert("Não foi possível acessar a câmera do dispositivo.");
            console.error(err);
        }
    };

    btnRecVideo.onclick = () => {
        if (gravadorVideo && gravadorVideo.state === "recording") {
            gravadorVideo.stop();
            btnRecVideo.textContent = "🔴 Gravar";
            btnRecVideo.style.background = "#FF007F";
            pararStreams();
            cameraContainer.style.display = "none";
        } else if (streamCameraAtiva) {
            chunksVideoGravado = [];
            gravadorVideo = new MediaRecorder(streamCameraAtiva);
            gravadorVideo.ondataavailable = (e) => {
                if (e.data.size > 0) chunksVideoGravado.push(e.data);
            };
            gravadorVideo.onstop = () => {
                const videoBlob = new Blob(chunksVideoGravado, { type: "video/webm" });
                const reader = new FileReader();
                reader.onloadend = () => {
                    dadoVibeAtivo = reader.result;
                    playerVideoPreview.src = reader.result;
                    previewVideoContainer.style.display = "block";
                };
                reader.readAsDataURL(videoBlob);
            };
            gravadorVideo.start();
            btnRecVideo.textContent = "⏹️ Parar Gravação";
            btnRecVideo.style.background = "#00F0FF";
        }
    };

    // 🚀 ENVIO FINAL
    const btnEnviar = modal.querySelector("#btn-enviar-vibe-final");
    const statusEnvio = modal.querySelector("#status-envio-vibe");
    const inputTexto = modal.querySelector("#texto-vibe-input");
    const inputLegenda = modal.querySelector("#legenda-vibe-input");

    btnEnviar.onclick = async () => {
        let conteudoFinal = null;
        let tipoFinal = tipoVibeAtivo;

        if (tipoFinal === "texto") {
            conteudoFinal = inputTexto.value.trim();
            if (!conteudoFinal) {
                alert("Por favor, digite o texto da sua vibe.");
                return;
            }
        } else {
            conteudoFinal = dadoVibeAtivo;
            if (!conteudoFinal) {
                alert("Selecione ou grave uma mídia para lançar sua vibe.");
                return;
            }
        }

        btnEnviar.disabled = true;
        btnEnviar.style.opacity = "0.6";
        statusEnvio.style.display = "block";
        statusEnvio.textContent = "Publicando no Mural de Vibes...";

        try {
            const usuario = auth?.currentUser;
            const uid = usuario?.uid || "anonimo";
            const nomeAutor = usuario?.displayName || "Membro da Tribo";
            const fotoAutor = usuario?.photoURL || "";

            await postarStoryComunidade(uid, triboId, tipoFinal === "foto" ? conteudoFinal : "", {
                tipo: tipoFinal,
                dado_conteudo: conteudoFinal,
                media_url: tipoFinal !== "texto" ? conteudoFinal : "",
                texto_vibe: tipoFinal === "texto" ? conteudoFinal : inputLegenda.value.trim(),
                autor_nome: nomeAutor,
                autor_avatar: fotoAutor
            });

            statusEnvio.textContent = "🎉 Vibe lançada com sucesso!";
            setTimeout(() => {
                fecharModalPostarVibe();
                if (callbackSucesso) callbackSucesso();
            }, 600);
        } catch (err) {
            console.error("Erro ao postar vibe:", err);
            statusEnvio.textContent = "Erro ao enviar a vibe. Tente novamente.";
            btnEnviar.disabled = false;
            btnEnviar.style.opacity = "1";
        }
    };
}

function resetarFormulario() {
    dadoVibeAtivo = null;
    tipoVibeAtivo = "foto";
    if (!modalElement) return;

    const previewFotoContainer = modalElement.querySelector("#preview-foto-container");
    const previewAudioContainer = modalElement.querySelector("#preview-audio-container");
    const previewVideoContainer = modalElement.querySelector("#preview-video-container");
    const cameraContainer = modalElement.querySelector("#camera-stream-container");
    const statusEnvio = modalElement.querySelector("#status-envio-vibe");
    const btnEnviar = modalElement.querySelector("#btn-enviar-vibe-final");
    const inputTexto = modalElement.querySelector("#texto-vibe-input");
    const inputLegenda = modalElement.querySelector("#legenda-vibe-input");

    if (previewFotoContainer) previewFotoContainer.style.display = "none";
    if (previewAudioContainer) previewAudioContainer.style.display = "none";
    if (previewVideoContainer) previewVideoContainer.style.display = "none";
    if (cameraContainer) cameraContainer.style.display = "none";
    if (statusEnvio) statusEnvio.style.display = "none";
    if (btnEnviar) {
        btnEnviar.disabled = false;
        btnEnviar.style.opacity = "1";
    }
    if (inputTexto) inputTexto.value = "";
    if (inputLegenda) inputLegenda.value = "";
}
