const jsonGlob = import.meta.glob('./../../forms/**.json', { eager: true })
import type { FormSchema } from '@ds/components/c-form/c-form.types'

const formCollections = Object.values(jsonGlob) as any
const formList = formCollections.map((formGeneric: any) => formGeneric.default).flat()

export function getFormBy(entity: string, action: string) {
  return formList.find((formSchema: FormSchema) => formSchema.form?.entity === entity && formSchema.form?.action === action)
}