import { EICON_LIST } from './e-icon.list'

export const config = {
  props: {
    icon: {
      name: 'icon',
      label: 'Icono',
      type: 'select',
      options: [...Object.keys(EICON_LIST)],
    },
    size: {
      name: 'size',
      label: 'Tamaño del icono',
      type: 'select',
      default: 'l',
      options: ['xxl', 'xl', 'l', 'm', 's', 'xs']
    },
  }
}