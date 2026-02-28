export function debounce<T extends (...args: any[]) => void>(callback: T, wait = 1000) {
  let timeout: number

  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = window.setTimeout(() => {
      callback(...args)
    }, wait)
  }
}