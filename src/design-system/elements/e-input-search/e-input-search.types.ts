export interface SearchResult {
    value: string
    label: string
    helptext?: string
}

export type SearchApiResponse = { data: Array<SearchResult> }