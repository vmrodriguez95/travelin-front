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
        '@ds': '/src/design-system',
        '@web': '/src/web',
        '@common': '/src/common',
      }
    }
  }
});
