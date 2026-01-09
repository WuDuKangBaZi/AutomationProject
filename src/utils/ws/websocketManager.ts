import SockJS from 'sockjs-client'
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs'
import { useAuthStore } from '@/stores/auth'

type MessageHandler = (payload: any) => void

class WebSocketManager {
  private client: Client | null = null
  private connected = false
  private subscriptions = new Map<string, StompSubscription>()

  connect(wsEndpoint: string) {
    if (this.client?.active) return

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
    const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '')
    const wsUrl = `${baseUrl}${wsEndpoint}`

    const socket = new SockJS(wsUrl)

    this.client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectHeaders: {
        Authorization: 'Bearer ' + useAuthStore().token,
      },
      onConnect: () => {
        this.connected = true
        console.log('✅ WebSocket connected')

        // 🔁 断线重连后自动恢复订阅
        this.subscriptions.forEach((_, topic) => {
          this.subscribe(topic, () => {})
        })
      },
    })

    this.client.activate()
  }

  disconnect() {
    this.subscriptions.forEach(sub => sub.unsubscribe())
    this.subscriptions.clear()
    this.client?.deactivate()
    this.connected = false
  }

  subscribe(topic: string, handler: MessageHandler) {
    if (!this.client) {
      throw new Error('WebSocket not connected')
    }

    // 避免重复订阅
    if (this.subscriptions.has(topic)) return

    const subscription = this.client.subscribe(topic, (message: IMessage) => {
      try {
        handler(JSON.parse(message.body))
      } catch {
        handler(message.body)
      }
    })

    this.subscriptions.set(topic, subscription)
  }

  unsubscribe(topic: string) {
    const sub = this.subscriptions.get(topic)
    if (sub) {
      sub.unsubscribe()
      this.subscriptions.delete(topic)
    }
  }

  isConnected() {
    return this.connected
  }
}

export const wsManager = new WebSocketManager()
