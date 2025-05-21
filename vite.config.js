import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const port = 51730;

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: port
  }
})
