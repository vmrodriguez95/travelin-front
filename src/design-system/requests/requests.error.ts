export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

// A response that arrived after a newer request replaced it. Callers treat it
// like an abort: nothing to show, nothing to log.
export class StaleResponseError extends Error {
  constructor() {
    super('Stale response ignored')
    this.name = 'StaleResponseError'
  }
}
