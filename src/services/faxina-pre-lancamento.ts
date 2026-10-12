// 🪐 Tribbu'sVibe - Executor da Faxina Pré-Lançamento
// Arquivo de script utilitário temporário

import { zerarBancoTribbusVibe } from './zerar-banco.js';

export async function executarFaxinaGeral(): Promise<void> {
  const confirmar = confirm("🚨 ATENÇÃO CEO: Tem certeza que deseja apagar TODOS os dados de teste e zerar o Firebase do Tribbu'sVibe por completo?");
  
  if (confirmar) {
    console.log("🧹 [Tribbu'sVibe] Iniciando limpeza pré-lançamento do Firestore...");
    const resultado = await zerarBancoTribbusVibe();
    if (resultado.sucesso) {
      alert(`🧹 Limpeza concluída com sucesso absoluto!\n\nForam apagados ${resultado.totalApagados} registros de teste.\nO banco está pronto para o público real.`);
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } else {
      alert(`❌ Falha na limpeza: ${resultado.erro}`);
    }
  }
}

// Deixa a função engatada no window para rodar no console ou por botões
if (typeof window !== 'undefined') {
  (window as unknown as { executarFaxinaGeral: typeof executarFaxinaGeral }).executarFaxinaGeral = executarFaxinaGeral;
}

export default executarFaxinaGeral;
