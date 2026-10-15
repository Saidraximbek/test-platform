import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'firebase/app': path.resolve(__dirname, './src/lib/serverAdapter/app.ts'),
      'firebase/auth': path.resolve(__dirname, './src/lib/serverAdapter/auth.ts'),
      'firebase/firestore': path.resolve(__dirname, './src/lib/serverAdapter/firestore.ts'),
      'firebase/storage': path.resolve(__dirname, './src/lib/serverAdapter/storage.ts'),
      'firebase/functions': path.resolve(__dirname, './src/lib/serverAdapter/functions.ts'),
      'firebase/app-check': path.resolve(__dirname, './src/lib/serverAdapter/app-check.ts'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
});
