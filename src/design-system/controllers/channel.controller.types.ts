import type { ChannelEventMap } from '@ds/utils/poi-channel.utils'

export type ChannelHandler<T> = (detail: T) => void

// Handlers keyed by event name. Known events get their detail type from
// ChannelEventMap; an event named at runtime (a `event` attribute) falls
// back to the untyped index signature.
export type ChannelHandlers = {
  [K in keyof ChannelEventMap]?: ChannelHandler<ChannelEventMap[K]>
} & {
  [event: string]: ChannelHandler<any> | undefined
}
