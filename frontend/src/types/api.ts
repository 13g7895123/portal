// types/api.ts
// API 回應型別定義 - Enhanced for CRM API Integration

import type { UserInfo } from './auth'

/**
 * API 成功回應介面
 */
export interface ApiSuccessResponse<T = any> {
  status: 'success'
  data: T
}

/**
 * API 錯誤回應介面
 */
export interface ApiErrorResponse {
  status: 'error'
  message: string
  errors?: Record<string, string[]>
}

/**
 * 登入回應資料
 */
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

/**
 * Token 更新回應資料
 */
export interface RefreshResponse {
  status: 'success'
  data: {
    access_token: string
    token_type: 'Bearer'
    expires_in: number
  }
}

export enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'auth',
  VALIDATION = 'validation',
  TIMEOUT = 'timeout',
  SERVER = 'server',
  UNKNOWN = 'unknown'
}

export interface ErrorMessage {
  message: string
  type: ErrorType
  code?: string
}

// API 回應型別
export interface LoginSuccessResponse {
  success: true
  data: {
    user: UserInfo
    token: AuthToken
  }
  message?: string
}

export interface LoginErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type LoginApiResponse = LoginSuccessResponse | LoginErrorResponse

export interface VerifySuccessResponse {
  success: true
  data: {
    user: UserInfo
  }
  message?: string
}

export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}
