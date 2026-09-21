import { HttpTransport } from './http-transport.ts'
import type { GetClient } from './requests.types.ts'

export class SimpleGetClient extends HttpTransport implements GetClient {

  async get<T>(path: string, query: string = '', signal?: AbortSignal): Promise<T> {
    if (typeof query !== 'string') {
      throw new TypeError('Query must be a string')
    }

    const url = this.resolveUrl(path)

    if (query.trim()) {
      url.searchParams.set('query', query.trim())
    }

    return await this.request<T>(url, { method: 'GET' }, signal)
  }
}
