import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `isSsrBuild`: the second build (`vite build --ssr`) produces the server
// entry used by scripts/prerender.mjs. It needs no chunking or minification.
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    fs: {
      strict: false,
      allow: [fileURLToPath(new URL('.', import.meta.url))],
    },
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
  build: isSsrBuild
    ? { outDir: 'dist-ssr', sourcemap: false, target: 'node20', minify: false, emptyOutDir: true }
    : {
        outDir: 'dist',
        sourcemap: false,
        target: 'es2022',
        cssCodeSplit: true,
        chunkSizeWarningLimit: 700,
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
                return 'react'
              }
            },
          },
        },
      },
}))