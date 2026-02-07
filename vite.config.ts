import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), basicSsl()],
    base: '/',
    server: {
        port: 443,
        https: true,
        host: true,
        hmr: {
            host: 'local.siodelhi.org',
            port: 443,
            protocol: 'wss',
        },
    },
})
