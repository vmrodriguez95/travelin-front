import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
// import lit from 'vite-plugin-lit'; // si usas Lit

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(env.VITE_GOOGLE_MAPS_API_KEY || '')
    },
    plugins: [
      tsconfigPaths({ root: '.' }),
      // lit() // solo si usas Lit
    ],
    // vite-tsconfig-paths only resolves JS/TS imports; Sass @use needs resolve.alias
    resolve: {
      alias: [
        { find: '@common', replacement: '/src/common' },
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
          assetFileNames: 'app[extname]',
          chunkFileNames: 'lib/[name].js',
          manualChunks(id) {
            if (id.includes('/node_modules/globe.gl/')) {
              return 'globe.gl'
            }
          }
        }
      },
      outDir: 'dist/design-system'
    }
  }
});
