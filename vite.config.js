import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/web/index.ts',
      name: 'TravelInDS',
      fileName: 'travelin-ds',
      formats: ['es']
    },
    outDir: 'dist/ds',
    rollupOptions: {
      external: []
    }
  }
})