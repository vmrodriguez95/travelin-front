interface FormInfo {
  action: string
  entity: string
  method: string
}

export interface FormSchema {
  form: FormInfo
  sections: Record<string, FormSection>
}

export interface FormSection {
  legend: string
  removeMainKey?: boolean
  fields: Record<string, FormField>
}

export interface FormField {
  id: string
  name: string
  label: string
  type: string
  api?: string
  helpmsg?: string
  fieldSize?: string
  value: string
  fillValue?: string | Array<string>
  dependsOn?: Array<string>
  required: boolean
  readonly: boolean
  excludeValue?: boolean
  returnedValues?: Array<string>
}