import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
// import lit from 'vite-plugin-lit'; // si usas Lit

export default defineConfig({
  plugins: [
    tsconfigPaths({ root: '.' }),
    // lit() // solo si usas Lit
  ],
  resolve: {
    alias: [
      { find: '@web', replacement: '/src/web' },
      { find: '@common', replacement: '/src/common' },
      { find: '@ds', replacement: '/src/design-system' }
    ]
  },
  build: {
    lib: {
      entry: 'src/design-system/index.ts',
      name: 'DesignSystem',
      formats: ['es'],
      fileName: () => `app.js`
    },
    rollupOptions: {
      external: [], // aquí puedes excluir dependencias externas
      output: {
        assetFileNames: 'app[extname]'
      }
    },
    outDir: 'dist/design-system'
  }
});