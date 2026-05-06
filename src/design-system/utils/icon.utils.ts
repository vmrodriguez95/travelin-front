import { EICON_LIST } from '@ds/elements/e-icon/e-icon.list'

export function getIconSvg(name: string) {
  return EICON_LIST[name] || EICON_LIST.default || ''
}
