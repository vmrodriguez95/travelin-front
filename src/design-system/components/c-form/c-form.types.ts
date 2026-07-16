interface FormInfo {
  action: string
  entity: string
  method: string
}

export interface FormSchema {
  form: FormInfo
  sections: Record<string, FormSection>
}

export interface FormBlock extends Record<string, BasicFormField | FormSection | FormArraySection | string | undefined> {
  randomId?: string
}

export interface FormSection {
  id: string
  legend?: string
  legendPosition?: string
  sectionTitle?: string
  removeMainKey?: boolean
  helpmsg: string
  fields: FormBlock
}

export interface FormArraySection {
  id: string
  sectionTitle: string
  sectionHelpmsg: string
  resumeLabel?: string
  canAdd: boolean
  addLabel: string
  canMove: boolean
  canRemove: boolean
  emptyMsg: string
  removeMainKey?: boolean
  editingElementIdx?: number
  grid: string // "inline" o "stacked"
  schema: FormBlock
  fields?: Array<FormBlock>
  confirmLabel?: string
  cancelLabel?: string
  editLabel?: string
  removeLabel?: string
}

export interface FieldMessages {
  required?: string
  minLength?: string
  maxLength?: string
  mismatch?: string
  email?: string
  passwordStrength?: string
}

// Fields
export interface BasicFormField {
  id: string
  name: string
  label: string
  type: string
  breadcrumbs: string
  helpmsg?: string
  fieldSize?: string
  value: string
  placeholder?: string
  fillValue?: string | Array<string>
  minLength?: number
  maxLength?: number
  dependsOn?: Array<string>
  autofocus?: boolean
  required: boolean
  readonly: boolean
  excludeValue?: boolean
  showInResume?: boolean
  a11y?: Record<string, string>
  messages?: FieldMessages
}

export interface SelectOption {
  label: string
  value: string | number
}

export interface SelectFormField extends BasicFormField {
  options: Array<SelectOption>
  default: string
}

export interface DateFormField extends BasicFormField {
  min: string
  max: string
}

export interface CalendarFormField extends BasicFormField {
  returnedValues: Array<string>
  start?: string
  end?: string
  min?: string
  max?: string
}
export interface SearchFormField extends BasicFormField {
  api: string
  displayValue: string
  queryAsValue: boolean
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

export interface FieldDependency {
  field: string
  dependsOn: Array<string> | undefined
  isRegistered: boolean
}
