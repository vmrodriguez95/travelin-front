// @ts-check
import { defineConfig } from 'astro/config'
import { loadEnv } from 'vite'

// https://astro.build/config
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    devToolbar: {
      enabled: false
    },
    srcDir: './src',
    vite: {
      define: {
        'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(env.VITE_GOOGLE_MAPS_API_KEY || '')
      },
      resolve: {
        alias: {
          '@web': '/src/web',
          '@common': '/src/common',
          '@ds': '/src/design-system',
        }
      }
    }
  }
});
