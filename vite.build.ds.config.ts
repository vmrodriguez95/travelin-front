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
    worker: {
      // The pdf.js worker ships as an ES module, so it cannot be wrapped as iife.
      format: 'es',
      rollupOptions: {
        output: {
          // Keep it next to the other chunks instead of in its own assets/ dir.
          entryFileNames: 'lib/[name].js',
          chunkFileNames: 'lib/[name].js'
        }
      }
    },
    // Asset URLs inside JS (the pdf.js worker) must resolve next to app.js, not
    // from the site root: the consuming app mounts the library under its own path.
    experimental: {
      renderBuiltUrl(_filename, { hostType }) {
        return hostType === 'js' ? { relative: true } : undefined
      }
    },
    build: {
      minify: 'esbuild',
      lib: {
        entry: 'src/design-system/index.ts',
        name: 'DesignSystem',
        formats: ['es'],
        fileName: () => `app.js`
      },
      rollupOptions: {
        external: [], // aquí puedes excluir dependencias externas
        output: {
          // The consuming app loads the stylesheet as app.css, so that name is
          // pinned; everything else keeps its own name to avoid collisions.
          assetFileNames: (asset) => asset.name?.endsWith('.css') ? 'app[extname]' : '[name][extname]',
          chunkFileNames: 'lib/[name].js',
          manualChunks(id) {
            if (id.includes('/node_modules/globe.gl/')) {
              return 'globe.gl'
            }
            if (id.includes('/node_modules/pdfjs-dist/')) {
              return 'pdf'
            }
          }
        }
      },
      outDir: 'dist/design-system'
    }
  }
});
