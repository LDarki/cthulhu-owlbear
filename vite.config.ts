import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
    base: "/cthulhu-owlbear/",
    plugins: [
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': '/src',
        },
    },
    build: {
        rollupOptions: {
          input: {
            main: resolve(__dirname, 'index.html'),
            modal: resolve(__dirname, 'modal.html'),
          },
        },
        outDir: 'dist',
      },
    server: {
        cors: true
    },
})