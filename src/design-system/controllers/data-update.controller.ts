import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { DATA_UPDATE_EVENT, type DataUpdateEventDetail } from '@ds/utils/data-update.utils'

interface Identified {
  location: string
}

// Keeps a host's `data` copy in sync with `data-update` announcements for
// the same location. The host decides how to store the merged record.
export class DataUpdateController<T extends Identified> implements ReactiveController {
  private getData: () => T | null | undefined
  private setData: (data: T) => void

  constructor(host: ReactiveControllerHost, getData: () => T | null | undefined, setData: (data: T) => void) {
    this.getData = getData
    this.setData = setData
    host.addController(this)
  }

  hostConnected() {
    document.addEventListener(DATA_UPDATE_EVENT, this._onUpdate as EventListener)
  }

  hostDisconnected() {
    document.removeEventListener(DATA_UPDATE_EVENT, this._onUpdate as EventListener)
  }

  private _onUpdate = (ev: CustomEvent<DataUpdateEventDetail>) => {
    const data = this.getData()

    // An update without a location names no record; matching it would merge
    // it into every record that has no location either.
    if (!ev.detail.id || !data || data.location !== ev.detail.id) return

    this.setData({ ...data, ...ev.detail.changes })
  }
}
