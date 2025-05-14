import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/pdf-proxy': {
        target: 'https://res.cloudinary.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pdf-proxy/, ''),
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      }
    }
  }
})
