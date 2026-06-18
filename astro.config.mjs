import { defineConfig } from 'astro/config'
import { loadEnv } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://astro.build/config
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    devToolbar: {
      enabled: false
    },
    srcDir: './src',
    vite: {
      plugins: [tsconfigPaths()],
      define: {
        'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(env.VITE_GOOGLE_MAPS_API_KEY || '')
      }
    }
  }
});
