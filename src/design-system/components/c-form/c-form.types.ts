interface FormInfo {
  action: string
  entity: string
  method: string
}

export interface FormSchema {
  form: FormInfo
  sections: Record<string, FormSection>
}

export interface FormBlock extends Record<string, BasicFormField | FormSection> {}

export interface FormSection {
  id: string
  legend: string
  helpmsg: string
  removeMainKey?: boolean
  fields: FormBlock
}

export interface FormArraySection {
  id: string
  legend: string
  helpmsg: string
  canAdd: boolean
  addLabel: string
  canMove: boolean
  canRemove: boolean
  emptyMsg: string
  removeMainKey?: boolean
  schema: Array<FormBlock>
  fields?: Array<FormBlock>
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
  autofocus?: boolean
  required: boolean
  readonly: boolean
  excludeValue?: boolean
}

export interface TimeFormField extends BasicFormField {
  min: string
  max: string
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