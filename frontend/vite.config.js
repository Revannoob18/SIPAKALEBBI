import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist', // Output build akan berada di folder frontend/dist
  },
  base: '/SIPAKALEBBI/', // Ganti <repository-name> dengan nama repository GitHub Anda
});