// types/auth.ts
// 驗證相關型別定義 - Enhanced for CRM API Integration

/**
 * 使用者資訊介面 (符合 CRM API User schema)
 */
export interface UserInfo {
  id: number
  username: string
  email: string
  fullName?: string | null
  department?: string | null
  region?: string | null
  isActive: boolean
  lastLoginAt?: string | null
}

/**
 * 登入憑證介面
 */
export interface LoginCredentials {
  username: string
  password: string
  rememberMe?: boolean
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

/**
 * Access Token 資料結構
 */
export interface AccessToken {
  token: string
  expiresIn: number
  expiresAt: number
}

/**
 * JWT Payload 介面
 */
export interface JWTPayload {
  sub?: string
  exp?: number
  iat?: number
  [key: string]: any
}

/**
 * 登入嘗試記錄
 */
export interface LoginAttemptRecord {
  count: number
  lastAttempt: number
  lockedUntil?: number
}
