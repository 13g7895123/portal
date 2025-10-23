// tests/unit/stores/auth.spec.ts
// Unit 測試 - Pinia Auth Store

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import type { LoginCredentials, AuthToken, UserInfo } from '@/types/auth'
import { UserRole } from '@/types/auth'

// Mock AuthService
vi.mock('@/services/authService', () => ({
  AuthService: {
    login: vi.fn(),
    verify: vi.fn()
  }
}))

// Mock useLocalStorage
vi.mock('@/composables/useLocalStorage', () => ({
  useLocalStorage: () => ({
    saveToken: vi.fn(),
    getToken: vi.fn(() => null),
    isTokenExpired: vi.fn(() => true),
    clearToken: vi.fn()
  })
}))

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Initial State', () => {
    it('應有正確的初始狀態', () => {
      const authStore = useAuthStore()

      expect(authStore.isAuthenticated).toBe(false)
      expect(authStore.user).toBeNull()
      expect(authStore.token).toBeNull()
      expect(authStore.loginTime).toBeNull()
    })
  })

  describe('Getters', () => {
    it('isTokenValid 應在無 token 時回傳 false', () => {
      const authStore = useAuthStore()

      expect(authStore.isTokenValid).toBe(false)
    })

    it('isTokenValid 應在無登入時間時回傳 false', () => {
      const authStore = useAuthStore()

      const mockToken: AuthToken = {
        accessToken: 'test_token',
        refreshToken: 'refresh_token',
        expiresIn: 3600,
        tokenType: 'Bearer'
      }

      authStore.token = mockToken
      authStore.loginTime = null

      expect(authStore.isTokenValid).toBe(false)
    })

    it('isTokenValid 應在 token 已過期時回傳 false', () => {
      const authStore = useAuthStore()

      const mockToken: AuthToken = {
        accessToken: 'test_token',
        refreshToken: 'refresh_token',
        expiresIn: 3600,
        tokenType: 'Bearer'
      }

      authStore.token = mockToken
      // 設定為 2 小時前（已過期）
      authStore.loginTime = Date.now() - 7200 * 1000

      expect(authStore.isTokenValid).toBe(false)
    })

    it('isTokenValid 應在 token 有效時回傳 true', () => {
      const authStore = useAuthStore()

      const mockToken: AuthToken = {
        accessToken: 'test_token',
        refreshToken: 'refresh_token',
        expiresIn: 3600,
        tokenType: 'Bearer'
      }

      authStore.token = mockToken
      // 設定為剛登入
      authStore.loginTime = Date.now()

      expect(authStore.isTokenValid).toBe(true)
    })
  })

  describe('Actions', () => {
    describe('setAuth', () => {
      it('應正確設定認證狀態', () => {
        const authStore = useAuthStore()

        const mockUser: UserInfo = {
          id: 'user-001',
          username: 'test@example.com',
          displayName: '測試使用者',
          email: 'test@example.com',
          role: UserRole.USER,
          permissions: ['read']
        }

        const mockToken: AuthToken = {
          accessToken: 'test_token',
          refreshToken: 'refresh_token',
          expiresIn: 3600,
          tokenType: 'Bearer'
        }

        const beforeTime = Date.now()
        authStore.setAuth(mockUser, mockToken)
        const afterTime = Date.now()

        expect(authStore.isAuthenticated).toBe(true)
        expect(authStore.user).toEqual(mockUser)
        expect(authStore.token).toEqual(mockToken)
        expect(authStore.loginTime).toBeGreaterThanOrEqual(beforeTime)
        expect(authStore.loginTime).toBeLessThanOrEqual(afterTime)
      })
    })

    describe('clearAuth', () => {
      it('應清除所有認證狀態', () => {
        const authStore = useAuthStore()

        // 先設定認證狀態
        const mockUser: UserInfo = {
          id: 'user-001',
          username: 'test@example.com',
          displayName: '測試使用者',
          role: UserRole.USER
        }

        const mockToken: AuthToken = {
          accessToken: 'test_token',
          expiresIn: 3600,
          tokenType: 'Bearer'
        }

        authStore.setAuth(mockUser, mockToken)

        // 清除狀態
        authStore.clearAuth()

        expect(authStore.isAuthenticated).toBe(false)
        expect(authStore.user).toBeNull()
        expect(authStore.token).toBeNull()
        expect(authStore.loginTime).toBeNull()
      })
    })

    describe('updateUser', () => {
      it('應更新使用者資訊', () => {
        const authStore = useAuthStore()

        const mockUser: UserInfo = {
          id: 'user-001',
          username: 'test@example.com',
          displayName: '測試使用者',
          role: UserRole.USER
        }

        authStore.user = mockUser

        // 更新使用者資訊
        authStore.updateUser({
          displayName: '新的名稱',
          email: 'newemail@example.com'
        })

        expect(authStore.user?.displayName).toBe('新的名稱')
        expect(authStore.user?.email).toBe('newemail@example.com')
        // 其他欄位應該保持不變
        expect(authStore.user?.id).toBe('user-001')
        expect(authStore.user?.username).toBe('test@example.com')
      })

      it('應在無使用者時不做任何事', () => {
        const authStore = useAuthStore()

        authStore.user = null

        // 嘗試更新
        authStore.updateUser({ displayName: '新的名稱' })

        expect(authStore.user).toBeNull()
      })
    })
  })

  describe('State Persistence', () => {
    it('應在設定認證時有正確的狀態', () => {
      const authStore = useAuthStore()

      expect(authStore.isAuthenticated).toBe(false)

      const mockUser: UserInfo = {
        id: 'user-001',
        username: 'test@example.com',
        displayName: '測試使用者',
        role: UserRole.USER
      }

      const mockToken: AuthToken = {
        accessToken: 'test_token',
        expiresIn: 3600,
        tokenType: 'Bearer'
      }

      authStore.setAuth(mockUser, mockToken)

      expect(authStore.isAuthenticated).toBe(true)
    })

    it('應支援多個使用者角色', () => {
      const authStore = useAuthStore()

      const adminUser: UserInfo = {
        id: 'admin-001',
        username: 'admin@example.com',
        displayName: '管理員',
        role: UserRole.ADMIN,
        permissions: ['read', 'write', 'admin']
      }

      const mockToken: AuthToken = {
        accessToken: 'admin_token',
        expiresIn: 3600,
        tokenType: 'Bearer'
      }

      authStore.setAuth(adminUser, mockToken)

      expect(authStore.user?.role).toBe(UserRole.ADMIN)
      expect(authStore.user?.permissions).toContain('admin')
    })
  })

  describe('Token Expiry Calculation', () => {
    it('應正確計算 token 過期時間', () => {
      const authStore = useAuthStore()

      const mockToken: AuthToken = {
        accessToken: 'test_token',
        expiresIn: 3600, // 1 小時
        tokenType: 'Bearer'
      }

      const loginTime = Date.now()
      authStore.token = mockToken
      authStore.loginTime = loginTime

      // Token 應該在 1 小時內有效
      const expiresAt = loginTime + mockToken.expiresIn * 1000

      expect(authStore.isTokenValid).toBe(true)

      // 模擬時間過去了 2 小時
      authStore.loginTime = Date.now() - 7200 * 1000

      expect(authStore.isTokenValid).toBe(false)
    })
  })
})
