interface IntlLocaleWeekInfo {
  firstDay: number
  weekend: number[]
  minimalDays: number
}

interface IntlLocale {
  weekInfo?: IntlLocaleWeekInfo
}

declare namespace Intl {
  interface Locale extends IntlLocale {}
}