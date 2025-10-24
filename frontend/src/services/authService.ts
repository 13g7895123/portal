import api from './api'
import type { UserInfo } from '@/types/auth'

/**
 * 登入請求介面
 */
export interface LoginRequest {
  username: string
  password: string
  remember_me?: boolean
}

/**
 * 登入回應介面
 */
export interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: UserInfo
}

/**
 * Token 更新回應介面
 */
export interface RefreshResponse {
  access_token: string
  token_type: string
  expires_in: number
}

/**
 * Authentication Service
 *
 * 處理所有認證相關的 API 呼叫
 */
class AuthService {
  /**
   * 登入
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/api/v1/auth/login', credentials)
    return response.data
  }

  /**
   * 登出
   */
  async logout(): Promise<void> {
    await api.post('/api/v1/auth/logout')
  }

  /**
   * 更新 access token
   */
  async refreshToken(): Promise<RefreshResponse> {
    const response = await api.post<RefreshResponse>('/api/v1/auth/refresh')
    return response.data
  }

  /**
   * 取得當前使用者資訊
   */
  async getCurrentUser(): Promise<{ user: UserInfo }> {
    const response = await api.get<{ user: UserInfo }>('/api/v1/auth/me')
    return response.data
  }
}

// Export singleton instance
export default new AuthService()
