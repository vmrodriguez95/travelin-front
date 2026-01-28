// Importa TODOS los custom elements automáticamente
const elements = import.meta.glob('./**/!(*.config).ts', {
  eager: true
})

// No hace falta exportar nada
export {}