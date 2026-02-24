interface FormSchema {
  sections: Record<string, FormSection>
}

interface FormSection {
  sectionTitle: string
  fields: Record<string, FormField>
}

interface FormField {
  id: string
  name: string
  label: string
  type: string
  helpmsg?: string
  fieldSize?: string
  required: boolean
  readonly: boolean
  returnedValues?: Array<string>
}