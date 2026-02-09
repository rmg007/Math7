import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Heavy libraries for document processing
            if (id.includes('pdfjs-dist') || id.includes('mammoth') || id.includes('papaparse')) {
              return 'document-vendor';
            }
            // Math and rich text editor
            if (id.includes('katex') || id.includes('@tiptap')) {
              return 'editor-vendor';
            }
            // Lucide icons
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            // UI Components
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            // Core React
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            // Tanstack Query and Supabase
            if (id.includes('@tanstack') || id.includes('@supabase')) {
              return 'core-vendor';
            }
          }
        },
      },
    },
  },
})
