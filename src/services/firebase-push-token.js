// 🪐 Tribbu'sVibe - Gerenciador de Permissão e Captura de Tokens Push
// Arquivo: src/services/firebase-push-token.js

import { db, app } from "./tribbusFirebase.js";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";

// Chave VAPID pública oficial do Firebase Cloud Messaging
export const VAPID_KEY_OFICIAL = "BDGQidEiJnoJtNRavt7KCsNPvGO6ZjCT2iW5VBo7OHbV-3KuMEHSDiQMCLfJvlbQornodar_gVinBomay8rpMr0";

/**
 * 🔒 ATIVAR NOTIFICAÇÕES: Pede permissão ao usuário e salva o Token do dispositivo no Firestore
 * @param {string} usuarioLogadoUid - O UID do membro logado na sessão ativa
 * @param {string} [chaveVapid] - Chave VAPID pública opcional (padrão: VAPID_KEY_OFICIAL)
 */
export async function inicializarEGuardarTokenPush(usuarioLogadoUid, chaveVapid = VAPID_KEY_OFICIAL) {
    try {
        if (!usuarioLogadoUid) {
            console.warn("⚠️ Nenhum UID fornecido para salvar o token push.");
            return { sucesso: false, erro: "UID não fornecido" };
        }

        // Verifica suporte no navegador/dispositivo
        if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
            console.warn("⚠️ Notificações push não suportadas neste ambiente.");
            return { sucesso: false, erro: "Ambiente não suporta push notifications" };
        }

        const suportaMessaging = await isSupported().catch(() => false);
        if (!suportaMessaging) {
            console.warn("⚠️ Firebase Messaging não suportado neste navegador.");
            return { sucesso: false, erro: "Firebase Messaging não suportado" };
        }

        console.log("Pedindo autorização para notificações na órbita da Tribo...");
        
        // 1. Solicita a permissão nativa do sistema operacional ou navegador
        const permissao = await Notification.requestPermission();
        
        if (permissao !== "granted") {
            console.warn("⚠️ O usuário recusou a permissão de notificações push.");
            return { sucesso: false, erro: "Permissão negada" };
        }

        console.log("Permissão concedida! Gerando chave de endereço único (FCM Token)...");

        const messaging = getMessaging(app);

        // Registra o Service Worker do FCM se ainda não estiver registrado
        let swRegistration = undefined;
        try {
            swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        } catch (swErr) {
            console.warn("Aviso ao registrar SW para push:", swErr);
        }

        // 2. Busca o token gerado pelo servidor do Google FCM com a chave VAPID oficial
        const tokenDispositivo = await getToken(messaging, {
            serviceWorkerRegistration: swRegistration,
            vapidKey: chaveVapid || VAPID_KEY_OFICIAL
        });

        if (!tokenDispositivo) {
            console.warn("⚠️ Nenhum Token de dispositivo foi gerado.");
            return { sucesso: false, erro: "Token vazio" };
        }

        console.log("Sucesso! Token capturado com segurança:", tokenDispositivo);

        // 3. Atualiza o documento do usuário inserindo o endereço na gaveta do banco de dados
        const usuarioRef = doc(db, "usuarios", usuarioLogadoUid);
        await updateDoc(usuarioRef, {
            token_push: tokenDispositivo,
            dispositivo_atualizado_em: new Date().toISOString()
        });

        console.log("Endereço sincronizado e atualizado na coleção de usuários do Firestore!");
        return { sucesso: true, token: tokenDispositivo };

    } catch (error) {
        console.error("Erro técnico ao registrar token de push no servidor:", error.message);
        return { sucesso: false, erro: error.message };
    }
}
