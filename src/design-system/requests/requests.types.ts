export interface SimpleGetClientOptions {
  baseUrl: string
  timeoutMs?: number
}

export interface SimpleFormClientOptions {
  baseUrl?: string
  timeoutMs?: number
}

export type FormEnctype = 'application/x-www-form-urlencoded' | 'multipart/form-data' | string
