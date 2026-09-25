export interface HttpTransportOptions {
  baseUrl?: string
  timeoutMs?: number
}

export type SimpleGetClientOptions = HttpTransportOptions

export type SimpleFormClientOptions = HttpTransportOptions

export type SimpleJsonClientOptions = HttpTransportOptions

export type FormEnctype = 'application/x-www-form-urlencoded' | 'multipart/form-data' | string

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

// What a successful request did to the item it acted on, so listeners can
// tell a deletion from a move without guessing from the method or channel.
export type FetchIntent = 'remove' | 'move'

// Headers are kept as a plain record so the transport can merge its own
// defaults in with a spread.
export type TransportRequestInit = Omit<RequestInit, 'headers' | 'signal'> & {
  headers?: Record<string, string>
}

// What a consumer needs from a read-only client. Controllers depend on this,
// not on a concrete class, so a cache or a mock can stand in for the network.
export interface GetClient {
  get<T>(path: string, query?: string, signal?: AbortSignal): Promise<T>
}
