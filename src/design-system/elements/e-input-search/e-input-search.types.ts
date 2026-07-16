import type { PoiChannelData } from '@ds/utils/poi-channel.utils.ts'

export interface SearchResult {
    value: string
    label: string
    helptext?: string
}

export type SearchApiResponse = { data: Array<SearchResult> }

export type PlaceApiResponse = { data: PoiChannelData }