import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/aozora-viewer/' : '/',
  server: {
    host: true,
    port: 5173
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: ['es2015', 'chrome58', 'firefox57', 'safari11', 'edge16'],
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: []
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    assetsDir: 'assets',
    emptyOutDir: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  esbuild: {
    target: 'es2015'
  }
})