import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { SimpleGetClient } from '@ds/requests/index.ts'

export class SimpleRequestController implements ReactiveController {

  private host: ReactiveControllerHost
  private client: SimpleGetClient

  private abortController?: AbortController
  private requestId = 0

  // Cache simple en memoria (FIFO)
  private cache = new Map<string, unknown>()
  private readonly maxCacheSize = 50

  loading = false

  constructor(host: ReactiveControllerHost, client: SimpleGetClient) {
    this.host = host
    this.client = client
    host.addController(this)
  }

  hostDisconnected() {
    this.abort()
  }

  abort() {
    this.abortController?.abort()
    this.abortController = undefined
    this.requestId++

    if (this.loading) {
      this.loading = false
      this.host.requestUpdate()
    }
  }

  async get<T>(path: string, query: string): Promise<T> {

    if (!query.trim()) {
      throw new Error('Query cannot be empty')
    }

    const cacheKey = `${path}?query=${query.trim()}`

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as T
    }

    this.abort()

    const currentRequestId = ++this.requestId

    this.abortController = new AbortController()
    this.loading = true
    this.host.requestUpdate()

    try {
      const data = await this.client.get<T>(
        path,
        query,
        this.abortController.signal
      )

      if (currentRequestId !== this.requestId) {
        throw new Error('Stale response ignored')
      }

      this.cache.set(cacheKey, data)

      if (this.cache.size > this.maxCacheSize) {
        const firstKey = this.cache.keys().next().value
        this.cache.delete(firstKey || '')
      }

      return data

    } finally {
      if (currentRequestId === this.requestId) {
        this.loading = false
        this.host.requestUpdate()
      }
    }
  }
}
