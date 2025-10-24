// stores/auth.ts
// Pinia 驗證狀態管理 - Enhanced for CRM API Integration

import { defineStore } from 'pinia'

/**
 * 使用者資訊介面
 */
export interface UserInfo {
  id: string
  username: string
  email: string
  fullName?: string
  department?: string
  region?: string
  isActive: boolean
  lastLoginAt?: string
}

/**
 * 認證狀態介面
 */
export interface AuthState {
  isAuthenticated: boolean
  user: UserInfo | null
  accessToken: string | null
  lastRefresh: number | null
  isLoading: boolean
  error: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    lastRefresh: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    /**
     * 取得使用者顯示名稱
     */
    displayName: (state): string => {
      return state.user?.fullName || state.user?.username || '訪客'
    },

    /**
     * 檢查使用者是否已認證
     */
    isLoggedIn: (state): boolean => {
      return state.isAuthenticated && !!state.accessToken
    },
  },

  actions: {
    /**
     * 登入動作
     */
    async login(username: string, password: string, rememberMe: boolean = false) {
      this.isLoading = true
      this.error = null

      try {
        const authService = (await import('@/services/authService')).default

        // 呼叫 authService.login()
        const response = await authService.login({
          username,
          password,
          remember_me: rememberMe,
        })

        // 儲存 access token 到 sessionStorage
        sessionStorage.setItem('access_token', response.access_token)

        // 更新 store 狀態
        this.isAuthenticated = true
        this.user = response.user
        this.accessToken = response.access_token
        this.lastRefresh = Date.now()
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || '登入失敗'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 登出動作
     */
    async logout() {
      try {
        const authService = (await import('@/services/authService')).default

        // 呼叫 authService.logout()
        await authService.logout()

        this.clearAuth()
      } catch (error) {
        console.error('登出失敗:', error)
        // 即使 API 呼叫失敗，仍清除本地狀態
        this.clearAuth()
      }
    },

    /**
     * 取得當前使用者資訊
     */
    async fetchCurrentUser() {
      try {
        const authService = (await import('@/services/authService')).default

        // 呼叫 authService.getCurrentUser()
        const response = await authService.getCurrentUser()
        this.user = response.user
      } catch (error) {
        console.error('取得使用者資訊失敗:', error)
        throw error
      }
    },

    /**
     * 更新 access token
     */
    updateAccessToken(token: string) {
      this.accessToken = token
      this.lastRefresh = Date.now()
      sessionStorage.setItem('access_token', token)
    },

    /**
     * 清除認證狀態
     */
    clearAuth() {
      this.isAuthenticated = false
      this.user = null
      this.accessToken = null
      this.lastRefresh = null
      this.error = null
      sessionStorage.removeItem('access_token')
    },

    /**
     * 設定錯誤訊息
     */
    setError(message: string) {
      this.error = message
    },
  },
})
