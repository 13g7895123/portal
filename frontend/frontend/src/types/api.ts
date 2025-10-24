/**
 * API 回應類型定義
 */

import type { UserInfo } from './auth'

// 通用 API 回應格式
export interface ApiResponse<T = any> {
  status: 'success' | 'error'
  data?: T
  message?: string
  code?: number
}

// 錯誤回應
export interface ErrorResponse {
  status: 'error'
  message: string
  code: number
  errors?: Record<string, string[]>  // 驗證錯誤的詳細欄位訊息
}

// 登入回應
export interface LoginResponse {
  status: 'success'
  data: {
    access_token: string
    refresh_token: string
    token_type: 'Bearer'
    expires_in: number
    user: UserInfo
  }
}

// Token 刷新回應
export interface RefreshResponse {
  status: 'success'
  data: {
    access_token: string
    token_type: 'Bearer'
    expires_in: number
  }
}

// 取得使用者資訊回應
export interface UserInfoResponse {
  data: UserInfo
}

// 登出回應
export interface LogoutResponse {
  status: 'success'
  message: string
}
