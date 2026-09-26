// 🪐 Tribbu'sVibe - Executor da Faxina Pré-Lançamento
// Arquivo de script utilitário temporário

import { zerarBancoTribbusVibe } from "./zerar-banco.js";

async function executarFaxinaGeral() {
    const confirmar = confirm("🚨 ATENÇÃO CEO: Tem certeza que deseja apagar TODOS os dados de teste e zerar o Firebase do Tribbu'sVibe por completo?");
    
    if (confirmar) {
        console.log("🧹 Iniciando limpeza geral do Firebase Tribbu'sVibe...");
        const resultado = await zerarBancoTribbusVibe();
        if (resultado.sucesso) {
            alert(`🧹 Limpeza concluída com sucesso absoluta!\n\nForam apagados ${resultado.totalApagados} registros de teste.\nO banco está pronto para o público real!`);
            // Recarrega a página para refletir estado limpo
            if (typeof window !== 'undefined') {
                window.location.reload();
            }
        } else {
            alert(`❌ Falha na limpeza: ${resultado.erro}`);
        }
    }
}

// Deixa a função engatada para você clicar ou rodar no console
window.executarFaxinaGeral = executarFaxinaGeral;
export { executarFaxinaGeral };
