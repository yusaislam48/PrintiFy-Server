import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

// Custom plugin to handle PDF.js worker
const pdfjsWorkerPlugin = () => {
  return {
    name: 'pdfjs-worker-plugin',
    configureServer(server) {
      // Serve the PDF.js worker file in development
      server.middlewares.use((req, res, next) => {
        if (req.url.includes('pdf.worker.min.js')) {
          try {
            const workerPath = resolve(
              __dirname,
              'node_modules',
              'pdfjs-dist',
              'build',
              'pdf.worker.min.js'
            )
            
            if (fs.existsSync(workerPath)) {
              const content = fs.readFileSync(workerPath)
              res.setHeader('Content-Type', 'application/javascript')
              res.end(content)
              return
            }
          } catch (error) {
            console.error('Error serving PDF.js worker:', error)
          }
        }
        next()
      })
    },
    generateBundle() {
      // This will be handled by the copy plugin in the build process
      console.log('PDF.js worker plugin is active')
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    pdfjsWorkerPlugin()
  ],
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
  },
  resolve: {
    alias: {
      // Add any aliases you need here
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdfjs': ['pdfjs-dist', 'react-pdf'],
        }
      }
    }
  },
  optimizeDeps: {
    include: ['pdfjs-dist', 'react-pdf']
  }
})
