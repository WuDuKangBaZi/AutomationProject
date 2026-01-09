import { ref, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import SockJS from 'sockjs-client'
import type { Message } from '@stomp/stompjs' 
import { Client } from '@stomp/stompjs'
import { useAuthStore } from '@/stores/auth'

/**
 * 组消息的默认结构（可被泛型覆盖）
 */
export interface GroupMessage {
  content: string;
  time: number;
  [key: string]: any; // 允许扩展字段
}

/**
 * 配置选项
 */
export interface UseGroupWebSocketOptions {
  wsEndpoint: string;
  userId?: string;
}

/**
 * 返回值接口
 */
export interface UseGroupWebSocketReturn<T = GroupMessage> {
  isConnected: Ref<boolean>;
  messages: Ref<T[]>;
  connect: () => void;
  disconnect: () => void;
  clearMessages: () => void;
}

/**
 * Vue 3 Composable：连接组 WebSocket（TypeScript 版）
 * @template T - 消息体类型，默认为 GroupMessage
 * @param options - 配置项
 * @returns 控制接口
 */
export function useGroupWebSocket<T = GroupMessage>({
  wsEndpoint,
  userId = 'anonymous',
}: UseGroupWebSocketOptions): UseGroupWebSocketReturn<T> {
  const isConnected = ref(false)
  const messages = ref<T[]>([]) as Ref<T[]>
  let stompClient: Client | null = null

  const connect = () => {
    if (isConnected.value) return
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
    const wsUrl = `${baseUrl}${wsEndpoint}`
    console.log('Connecting to WebSocket at:', wsUrl)
    const socket = new SockJS(wsUrl)
    stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectHeaders: {
        Authorization: 'Bearer ' + useAuthStore().token,
      },
    })

    stompClient.onConnect = () => {
      console.log('✅ WebSocket connected')
      isConnected.value = true
    
      // 订阅当前用户所属的 group
      stompClient?.subscribe(
        `/topic/group/${useAuthStore().userInfo?.groupName}`,
        (message: Message) => {
          try {
            
            const payload = JSON.parse(message.body) as T
            messages.value.push(payload)
          } catch (e) {
            messages.value.push(message.body as unknown as T) // 解析失败时，直接存储原始消息
            console.warn('Failed to parse message body:', message.body)
          }
        }
      )
    }

    stompClient.onStompError = (frame) => {
      console.error('❌ STOMP protocol error:', frame.headers['message'])
    }

    socket.onerror = (error: any) => {
      console.error('🔌 WebSocket network error:', error)
    }

    stompClient.activate()
  }

  const disconnect = () => {
    if (stompClient) {
      stompClient.deactivate()
      isConnected.value = false
      console.log('👋 WebSocket disconnected')
    }
  }

  const clearMessages = () => {
    messages.value = []
  }

  // 组件卸载时自动清理
  onUnmounted(() => {
    disconnect()
    console.log('Component unmounted, WebSocket disconnected')
  })

  return {
    isConnected,
    messages,
    connect,
    disconnect,
    clearMessages,
  }
}