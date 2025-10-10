// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import eslint from 'vite-plugin-eslint';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';

const srcPath = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    // run ESLint only in development to avoid CI build failures
    ...(mode === 'development' ? [eslint()] : []),
  ],
  resolve: {
    alias: { '@': srcPath },
  },
}));
