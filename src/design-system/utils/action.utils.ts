export function debounce<T extends (...args: any[]) => void>(callback: T, wait = 1000) {
  let timeout: number

  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = window.setTimeout(() => {
      callback(...args)
    }, wait)
  }
}

export function scrollToPageEnd() {
  requestAnimationFrame(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    })
  })
}

function getNearestVerticalScrollContainer(element: HTMLElement) {
  let parent = element.parentElement

  while (parent) {
    const overflowY = window.getComputedStyle(parent).overflowY
    const hasVerticalScroll = parent.scrollHeight > parent.clientHeight

    if (hasVerticalScroll && ['auto', 'scroll', 'overlay'].includes(overflowY)) {
      return parent
    }

    parent = parent.parentElement
  }

  return null
}

export function scrollIntoNearestVerticalContainer(element: HTMLElement) {
  const container = getNearestVerticalScrollContainer(element)

  if (!container) return

  const containerRect = container.getBoundingClientRect()
  const elementRect = element.getBoundingClientRect()
  const top = container.scrollTop
    + elementRect.top
    - containerRect.top
    - ((container.clientHeight - elementRect.height) / 2)

  container.scrollTo({
    top: Math.max(0, top),
    behavior: 'smooth'
  })
}
