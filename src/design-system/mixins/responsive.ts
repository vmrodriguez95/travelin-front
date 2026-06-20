import {LitElement} from 'lit'
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

    connectedCallback() {
      super.connectedCallback()
      this._activateMediaQueries()
    }

    private _activateMediaQueries = () => {
      const smMediaQuery = window.matchMedia(`(min-width: ${breakpoints.sm}px) and (max-width: ${breakpoints.md - 1}px)`)
      const mdMediaQuery = window.matchMedia(`(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`)
      const lgMediaQuery = window.matchMedia(`(min-width: ${breakpoints.lg}px) and (max-width: ${breakpoints.xl - 1}px)`)
      const xlMediaQuery = window.matchMedia(`(min-width: ${breakpoints.xl}px)`)

      if (smMediaQuery.matches) {
        this.breakpoint = 'sm'
      } else if (mdMediaQuery.matches) {
        this.breakpoint = 'md'
      } else if (lgMediaQuery.matches) {
        this.breakpoint = 'lg'
      } else if (xlMediaQuery.matches) {
        this.breakpoint = 'xl'
      }
    }
  }

  return ResponsiveElement as unknown as T & Constructor<ResponsiveInterface>
}