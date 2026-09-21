import { HttpTransport } from './http-transport.ts'
import type { FormEnctype } from './requests.types.ts'

// Sends a form the way the browser would on a native submit, but through
// fetch: the server receives the same field names and encoding, and the page
// stays put. The body follows the form's enctype so a schema written for a
// native submit keeps working unchanged.
export class SimpleFormClient extends HttpTransport {

  async submit<T>(path: string, method: string, formData: FormData, enctype: FormEnctype, signal?: AbortSignal): Promise<T> {
    return await this.request<T>(this.resolveUrl(path), {
      method,
      headers: this._getHeaders(enctype),
      body: this._getBody(formData, enctype),
    }, signal)
  }

  // multipart needs the boundary the browser generates, so its Content-Type
  // is left out on purpose and set by fetch itself.
  private _getHeaders(enctype: FormEnctype): Record<string, string> {
    if (enctype === 'multipart/form-data') return {}

    return { 'Content-Type': 'application/x-www-form-urlencoded' }
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
}
