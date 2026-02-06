// Importa TODOS los custom elements automáticamente
const elements = import.meta.glob('./**/*.ts', {
  eager: true
})

// No hace falta exportar nada
export {}