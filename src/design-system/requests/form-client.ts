import { HttpError } from './requests.error.ts'
import type { SimpleFormClientOptions, FormEnctype } from './requests.types.ts'

// Sends a form the way the browser would on a native submit, but through
// fetch: the server receives the same field names and encoding, and the page
// stays put. The body follows the form's enctype so a schema written for a
// native submit keeps working unchanged.
export class SimpleFormClient {
  private baseUrl: string
  private timeoutMs: number

  constructor(options: SimpleFormClientOptions = {}) {
    this.baseUrl = options.baseUrl || window.origin
    this.timeoutMs = options.timeoutMs ?? 8000
  }

  async submit<T>(path: string, method: string, formData: FormData, enctype: FormEnctype, signal?: AbortSignal): Promise<T> {
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
      const response = await fetch(new URL(path, this.baseUrl).toString(), {
        method,
        headers: this._getHeaders(enctype),
        body: this._getBody(formData, enctype),
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

  // multipart needs the boundary the browser generates, so its Content-Type
  // is left out on purpose and set by fetch itself.
  private _getHeaders(enctype: FormEnctype): HeadersInit {
    const headers: Record<string, string> = { 'Accept': 'application/json' }

    if (enctype !== 'multipart/form-data') {
      headers['Content-Type'] = 'application/x-www-form-urlencoded'
    }

    return headers
  }

  private _getBody(formData: FormData, enctype: FormEnctype): BodyInit {
    if (enctype === 'multipart/form-data') {
      return formData
    }

    const params = new URLSearchParams()

    formData.forEach((value, key) => {
      params.append(key, typeof value === 'string' ? value : value.name)
    })

    return params
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
