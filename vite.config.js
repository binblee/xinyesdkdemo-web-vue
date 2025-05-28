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
    port: port
  }
})
