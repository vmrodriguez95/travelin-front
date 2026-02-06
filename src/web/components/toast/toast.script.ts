type ToastType = 'info' | 'success' | 'error'

function isVisible(root: Element): boolean {
  return root.classList.contains('is-visible')
}

function closeToast(root: Element) {
  root.classList.remove('is-visible', 'info', 'success', 'error')

  const toast = root.querySelector('.ti-toast__content')
  if (!toast) return

  const onEnd = () => {
    toast.remove()
    root.removeEventListener('transitionend', onEnd)
  }

  root.addEventListener('transitionend', onEnd)
}

export function showToast(
  message: string,
  type: ToastType = 'info',
  duration = 2000
) {
  const root = document.querySelector('#toast-root')
  if (!root || isVisible(root)) return

  const toast = document.createElement('div')
  toast.className = 'ti-toast__content'
  toast.textContent = message

  root.appendChild(toast)

  requestAnimationFrame(() => {
    root.classList.add('is-visible', type)
  })

  if (duration > 0) {
    setTimeout(() => closeToast(root), duration)
  }
}

export function hideToast() {
  const root = document.querySelector('#toast-root')
  if (!root) return

  closeToast(root)
}

if (typeof window !== 'undefined') {
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    if (!target.closest('.ti-toast__close')) return

    const root = document.querySelector('#toast-root')
    if (root) closeToast(root)
  })
}