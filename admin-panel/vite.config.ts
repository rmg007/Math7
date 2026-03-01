import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          // Copy PDF.js worker to public directory at build time
          // This ensures the worker version always matches pdfjs-dist
          src: 'node_modules/pdfjs-dist/build/pdf.worker.mjs',
          dest: 'pdfjs',
        },
      ],
    }),
  ],
  envPrefix: ['VITE_', 'TEST_'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // J-4: Shared Type Bridge — resolves @questerix/core to the local package
      // without requiring npm workspaces or npm link.
      '@questerix/core': path.resolve(__dirname, '../packages/core/src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    proxy: {
      // Proxy Cloudflare Worker requests in dev to bypass CORS.
      // The browser talks to localhost:5000/api/workers/* and Vite
      // forwards the request server-side — no browser CORS preflight.
      '/api/workers': {
        target: 'https://questerix-workers.mhalim80.workers.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/workers/, ''),
      },
      // Proxy Supabase Edge Function requests in dev to bypass CORS.
      // Forwards to /functions/v1/* on the Supabase project.
      // We set the origin to Supabase's own URL so the CORS check passes.
      '/api/edge': {
        target: 'https://bkfhorslctqieetzqdtd.supabase.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/edge/, '/functions/v1'),
        headers: {
          // Spoof Origin so Supabase's CORS check accepts the request.
          // The actual fetch is done by Vite's Node process (not the browser),
          // so browser CORS rules do not apply here.
          Origin: 'http://localhost:3000',
        },
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
            // Charts (recharts only used in DashboardPage — keeps it in a dedicated chunk)
            if (
              id.includes('recharts') ||
              id.includes('d3-scale') ||
              id.includes('d3-shape') ||
              id.includes('d3-path') ||
              id.includes('victory-vendor')
            ) {
              return 'charts-vendor';
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
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router-dom')
            ) {
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
});
