import { StaleResponseError } from '@ds/requests/requests.error.ts'

// An abort or a superseded response is expected while the user keeps typing:
// neither is an error to report.
export function isSilentRequestError(error: unknown): boolean {
  if (error instanceof StaleResponseError) return true

  return (error as Error)?.name === 'AbortError'
}
