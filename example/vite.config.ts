import type { ViteDevServer } from 'vite'
import { defineConfig } from 'vite'
import { serverCache } from '../dist/index'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [serverCache('src/main.ts'),
  ],
  build: {

  },
})
