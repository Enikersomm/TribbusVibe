import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: false,
      watch: null,
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          login: path.resolve(__dirname, 'login.html'),
          feed: path.resolve(__dirname, 'feed.html'),
          tribos: path.resolve(__dirname, 'tribos.html'),
          perfil: path.resolve(__dirname, 'perfil.html'),
          forum: path.resolve(__dirname, 'forum.html'),
          configuracoes: path.resolve(__dirname, 'configuracoes.html'),
          chat: path.resolve(__dirname, 'chat.html'),
          privacidade: path.resolve(__dirname, 'privacidade.html'),
          splash: path.resolve(__dirname, 'splash.html'),
          criarTribu: path.resolve(__dirname, 'criar-tribu.html'),
        },
      },
    },
  };
});
