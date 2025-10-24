/**
 * 認證相關的 TypeScript 類型定義
 */

// 登入憑證
export interface LoginCredentials {
  username: string      // 使用者帳號（3-50 字元）
  password: string      // 使用者密碼（>= 8 字元）
  rememberMe?: boolean  // 是否記住登入（預設 false）
}

// Access Token 資訊
export interface AccessToken {
  token: string         // JWT token 字串
  expiresIn: number     // 有效秒數（如 3600 = 1 小時）
  expiresAt: number     // 過期時間戳記（毫秒）
}

// 使用者資訊
export interface UserInfo {
  id: number
  username: string
  email: string
  fullName?: string | null
  department?: string | null
  region?: string | null
  isActive: boolean
  lastLoginAt?: string | null  // ISO 8601 格式
}

// 認證狀態（Pinia store）
export interface AuthState {
  isAuthenticated: boolean
  user: UserInfo | null
  accessToken: string | null
  lastRefresh: number | null
  isLoading: boolean
  error: string | null
}

// 登入嘗試記錄（localStorage）
export interface LoginAttemptRecord {
  count: number
  firstAttempt: number
  lockedUntil: number | null
}

// 離線狀態
export interface OfflineState {
  isOffline: boolean
  lastOnlineCheck: number
}
