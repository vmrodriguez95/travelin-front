import { HttpError } from './requests.error.ts'
import type { HttpTransportOptions, TransportRequestInit } from './requests.types.ts'

// The one place a request goes through the network. Every client builds on
// it, so timeout, abort and error handling behave the same for a GET, a form
// submit or a JSON call.
export abstract class HttpTransport {
  protected baseUrl: string
  protected timeoutMs: number

  constructor(options: HttpTransportOptions = {}) {
    this.baseUrl = options.baseUrl || window.origin
    this.timeoutMs = options.timeoutMs ?? 8000
  }

  protected resolveUrl(path: string): URL {
    return new URL(path, this.baseUrl)
  }

  // Runs the fetch with a timeout, forwarding the caller's abort signal if
  // any. A non-2xx answer becomes an HttpError carrying the server message
  // when the body has one.
  protected async request<T>(url: string | URL, init: TransportRequestInit, signal?: AbortSignal): Promise<T> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    const onAbort = () => controller.abort()
    if (signal) {
      if (signal.aborted) {
        controller.abort()
      } else {
        signal.addEventListener('abort', onAbort, { once: true })
      }
    }

    try {
      const response = await fetch(url.toString(), {
        ...init,
        headers: { 'Accept': 'application/json', ...init.headers },
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new HttpError(response.status, await this._getErrorMessage(response))
      }

      return await response.json() as T

    } finally {
      clearTimeout(timeout)
      signal?.removeEventListener('abort', onAbort)
    }
  }

  private async _getErrorMessage(response: Response): Promise<string> {
    try {
      const data = await response.json()
      return data.message || `HTTP ${response.status}`
    } catch (_) {
      return `HTTP ${response.status}`
    }
  }
}
