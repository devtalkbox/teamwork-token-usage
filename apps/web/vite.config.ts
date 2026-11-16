import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // 默认只监听 ::1，curl / 部分浏览器走 IPv4 会连不上
    host: '127.0.0.1',
    port: 5273,
    proxy: {
      '/functions': 'http://127.0.0.1:8460',
      '/health': 'http://127.0.0.1:8460',
    },
  },
})
