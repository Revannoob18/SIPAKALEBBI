import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'docs', // Output build akan berada di folder dist
  },
  base: mode === 'production' ? '/SIPAKALEBBI/' : '/', // Gunakan base '/SIPAKALEBBI/' hanya untuk production
}));