import { defineStore } from 'pinia'
import type { User } from '@/types/user'

export interface AuthState {
  token: string | null
  refreshToken: string | null
  userInfo: User | null
}

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
      token: null,
      refreshToken: null,
      userInfo: null,
    }),
    persist: true,
    actions: {
      setToken(token: string, refresh: string) {
        this.token = token
        this.refreshToken = refresh;
      },
      clearToken() {
        this.token = null
        this.refreshToken = null
        this.userInfo = null
      },
      setUserInfo(user: Partial<User>) {
        this.userInfo = { ...(this.userInfo || {}), ...user} as User
        localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
      },
    },
  })
  
