// composables/useAuth.ts
// 認證組合式函式 - 提供登入、登出與使用者資訊管理

import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import type { LoginCredentials } from '@/types/auth'

/**
 * 認證 Composable
 * 提供認證相關功能的組合式函式
 */
export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

  // Computed properties
  const isAuthenticated = computed(() => authStore.isLoggedIn)
  const user = computed(() => authStore.user)
  const isLoading = computed(() => authStore.isLoading)
  const error = computed(() => authStore.error)

  /**
   * 登入
   */
  const login = async (credentials: LoginCredentials) => {
    try {
      const { username, password, rememberMe = false } = credentials
      await authStore.login(username, password, rememberMe)

      // 登入成功後重定向到應用程式中心
      await router.push({ name: 'app-center' })

      return { success: true }
    } catch (err: any) {
      // 錯誤已經由 authStore 設定到 error 狀態
      return {
        success: false,
        error: authStore.error || '登入失敗，請稍後再試',
      }
    }
  }

  /**
   * 登出
   */
  const logout = async () => {
    try {
      await authStore.logout()

      // 登出後重定向到登入頁
      await router.push({ name: 'login' })

      return { success: true }
    } catch (err: any) {
      console.error('登出錯誤:', err)
      return {
        success: false,
        error: err.message || '登出失敗',
      }
    }
  }

  /**
   * 取得當前使用者資訊
   */
  const fetchCurrentUser = async () => {
    try {
      await authStore.fetchCurrentUser()
      return { success: true }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || '取得使用者資訊失敗',
      }
    }
  }

  /**
   * 檢查認證狀態並在需要時更新使用者資訊
   */
  const checkAuthStatus = async () => {
    if (isAuthenticated.value && !user.value) {
      // 有 token 但沒有使用者資訊，嘗試取得
      await fetchCurrentUser()
    }
  }

  return {
    // State
    isAuthenticated,
    user,
    isLoading,
    error,

    // Actions
    login,
    logout,
    fetchCurrentUser,
    checkAuthStatus,
  }
}
