/**
 * ============================================================================
 * 🪐 TRIBBUSVIBE - CONTROLADOR DA INTERFACE (app.js)
 * ============================================================================
 * 
 * Este arquivo conecta os elementos visuais do HTML (botões, inputs e formulários)
 * às funções de nuvem do Firebase definidas no arquivo 'firebase-config.js'.
 */

// 1. Importar a função de cadastro do arquivo de configuração do Firebase
import { cadastrarUsuario } from "./firebase-config.js";

// Executar após o carregamento completo do DOM (HTML pronto)
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 [TribbusVibe] Interface conectada e pronta para novas vibes!");

    // 2. Mapeamento dos elementos do formulário de cadastro no HTML
    // Suporta tanto IDs específicos quanto busca semântica no formulário
    const formCadastro = document.getElementById("formCadastro") || document.querySelector("form.form-cadastro");
    const inputNome = document.getElementById("cadNome") || document.getElementById("nome") || document.querySelector("input[name='nome']");
    const inputEmail = document.getElementById("cadEmail") || document.getElementById("email") || document.querySelector("input[name='email']");
    const inputSenha = document.getElementById("cadSenha") || document.getElementById("senha") || document.querySelector("input[name='senha']");
    const inputDataNasc = document.getElementById("cadDataNascimento") || document.getElementById("dataNascimento") || document.querySelector("input[type='date']");
    const btnCadastrar = document.getElementById("btnCadastrar") || document.getElementById("btnCadastro") || document.querySelector("button[type='submit']");
    const divMensagem = document.getElementById("mensagemStatus") || null;

    /**
     * Função auxiliar para exibir mensagens de feedback visual na tela
     */
    function exibirFeedback(texto, tipo = "info") {
        if (divMensagem) {
            divMensagem.textContent = texto;
            divMensagem.className = `status-msg status-${tipo}`;
            divMensagem.style.display = "block";
        } else {
            // Se não houver elemento de status na tela, exibe alerta amigável
            if (tipo === "erro") {
                alert(`⚠️ Ops: ${texto}`);
            } else if (tipo === "sucesso") {
                alert(`🎉 Maravilha: ${texto}`);
            }
        }
    }

    /**
     * Tradução de erros comuns do Firebase Authentication para português amigável
     */
    function traduzirErroFirebase(codigoErro, mensagemPadrao) {
        switch (codigoErro) {
            case "auth/email-already-in-use":
                return "Este e-mail já faz parte do TribbusVibe. Tente fazer login ou use outro e-mail.";
            case "auth/invalid-email":
                return "Por favor, digite um formato de e-mail válido.";
            case "auth/weak-password":
                return "Sua senha deve ter no mínimo 6 caracteres para proteger sua conta.";
            case "auth/network-request-failed":
                return "Erro de conexão com a rede. Verifique sua internet.";
            default:
                return mensagemPadrao || "Não foi possível concluir o cadastro. Tente novamente.";
        }
    }

    /**
     * 3. Controlador do Evento de Cadastro
     */
    async function executarFluxoCadastro(evento) {
        // Impede o recarregamento automático da página ao enviar formulário
        if (evento) evento.preventDefault();

        // Coleta dos valores digitados pelos usuários (removendo espaços extras)
        const nome = inputNome ? inputNome.value.trim() : "";
        const email = inputEmail ? inputEmail.value.trim() : "";
        const senha = inputSenha ? inputSenha.value : "";
        const dataNascimento = inputDataNasc ? inputDataNasc.value : "";

        // 4. Validação básica antes de enviar para o Firebase
        if (!nome) {
            exibirFeedback("Por favor, digite seu nome completo ou apelido.", "erro");
            if (inputNome) inputNome.focus();
            return;
        }

        if (!email) {
            exibirFeedback("Por favor, informe seu e-mail.", "erro");
            if (inputEmail) inputEmail.focus();
            return;
        }

        if (!senha || senha.length < 6) {
            exibirFeedback("A senha precisa ter pelo menos 6 caracteres.", "erro");
            if (inputSenha) inputSenha.focus();
            return;
        }

        if (!dataNascimento) {
            exibirFeedback("Por favor, informe sua data de nascimento.", "erro");
            if (inputDataNasc) inputDataNasc.focus();
            return;
        }

        // 5. Estado de Carregamento (Feedback instantâneo no botão)
        const textoOriginalBtn = btnCadastrar ? btnCadastrar.innerHTML : "";
        if (btnCadastrar) {
            btnCadastrar.disabled = true;
            btnCadastrar.style.opacity = "0.7";
            btnCadastrar.innerHTML = "<span>Sintonizando sua vibe... ⏳</span>";
        }
        exibirFeedback("Criando seu perfil antialgoritmo no TribbusVibe...", "info");

        try {
            // 6. Chamada à função cadastrarUsuario() do Firebase
            const resultado = await cadastrarUsuario(nome, email, senha, dataNascimento);

            if (resultado.sucesso) {
                exibirFeedback(`Bem-vindo(a) à comunidade, ${nome}! 🪐 Perfil criado com sucesso!`, "sucesso");
                
                // Limpar campos do formulário
                if (formCadastro) formCadastro.reset();
                if (inputNome) inputNome.value = "";
                if (inputEmail) inputEmail.value = "";
                if (inputSenha) inputSenha.value = "";
                if (inputDataNasc) inputDataNasc.value = "";

                // Notificar no console com os dados
                console.log("✅ Cadastro finalizado com UID:", resultado.uid);

                // Redirecionamento ou transição (opcional, ajustável ao fluxo da sua página):
                setTimeout(() => {
                    // Exemplo: se houver uma tela de feed ou perfil, pode redirecionar aqui
                    // window.location.href = "perfil.html";
                }, 1500);

            } else {
                // Tratamento de erro retornado pela função do Firebase
                const mensagemAmigavel = traduzirErroFirebase(resultado.codigo, resultado.erro);
                exibirFeedback(mensagemAmigavel, "erro");
            }

        } catch (erroGeral) {
            console.error("❌ Falha inesperada durante o cadastro:", erroGeral);
            exibirFeedback("Ocorreu uma instabilidade momentânea. Tente novamente em instantes.", "erro");
        } finally {
            // Restaura o botão ao seu estado original após o término da requisição
            if (btnCadastrar) {
                btnCadastrar.disabled = false;
                btnCadastrar.style.opacity = "1";
                btnCadastrar.innerHTML = textoOriginalBtn;
            }
        }
    }

    // 7. Adicionar o ouvinte de evento (Event Listener)
    // Se existir o elemento <form>, escuta o 'submit' (funciona também com tecla Enter)
    if (formCadastro) {
        formCadastro.addEventListener("submit", executarFluxoCadastro);
        console.log("📌 Listener ativado: formulário #formCadastro monitorado via submit.");
    } 
    // Fallback: se o botão existir isolado, escuta o 'click' diretamente
    else if (btnCadastrar) {
        btnCadastrar.addEventListener("click", executarFluxoCadastro);
        console.log("📌 Listener ativado: botão #btnCadastrar monitorado via click.");
    } else {
        console.warn("⚠️ Aviso: Elementos do formulário de cadastro não foram localizados na página atual.");
    }
});
