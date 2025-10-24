/**
 * Storage 管理工具
 * 封裝 sessionStorage 和 localStorage 操作，提供型別安全和跨分頁事件支援
 */

import type { AccessToken } from '@/types/auth'

const ACCESS_TOKEN_KEY = 'access_token'
const AUTH_TOKEN_UPDATE_KEY = 'auth_token_update'
const LOGIN_ATTEMPTS_KEY = 'login_attempts'

/**
 * 儲存 access token 至 sessionStorage
 * @param token JWT token 字串
 * @param expiresIn 有效秒數
 */
export function setAccessToken(token: string, expiresIn: number): void {
  const accessToken: AccessToken = {
    token,
    expiresIn,
    expiresAt: Date.now() + expiresIn * 1000
  }

  try {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, JSON.stringify(accessToken))
    // 觸發跨分頁同步事件
    broadcastTokenUpdate()
  } catch (error) {
    console.error('Failed to save access token:', error)
  }
}

/**
 * 從 sessionStorage 取得 access token
 * @returns Access token 物件或 null
 */
export function getAccessToken(): AccessToken | null {
  try {
    const item = sessionStorage.getItem(ACCESS_TOKEN_KEY)
    if (!item) {
      return null
    }

    return JSON.parse(item) as AccessToken
  } catch (error) {
    console.error('Failed to get access token:', error)
    return null
  }
}

/**
 * 移除 access token
 */
export function removeAccessToken(): void {
  try {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  } catch (error) {
    console.error('Failed to remove access token:', error)
  }
}

/**
 * 清除所有認證狀態
 * 包含 sessionStorage 的 access token 和 localStorage 的登入嘗試記錄
 */
export function clearAuthState(): void {
  removeAccessToken()
  removeLoginAttempts()
  // 觸發跨分頁登出事件
  broadcastAuthClear()
}

/**
 * 廣播 token 更新事件至其他分頁
 * 使用 localStorage 事件機制實現跨分頁通訊
 */
export function broadcastTokenUpdate(): void {
  try {
    // 設定一個暫時的 localStorage 值來觸發 storage 事件
    localStorage.setItem(AUTH_TOKEN_UPDATE_KEY, Date.now().toString())
    // 立即移除，避免污染 localStorage
    localStorage.removeItem(AUTH_TOKEN_UPDATE_KEY)
  } catch (error) {
    console.error('Failed to broadcast token update:', error)
  }
}

/**
 * 廣播認證清除事件至其他分頁
 */
export function broadcastAuthClear(): void {
  try {
    localStorage.setItem('auth_clear', Date.now().toString())
    localStorage.removeItem('auth_clear')
  } catch (error) {
    console.error('Failed to broadcast auth clear:', error)
  }
}

/**
 * 監聽其他分頁的 token 更新事件
 * @param callback 當其他分頁更新 token 時的回調函式
 * @returns 清除監聽器的函式
 */
export function onTokenUpdate(callback: () => void): () => void {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === AUTH_TOKEN_UPDATE_KEY && e.newValue) {
      callback()
    }
  }

  window.addEventListener('storage', handleStorageChange)

  // 返回清除監聽器的函式
  return () => {
    window.removeEventListener('storage', handleStorageChange)
  }
}

/**
 * 監聽其他分頁的登出事件
 * @param callback 當其他分頁登出時的回調函式
 * @returns 清除監聽器的函式
 */
export function onAuthClear(callback: () => void): () => void {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'auth_clear' && e.newValue) {
      callback()
    }
  }

  window.addEventListener('storage', handleStorageChange)

  return () => {
    window.removeEventListener('storage', handleStorageChange)
  }
}

// ========== Login Attempts Management ==========

interface LoginAttemptRecord {
  count: number
  firstAttempt: number
  lockedUntil: number | null
}

/**
 * 取得登入嘗試記錄
 */
export function getLoginAttempts(): LoginAttemptRecord | null {
  try {
    const item = localStorage.getItem(LOGIN_ATTEMPTS_KEY)
    if (!item) {
      return null
    }

    return JSON.parse(item) as LoginAttemptRecord
  } catch (error) {
    console.error('Failed to get login attempts:', error)
    return null
  }
}

/**
 * 儲存登入嘗試記錄
 */
export function setLoginAttempts(record: LoginAttemptRecord): void {
  try {
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(record))
  } catch (error) {
    console.error('Failed to save login attempts:', error)
  }
}

/**
 * 移除登入嘗試記錄
 */
export function removeLoginAttempts(): void {
  try {
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY)
  } catch (error) {
    console.error('Failed to remove login attempts:', error)
  }
}

/**
 * 檢查是否仍在鎖定期間
 */
export function isAccountLocked(): boolean {
  const attempts = getLoginAttempts()
  if (!attempts || !attempts.lockedUntil) {
    return false
  }

  return Date.now() < attempts.lockedUntil
}

/**
 * 取得剩餘鎖定時間（毫秒）
 */
export function getRemainingLockTime(): number {
  const attempts = getLoginAttempts()
  if (!attempts || !attempts.lockedUntil) {
    return 0
  }

  const remaining = attempts.lockedUntil - Date.now()
  return remaining > 0 ? remaining : 0
}
