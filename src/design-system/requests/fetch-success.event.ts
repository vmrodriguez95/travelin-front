// `fetch-success` keeps the server answer as `detail`, the contract every
// listener already relies on. `subjectId` adds the id of the item the
// request acted on, as sent by the requester, so listeners do not depend on
// the answer echoing it back (a move may answer with a new id, or none).
export class FetchSuccessEvent<T = unknown> extends CustomEvent<T> {

  static readonly type = 'fetch-success'

  readonly subjectId: string | null

  constructor(detail: T, subjectId: string | null = null) {
    super(FetchSuccessEvent.type, { detail, bubbles: true, composed: true })

    this.subjectId = subjectId
  }
}
