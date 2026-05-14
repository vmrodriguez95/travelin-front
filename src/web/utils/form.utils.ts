import type { FormSchema } from '@ds/components/c-form/c-form.types'

const jsonGlob = import.meta.glob('./../../forms/**.json', { eager: true })
const jsonCurrencyGlob = import.meta.glob('./../../data/currency.json', { eager: true })

const formCollections = Object.values(jsonGlob) as any
const formList = formCollections.map((formGeneric: any) => formGeneric.default).flat()

const currencyCollections = Object.values(jsonCurrencyGlob) as any
const currencyList = currencyCollections.map((currencyGeneric: any) => currencyGeneric.default).flat()

export function getFormBy(entity: string, action: string) {
  return formList.find((formSchema: FormSchema) => formSchema.form?.entity === entity && formSchema.form?.action === action)
}

export function getCurrencies() {
  return currencyList
}
