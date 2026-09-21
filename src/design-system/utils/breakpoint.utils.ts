import { BREAKPOINTS } from './variables'
import type { Breakpoint, BreakpointListener } from './breakpoint.types'

// One set of media queries for the whole page. Every element that needs the
// current breakpoint subscribes here instead of registering its own four
// MediaQueryLists, so a list of fifty cards costs the same as one.
export class BreakpointObserver {

  private static _instance: BreakpointObserver | null = null

  static get instance(): BreakpointObserver {
    return this._instance ??= new BreakpointObserver()
  }

  private _queries: Array<[Breakpoint, MediaQueryList]>

  private _listeners = new Set<BreakpointListener>()

  private _current: Breakpoint = 'sm'

  private constructor() {
    this._queries = [
      ['xl', window.matchMedia(`(min-width: ${BREAKPOINTS.xl}px)`)],
      ['lg', window.matchMedia(`(min-width: ${BREAKPOINTS.lg}px)`)],
      ['md', window.matchMedia(`(min-width: ${BREAKPOINTS.md}px)`)],
    ]

    this._queries.forEach(([, query]) => query.addEventListener('change', this._onChange))
    this._current = this._resolve()
  }

  get current(): Breakpoint {
    return this._current
  }

  // Calls the listener with the current value right away, then on every
  // change. Returns the function that unsubscribes it.
  subscribe(listener: BreakpointListener): () => void {
    this._listeners.add(listener)
    listener(this._current)

    return () => {
      this._listeners.delete(listener)
    }
  }

  // Queries are ordered from widest to narrowest; the first match wins and
  // anything below `md` is `sm`.
  private _resolve(): Breakpoint {
    const match = this._queries.find(([, query]) => query.matches)

    return match ? match[0] : 'sm'
  }

  private _onChange = () => {
    const next = this._resolve()

    if (next === this._current) return

    this._current = next
    this._listeners.forEach((listener) => listener(next))
  }
}
