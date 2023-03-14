import type { ViteDevServer } from 'vite'
import { defineConfig } from 'vite'
import { cache } from '../dist/index'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [cache(url => url.includes('counter')),

  ],
  build: {

  },
})
