import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],

  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@store': path.resolve(__dirname, './src/store'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },

  // Server configuration
  server: {
    port: 5173,
    host: true, // Listen on all addresses
    open: false, // Don't auto-open browser
    cors: true,
    proxy: {
      // Proxy API requests to backend
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true, // Generate source maps for debugging
    minify: 'esbuild', // Use esbuild for faster minification
    target: 'esnext',
    rollupOptions: {
      output: {
        // Manual chunking for better code splitting
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['react-icons'],
          'store-vendor': ['zustand'],
          'utils-vendor': ['axios'],
        },
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Better tree shaking
    reportCompressedSize: false,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-icons',
      'zustand',
      'axios',
      'recharts',
    ],
    exclude: ['@vitejs/plugin-react'],
  },

  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
    cors: true,
  },

  // CSS configuration
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      // Add any CSS preprocessor options here
    },
  },

  // Define environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
})
