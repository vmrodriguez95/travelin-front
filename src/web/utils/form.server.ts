import type {
  BasicFormField,
  FormArraySection,
  FormBlock,
  FormSchema,
  FormSection
} from '@ds/components/c-form/c-form.types'

interface TextFieldA11y {
  clear: string
}

interface FileFieldA11y {
  upload: string
  clear: string
}

interface FormA11yConfig {
  text?: Partial<TextFieldA11y>
  file?: Partial<FileFieldA11y>
}

const DEFAULT_FORM_A11Y: Required<FormA11yConfig> = {
  text: {
    clear: 'Limpiar campo'
  },
  file: {
    upload: 'Seleccionar archivo',
    clear: 'Eliminar archivo seleccionado'
  }
}

function isFormSection(value: any): value is FormSection {
  return Boolean(value)
    && typeof value === 'object'
    && 'fields' in value
    && Boolean(value.fields)
    && typeof value.fields === 'object'
    && !('schema' in value)
}

function isFormArraySection(value: any): value is FormArraySection {
  return Boolean(value)
    && typeof value === 'object'
    && 'schema' in value
    && Boolean(value.schema)
    && typeof value.schema === 'object'
}

function isBasicFormField(value: any): value is BasicFormField {
  return Boolean(value) && typeof value === 'object' && 'type' in value
}

function addA11yToField(field: BasicFormField, config: Required<FormA11yConfig>) {
  if (field.type === 'text') {
    field.a11y = {
      ...config.text,
      ...(field.a11y || {})
    }
  }

  if (field.type === 'file') {
    field.a11y = {
      ...config.file,
      ...(field.a11y || {})
    }
  }
}

function walkFormBlock(block: FormBlock | null | undefined, config: Required<FormA11yConfig>) {
  if (!block || typeof block !== 'object') return

  Object.values(block).forEach((entry) => {
    if (!entry || typeof entry !== 'object') return

    if (isBasicFormField(entry)) {
      addA11yToField(entry, config)
      return
    }

    if (isFormSection(entry)) {
      walkFormBlock(entry.fields, config)
      return
    }

    if (isFormArraySection(entry)) {
      walkFormBlock(entry.schema, config)
      entry.fields?.forEach((item) => walkFormBlock(item, config))
    }
  })
}

export function withFormA11yDefaults<T extends FormSchema>(formSchema: T, overrides: FormA11yConfig = {}): T {
  const finalFormSchema = structuredClone(formSchema)
  const config: Required<FormA11yConfig> = {
    text: {
      ...DEFAULT_FORM_A11Y.text,
      ...(overrides.text || {})
    },
    file: {
      ...DEFAULT_FORM_A11Y.file,
      ...(overrides.file || {})
    }
  }

  if (!finalFormSchema?.sections || typeof finalFormSchema.sections !== 'object') {
    return finalFormSchema
  }

  Object.values(finalFormSchema.sections).forEach((section) => {
    
    if (isFormSection(section)) {
      walkFormBlock(section.fields, config)
      return
    }

    if (isFormArraySection(section)) {
      const formSection = section as FormArraySection

      walkFormBlock(formSection.schema, config)
      formSection.fields?.forEach((item) => walkFormBlock(item, config))
    }
  })

  return finalFormSchema
}
