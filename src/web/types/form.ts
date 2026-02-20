export interface FormSchema {
  sections: {
    [key: string]: {
      sectionTitle: string
      fields: {
        [key: string]: {
          id: string
          name: string
          label: string
          type: string
          required: boolean
          readonly: boolean,
          returnedValues?: Array<string>
        }
      }
    }
  }
}