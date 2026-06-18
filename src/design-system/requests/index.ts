import { HttpError } from './requests.error.ts'
import type { SimpleGetClientOptions } from './requests.types.ts'

export class SimpleGetClient {
  private baseUrl: string
  private timeoutMs: number

  constructor(options: SimpleGetClientOptions) {
    this.baseUrl = options.baseUrl || window.origin
    this.timeoutMs = options.timeoutMs ?? 8000
  }

  async get<T>(path: string, query: string, signal?: AbortSignal): Promise<T> {
    if (typeof query !== 'string') {
      throw new TypeError('Query must be a string')
    }

    const url = new URL(path, this.baseUrl)
    url.searchParams.set('query', query.trim())

    return await this.request(url.toString(), 'GET', signal)
  }

  async request<T>(url: string, method: string, signal?: AbortSignal): Promise<T> {
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
        method,
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new HttpError(response.status, `HTTP ${response.status}`)
      }

      return await response.json() as T

    } finally {
      clearTimeout(timeout)
      signal?.removeEventListener('abort', onAbort)
    }
  }
}