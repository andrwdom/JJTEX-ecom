import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  preview: {
    allowedHosts: ['jjtextiles.com', 'www.jjtextiles.com', 'admin.jjtextiles.com', 'api.jjtextiles.com']
  }
})
