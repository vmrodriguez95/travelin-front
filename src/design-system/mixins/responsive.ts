import { LitElement } from 'lit'
import { property } from 'lit/decorators.js'
import { breakpoints } from '../utils/variables'

type Constructor<T> = new (...args: any[]) => T

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl'

export declare class ResponsiveInterface {
  breakpoint: Breakpoint
}

export const Responsive =
<T extends Constructor<LitElement>>(superClass: T): T & Constructor<ResponsiveInterface> => {
  class ResponsiveElement extends superClass {
    @property({ type: String }) breakpoint: Breakpoint = 'sm'

    private _mediaQueryList: MediaQueryList[] = []

    connectedCallback() {
      super.connectedCallback()
      this._activateMediaQueries()
    }

    disconnectedCallback() {
      super.disconnectedCallback()
      this._mediaQueryList.forEach(mq => mq.removeEventListener('change', this._activateMediaQueries))
    }

    private _activateMediaQueries = () => {
      if (this._mediaQueryList.length === 0) {
        this._mediaQueryList = [
          window.matchMedia(`(min-width: ${breakpoints.sm}px) and (max-width: ${breakpoints.md - 1}px)`),
          window.matchMedia(`(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`),
          window.matchMedia(`(min-width: ${breakpoints.lg}px) and (max-width: ${breakpoints.xl - 1}px)`),
          window.matchMedia(`(min-width: ${breakpoints.xl}px)`),
        ]
        this._mediaQueryList.forEach(mq => mq.addEventListener('change', this._activateMediaQueries))
      }

      const [sm, md, lg, xl] = this._mediaQueryList
      if (sm.matches) this.breakpoint = 'sm'
      else if (md.matches) this.breakpoint = 'md'
      else if (lg.matches) this.breakpoint = 'lg'
      else if (xl.matches) this.breakpoint = 'xl'
    }
  }

  return ResponsiveElement as unknown as T & Constructor<ResponsiveInterface>
}
