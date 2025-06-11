import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // Import the path module

const port = 51730;

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: { // Add resolve configuration
    alias: {
      '@': path.resolve(__dirname, './src'), // Define the @ alias
    },
  },
  server: {
    host: '0.0.0.0',
    port: port,
    proxy: { // Added proxy configuration
      '/api': {
        target: 'http://localhost:3001', // Your proxy server
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '') // Uncomment if your proxy doesn't expect /api prefix
      }
    }
  }
})
