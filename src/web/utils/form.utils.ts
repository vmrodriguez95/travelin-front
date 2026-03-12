const jsonGlob = import.meta.glob('./../../forms/**.json', { eager: true })
import type { FormSchema } from '@ds/components/c-form/c-form.types'

const formCollections = Object.values(jsonGlob)[0] as any

export function getFormBy(entity: string, action: string) {
  return formCollections.default.find((formSchema: FormSchema) => formSchema.form?.entity === entity && formSchema.form?.action === action)
}