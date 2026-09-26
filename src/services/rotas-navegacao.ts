// 🪐 Tribbu'sVibe - Sistema de Rotas e Navegação Fluida
// Arquivo: rotas-navegacao.ts

type Rota = 'home' | 'acesso' | 'tribos' | 'perfil' | '404';
type RotaListener = (rota: Rota) => void;

class SistemaRotasTribbusVibe {
  private static listeners: Set<RotaListener> = new Set();
  private static rotaAtual: Rota = 'acesso';

  /**
   * 🚀 Redireciona para o Feed / Home do app
   */
  static irParaHome() {
    this.navegar('home');
  }

  /**
   * 🚪 Redireciona de volta para a tela de Acesso / Login
   */
  static irParaAcesso() {
    this.navegar('acesso');
  }

  /**
   * 🧭 Redireciona para o Explorador de Tribos / Comunidades
   */
  static irParaTribos() {
    this.navegar('tribos');
  }

  /**
   * 👤 Redireciona para o Perfil Completo
   */
  static irParaPerfil() {
    this.navegar('perfil');
  }

  /**
   * 🌌 Redireciona para a tela de 404 personalizada
   */
  static irPara404() {
    this.navegar('404');
  }

  /**
   * Registra um ouvinte para sincronizar com os estados do React
   */
  static escutar(listener: RotaListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Retorna a rota atual
   */
  static getRotaAtual(): Rota {
    return this.rotaAtual;
  }

  private static navegar(novaRota: Rota) {
    this.rotaAtual = novaRota;
    this.listeners.forEach((listener) => {
      try {
        listener(novaRota);
      } catch (err) {
        console.error('[RotasTribbusVibe] Erro ao notificar ouvinte de rota:', err);
      }
    });
  }
}

export const RotasTribbusVibe = SistemaRotasTribbusVibe;
export default SistemaRotasTribbusVibe;
