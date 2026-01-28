/// <reference types="astro/client" />
/// <reference types="vite/client" />

declare module '*.scss?inline' {
  const content: string
  export default content
}

declare module '*.astro' {
  const component: any
  export default component
}
