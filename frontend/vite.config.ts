import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router-dom/') ||
            id.includes('/scheduler/')
          ) {
            return 'react-vendor';
          }

          if (id.includes('/framer-motion/')) {
            return 'motion-vendor';
          }

          if (id.includes('/antd/')) {
            return 'antd-vendor';
          }

          if (
            id.includes('/@ant-design/') ||
            id.includes('/@rc-component/') ||
            id.includes('/rc-') ||
            id.includes('/rc_')
          ) {
            return 'antd-runtime';
          }

          if (id.includes('/dayjs/')) {
            return 'dayjs-vendor';
          }

          if (id.includes('/lucide-react/')) {
            return 'icons-vendor';
          }

          if (id.includes('/@babel/runtime/')) {
            return 'runtime-vendor';
          }

          return 'vendor';
        },
      },
    },
  },
})
