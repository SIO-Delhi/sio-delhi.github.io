import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), basicSsl()],
    base: '/',
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Split large vendor libraries into separate chunks
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-clerk': ['@clerk/clerk-react'],
                    'vendor-three': ['three'],
                    'vendor-gsap': ['gsap'],
                    'vendor-tiptap': ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-image', '@tiptap/extension-link', '@tiptap/extension-text-align', '@tiptap/extension-underline', '@tiptap/extension-color', '@tiptap/extension-text-style'],
                    'vendor-leaflet': ['leaflet', 'react-leaflet'],
                },
            },
        },
    },
    server: {
        port: 443,
        host: true,
        hmr: {
            host: 'local.siodelhi.org',
            port: 443,
            protocol: 'wss',
        },
        proxy: {
            '/api': {
                target: 'https://api.siodelhi.org',
                changeOrigin: true,
                secure: true,
            },
        },
    },
})
