import { HttpTransport } from './http-transport.ts'
import type { HttpMethod, TransportRequestInit } from './requests.types.ts'

// A JSON call to the API: the body is serialised, the answer parsed. A GET
// never carries a body, whatever the caller passes.
export class SimpleJsonClient extends HttpTransport {

  async send<T>(
    path: string,
    method: HttpMethod,
    body: Record<string, unknown> | null = null,
    headers: Record<string, string> = {},
    signal?: AbortSignal
  ): Promise<T> {
    const init: TransportRequestInit = {
      method,
      headers: { 'Content-Type': 'application/json', ...headers }
    }

    if (body && method !== 'GET') {
      init.body = JSON.stringify(body)
    }

    return await this.request<T>(this.resolveUrl(path), init, signal)
  }
}
