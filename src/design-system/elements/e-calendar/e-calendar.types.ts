// The date helpers the calendar works with. They are loaded on demand because
// they bring the Temporal polyfill along.
export type DateUtils = typeof import('@ds/utils/date.utils')
