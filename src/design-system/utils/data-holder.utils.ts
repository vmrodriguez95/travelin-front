import type { PoiChannelData } from '@ds/utils/poi-channel.utils'

// The nearest ancestor holding an item (a card), so elements slotted into
// it read the card's copy instead of carrying their own. Read it when needed:
// the card merges page-wide updates into that copy.
export function findHolderData(from: HTMLElement): PoiChannelData | null {
  let node: HTMLElement | null = from.parentElement

  while (node) {
    const data = (node as { data?: unknown }).data

    if (data && typeof data === 'object' && 'id' in data) {
      return data as PoiChannelData
    }

    node = node.parentElement
  }

  return null
}

// Resolves once every custom-element ancestor is defined. An element can be
// upgraded before the card around it, and until then the card holds no data.
export function whenHoldersDefined(from: HTMLElement): Promise<unknown> {
  const pending: Array<Promise<unknown>> = []
  let node: HTMLElement | null = from.parentElement

  while (node) {
    const tag = node.localName

    if (tag.includes('-') && !customElements.get(tag)) {
      pending.push(customElements.whenDefined(tag))
    }

    node = node.parentElement
  }

  return Promise.all(pending)
}
