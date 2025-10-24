/**
 * 認證服務
 * 處理與 CRM API 的認證相關請求
 */

import apiClient from './api'
import type { LoginCredentials, UserInfo } from '@/types/auth'
import type { LoginResponse, RefreshResponse, UserInfoResponse, LogoutResponse } from '@/types/api'
import { setAccessToken } from '@/utils/storage'
import analyticsService from './analyticsService'

class AuthService {
  /**
   * 使用者登入
   * @param credentials 登入憑證（username, password, rememberMe）
   * @returns 登入回應（包含 tokens 和使用者資訊）
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse['data']> {
    const startTime = Date.now()
    
    try {
      // 記錄登入嘗試
      analyticsService.trackLoginAttempt(credentials.username)
      
      // 呼叫登入 API
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        username: credentials.username,
        password: credentials.password,
        rememberMe: credentials.rememberMe || false
      })

      const responseTime = Date.now() - startTime
      
      // 記錄登入成功
      analyticsService.trackLoginSuccess(credentials.username, responseTime)
      
      // 儲存 access token 至 sessionStorage
      if (response.data.data.access_token && response.data.data.expires_in) {
        setAccessToken(response.data.data.access_token, response.data.data.expires_in)
      }
      
      return response.data.data
    } catch (error: any) {
      // 記錄登入失敗
      const errorCode = error.response?.status?.toString() || 'NETWORK_ERROR'
      analyticsService.trackLoginFailure(credentials.username, errorCode)
      
      throw error
    }
  }

  /**
   * 使用者登出
   * @returns 登出回應
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post<LogoutResponse>('/auth/logout')
      
      // 登出成功會在 auth store 中處理
    } catch (error: any) {
      // 即使登出 API 失敗，也應該清除本地狀態
      console.error('Logout API failed:', error)
      throw error
    }
  }

  /**
   * 刷新 access token
   * @returns 新的 access token
   */
  async refreshToken(): Promise<string> {
    try {
      analyticsService.trackTokenRefreshStart()
      
      const startTime = Date.now()
      const response = await apiClient.post<RefreshResponse>('/auth/refresh')
      
      const responseTime = Date.now() - startTime
      analyticsService.trackTokenRefreshSuccess(responseTime)
      
      // 儲存新的 access token
      if (response.data.data.access_token && response.data.data.expires_in) {
        setAccessToken(response.data.data.access_token, response.data.data.expires_in)
      }
      
      return response.data.data.access_token
    } catch (error: any) {
      const errorCode = error.response?.status?.toString() || 'NETWORK_ERROR'
      analyticsService.trackTokenRefreshFailure(errorCode)
      
      throw error
    }
  }

  /**
   * 取得當前使用者資訊
   * @returns 使用者資訊
   */
  async getCurrentUser(): Promise<UserInfo> {
    try {
      const response = await apiClient.get<UserInfoResponse>('/auth/me')
      return response.data.data
    } catch (error: any) {
      console.error('Get current user failed:', error)
      throw error
    }
  }
}

// 匯出單例
export const authService = new AuthService()
export default authService
