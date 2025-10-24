/**
 * 認證狀態 Store (Pinia)
 * 管理使用者認證狀態、tokens、使用者資訊
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, AuthState, LoginCredentials } from '@/types/auth'
import { getAccessToken, removeAccessToken, onAuthClear, clearAuthState as clearStorage } from '@/utils/storage'
import { isTokenExpired } from '@/utils/tokenUtils'
import { extractErrorMessage } from '@/utils/errorMessages'
import authService from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {
  // 狀態
  const isAuthenticated = ref<boolean>(false)
  const user = ref<UserInfo | null>(null)
  const accessToken = ref<string | null>(null)
  const lastRefresh = ref<number | null>(null)
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // Getters（computed）
  const authState = computed<AuthState>(() => ({
    isAuthenticated: isAuthenticated.value,
    user: user.value,
    accessToken: accessToken.value,
    lastRefresh: lastRefresh.value,
    isLoading: isLoading.value,
    error: error.value
  }))

  const currentUser = computed<UserInfo | null>(() => user.value)

  const isLoggedIn = computed<boolean>(() => {
    return isAuthenticated.value && !!accessToken.value && !!user.value
  })

  // Actions

  /**
   * 初始化認證狀態
   * 從 sessionStorage 恢復 token 和認證狀態
   */
  function initAuth(): void {
    const tokenData = getAccessToken()
    if (tokenData && tokenData.token && !isTokenExpired(tokenData.token)) {
      accessToken.value = tokenData.token
      isAuthenticated.value = true
      // 注意：使用者資訊會在後續的 API 請求中取得
    } else {
      clearAuthState()
    }

    // 監聽其他分頁的登出事件
    onAuthClear(() => {
      clearAuthState()
    })
  }

  /**
   * 設定載入狀態
   * @param loading 是否載入中
   */
  function setLoading(loading: boolean): void {
    isLoading.value = loading
  }

  /**
   * 設定錯誤訊息
   * @param errorMessage 錯誤訊息
   */
  function setError(errorMessage: string | null): void {
    error.value = errorMessage
  }

  /**
   * 清除錯誤訊息
   */
  function clearError(): void {
    error.value = null
  }

  /**
   * 設定使用者資訊
   * @param userInfo 使用者資訊
   */
  function setUser(userInfo: UserInfo): void {
    user.value = userInfo
  }

  /**
   * 設定 access token
   * @param token JWT token 字串
   */
  function setAccessToken(token: string): void {
    accessToken.value = token
    isAuthenticated.value = true
  }

  /**
   * 更新最後刷新時間
   */
  function updateLastRefresh(): void {
    lastRefresh.value = Date.now()
  }

  /**
   * 清除認證狀態
   * 登出或 token 失效時呼叫
   */
  function clearAuthState(): void {
    isAuthenticated.value = false
    user.value = null
    accessToken.value = null
    lastRefresh.value = null
    error.value = null
    removeAccessToken()
  }

  /**
   * 登入 action
   * @param credentials 登入憑證
   */
  async function login(credentials: LoginCredentials): Promise<void> {
    setLoading(true)
    clearError()

    try {
      // 呼叫 authService.login()
      const loginData = await authService.login(credentials)

      // 更新認證狀態
      setAccessToken(loginData.access_token)
      setUser(loginData.user)
      
      // 注意：refresh_token 已由後端設定在 HttpOnly cookie 中
    } catch (err: any) {
      // 提取友善的錯誤訊息
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * 登出 action
   * User Story 3 會完整實作
   */
  async function logout(): Promise<void> {
    setLoading(true)

    try {
      // 呼叫 authService.logout()
      await authService.logout()
      
      // 清除本地狀態
      clearAuthState()
      clearStorage()
    } catch (err: any) {
      // 即使 API 失敗，也應該清除本地狀態
      clearAuthState()
      clearStorage()
      
      console.error('Logout error:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 刷新 token action
   * User Story 2 會完整實作
   */
  async function refreshToken(): Promise<void> {
    try {
      const newToken = await authService.refreshToken()
      setAccessToken(newToken)
      updateLastRefresh()
    } catch (err: any) {
      // Token 刷新失敗，清除認證狀態並重定向至登入頁面
      clearAuthState()
      clearStorage()
      
      throw err
    }
  }

  /**
   * 取得使用者資訊 action
   * User Story 3 會完整實作
   */
  async function fetchUser(): Promise<void> {
    try {
      const userInfo = await authService.getCurrentUser()
      setUser(userInfo)
    } catch (err: any) {
      console.error('Fetch user error:', err)
      throw err
    }
  }

  return {
    // 狀態
    isAuthenticated,
    user,
    accessToken,
    lastRefresh,
    isLoading,
    error,

    // Getters
    authState,
    currentUser,
    isLoggedIn,

    // Actions
    initAuth,
    setLoading,
    setError,
    clearError,
    setUser,
    setAccessToken,
    updateLastRefresh,
    clearAuthState,
    login,
    logout,
    refreshToken,
    fetchUser
  }
})
