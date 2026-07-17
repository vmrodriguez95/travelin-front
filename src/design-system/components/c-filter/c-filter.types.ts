export interface Filter {
  label: string
  value: string
  icon: string
  default?: boolean
}

export interface FilterChangeDetail {
  query: string
  filter: string
  data: unknown[]
}