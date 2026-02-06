// Importa TODOS los custom components automáticamente
const components = import.meta.glob('./**/*.ts', {
  eager: true
})

// No hace falta exportar nada
export {}