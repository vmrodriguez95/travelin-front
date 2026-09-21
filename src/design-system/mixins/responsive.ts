import { LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import { BreakpointObserver } from '../utils/breakpoint.utils'
import type { Breakpoint } from '../utils/breakpoint.types'

export type { Breakpoint } from '../utils/breakpoint.types'

type Constructor<T> = new (...args: any[]) => T

export declare class ResponsiveInterface {
  breakpoint: Breakpoint
}

export const Responsive =
<T extends Constructor<LitElement>>(superClass: T): T & Constructor<ResponsiveInterface> => {
  class ResponsiveElement extends superClass {
    @property({ type: String }) breakpoint: Breakpoint = 'sm'

    private _unsubscribeBreakpoint: (() => void) | null = null

    connectedCallback() {
      super.connectedCallback()

      this._unsubscribeBreakpoint = BreakpointObserver.instance.subscribe((breakpoint) => {
        this.breakpoint = breakpoint
      })
    }

    disconnectedCallback() {
      super.disconnectedCallback()

      this._unsubscribeBreakpoint?.()
      this._unsubscribeBreakpoint = null
    }
  }

  return ResponsiveElement as unknown as T & Constructor<ResponsiveInterface>
}
