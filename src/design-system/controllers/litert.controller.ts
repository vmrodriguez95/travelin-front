import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { Engine, type Conversation, type Message } from '@litert-lm/core'

// Lazily loads an in-browser Gemma model via LiteRT-LM and runs text generation.
// The model is a large download, so the engine is created on first use and reused.
export class LitertController implements ReactiveController {

  private host: ReactiveControllerHost
  private getModel: () => string

  private engine?: Engine
  private enginePromise?: Promise<Engine>
  private conversation?: Conversation

  loading = false

  constructor(host: ReactiveControllerHost, getModel: () => string) {
    this.host = host
    this.getModel = getModel
    host.addController(this)
  }

  hostDisconnected() {
    this.dispose()
  }

  async dispose() {
    const engine = this.engine
    this.engine = undefined
    this.enginePromise = undefined
    await engine?.delete()
  }

  private async getEngine(): Promise<Engine> {
    if (this.engine) return this.engine

    if (!('gpu' in navigator)) {
      throw new Error('Tu navegador no soporta WebGPU, necesario para leer PDF con IA')
    }

    if (!this.enginePromise) {
      this.enginePromise = Engine.create({
        model: this.getModel(),
        mainExecutorSettings: { maxNumTokens: 8192 }
      })
    }

    this.engine = await this.enginePromise
    return this.engine
  }

  async generate(prompt: string): Promise<string> {
    this.loading = true
    this.host.requestUpdate()

    try {
      const engine = await this.getEngine()
      const conversation = await engine.createConversation()
      this.conversation = conversation

      const response = await conversation.sendMessage(prompt)
      await conversation.delete()

      return this.extractText(response)
    } finally {
      this.conversation = undefined
      this.loading = false
      this.host.requestUpdate()
    }
  }

  // Aborts any in-flight generation (e.g. the user closed the reader).
  cancel() {
    this.conversation?.cancel()
  }

  private extractText(message: Message): string {
    const { content } = message

    if (typeof content === 'string') return content
    if (!content) return ''

    return content
      .map((part) => (part.type === 'text' ? part.text : ''))
      .join('')
  }
}
