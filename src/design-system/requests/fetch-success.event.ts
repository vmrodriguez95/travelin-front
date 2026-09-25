import type { FetchIntent } from './requests.types'

// `fetch-success` keeps the server answer as `detail`, the contract every
// listener already relies on. `subjectId` adds the id of the item the
// request acted on, as sent by the requester, so listeners do not depend on
// the answer echoing it back (a move may answer with a new id, or none).
// `intent` says what the request did to that item.
export class FetchSuccessEvent<T = unknown> extends CustomEvent<T> {

  static readonly type = 'fetch-success'

  readonly subjectId: string | null

  readonly intent: FetchIntent

  constructor(detail: T, subjectId: string | null = null, intent: FetchIntent = 'remove') {
    super(FetchSuccessEvent.type, { detail, bubbles: true, composed: true })

    this.subjectId = subjectId
    this.intent = intent
  }
}
