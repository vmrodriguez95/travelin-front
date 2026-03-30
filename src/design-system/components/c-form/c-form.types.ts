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
  fields: Record<string, BasicFormField>
}

export interface BasicFormField {
  id: string
  name: string
  label: string
  type: string
  helpmsg?: string
  fieldSize?: string
  value: string
  fillValue?: string | Array<string>
  dependsOn?: Array<string>
  required: boolean
  readonly: boolean
  excludeValue?: boolean
}

export interface CalendarFormField extends BasicFormField {
  returnedValues: Array<string>
}
export interface SearchFormField extends BasicFormField {
  api: string
}

interface FileFieldInfo {
  api: string
  extensions: string
  maxSize: number
  multiple: boolean
}

export interface FileFormField extends BasicFormField {
  file: FileFieldInfo
}