import type { FormSchema } from '@ds/components/c-form/c-form.types'

export interface CurrencyItem {
  value: string
  label: string
  symbol: string
  country: string
  countryCode: string
}

const jsonGlob = import.meta.glob('./../../forms/**.json', { eager: true })
const jsonCurrencyGlob = import.meta.glob('./../../data/currency.json', { eager: true })

const formCollections = Object.values(jsonGlob) as Array<{ default: FormSchema[] }>
const formList: FormSchema[] = formCollections.flatMap((m) => m.default)

const currencyCollections = Object.values(jsonCurrencyGlob) as Array<{ default: CurrencyItem[] }>
const currencyList: CurrencyItem[] = currencyCollections.flatMap((m) => m.default)

export function getFormBy(entity: string, action: string): FormSchema | undefined {
  return formList.find((schema) => schema.form?.entity === entity && schema.form?.action === action)
}

export function getCurrencies(): CurrencyItem[] {
  return currencyList
}
