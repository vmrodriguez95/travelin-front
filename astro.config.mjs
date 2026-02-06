// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  devToolbar: {
    enabled: false
  },
  srcDir: './src',
  vite: {
    resolve: {
      alias: {
        '@web': '/src/web',
        '@common': '/src/common',
        '@ds': '/src/design-system',
      }
    }
  }
});
