// utils/ws/useWebSocket.ts
import SockJS from 'sockjs-client'
import { Client, type IMessage } from '@stomp/stompjs'
import { useAuthStore } from '@/stores/auth'

type Callback = (msg: any) => void

class WebSocketManager {
  private client: Client | null = null
  private connected = false

  // 🔥 关键：订阅队列
  private pendingSubscriptions = new Map<string, Callback>()
  private activeSubscriptions = new Map<string, any>()

  connect(wsEndpoint: string) {
    if (this.client && this.connected) return

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
    })

    this.client.onConnect = () => {
      console.log('✅ STOMP connected')
      this.connected = true

      // 🚀 连接成功后，执行所有待订阅
      this.pendingSubscriptions.forEach((cb, topic) => {
        this.doSubscribe(topic, cb)
      })
      this.pendingSubscriptions.clear()
    }

    this.client.onStompError = (frame) => {
      console.error('❌ STOMP error', frame.headers['message'])
    }

    this.client.activate()
  }

  subscribe(topic: string, callback: Callback) {
    if (!this.client || !this.connected) {
      console.log('⏳ STOMP 未连接，加入订阅队列:', topic)
      this.pendingSubscriptions.set(topic, callback)
      return
    }
    this.doSubscribe(topic, callback)
  }

  private doSubscribe(topic: string, callback: Callback) {
    if (this.activeSubscriptions.has(topic)) return

    const sub = this.client!.subscribe(topic, (message: IMessage) => {
      try {
        callback(JSON.parse(message.body))
      } catch {
        callback(message.body)
      }
    })

    this.activeSubscriptions.set(topic, sub)
    console.log('📡 已订阅:', topic)
  }

  unsubscribe(topic: string) {
    const sub = this.activeSubscriptions.get(topic)
    if (sub) {
      sub.unsubscribe()
      this.activeSubscriptions.delete(topic)
      console.log('🧹 取消订阅:', topic)
    }
    this.pendingSubscriptions.delete(topic)
  }
}

const manager = new WebSocketManager()

export function useWebSocket(wsEndpoint = '/ws') {
  return {
    connect: () => manager.connect(wsEndpoint),
    subscribe: (topic: string, cb: Callback) =>
      manager.subscribe(topic, cb),
    unsubscribe: (topic: string) =>
      manager.unsubscribe(topic),
  }
}
