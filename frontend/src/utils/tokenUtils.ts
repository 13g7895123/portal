/**
 * JWT Token 工具函式
 * 提供 JWT 解析、過期檢查、驗證等功能
 */

interface JWTPayload {
  sub: string          // user ID
  username?: string
  exp: number          // expiry timestamp (seconds)
  iat: number          // issued at (seconds)
  [key: string]: any   // 其他可能的欄位
}

/**
 * 解碼 JWT token（不驗證簽章）
 * @param token JWT token 字串
 * @returns 解碼後的 payload 或 null
 */
export function parseJWT(token: string): JWTPayload | null {
  try {
    // JWT 格式: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // Base64 解碼 payload（第二部分）
    const payload = parts[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded) as JWTPayload
  } catch (error) {
    console.error('Failed to parse JWT:', error)
    return null
  }
}

/**
 * 從 JWT token 中提取過期時間戳記
 * @param token JWT token 字串
 * @returns 過期時間戳記（毫秒）或 null
 */
export function getTokenExpiry(token: string): number | null {
  const payload = parseJWT(token)
  if (!payload || !payload.exp) {
    return null
  }

  // JWT exp 是秒，轉換為毫秒
  return payload.exp * 1000
}

/**
 * 檢查 token 是否已過期
 * @param token JWT token 字串
 * @returns true 表示已過期，false 表示仍有效
 */
export function isTokenExpired(token: string): boolean {
  const expiryTime = getTokenExpiry(token)
  if (!expiryTime) {
    return true // 無法取得過期時間，視為已過期
  }

  return Date.now() >= expiryTime
}

/**
 * 檢查 token 是否即將過期（剩餘時間 < 5 分鐘）
 * @param token JWT token 字串
 * @param thresholdMinutes 過期閾值（分鐘），預設 5 分鐘
 * @returns true 表示即將過期，false 表示仍有充足時間
 */
export function isTokenExpiring(token: string, thresholdMinutes: number = 5): boolean {
  const expiryTime = getTokenExpiry(token)
  if (!expiryTime) {
    return true // 無法取得過期時間，視為即將過期
  }

  const thresholdMs = thresholdMinutes * 60 * 1000
  const remainingTime = expiryTime - Date.now()

  return remainingTime < thresholdMs && remainingTime > 0
}

/**
 * 取得 token 剩餘有效時間（毫秒）
 * @param token JWT token 字串
 * @returns 剩餘時間（毫秒）或 0（已過期或無效）
 */
export function getTokenRemainingTime(token: string): number {
  const expiryTime = getTokenExpiry(token)
  if (!expiryTime) {
    return 0
  }

  const remaining = expiryTime - Date.now()
  return remaining > 0 ? remaining : 0
}

/**
 * 驗證 token 格式是否正確（基本檢查）
 * @param token JWT token 字串
 * @returns true 表示格式正確，false 表示格式錯誤
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }

  // JWT 應該由三個部分組成，用 . 分隔
  const parts = token.split('.')
  if (parts.length !== 3) {
    return false
  }

  // 檢查每個部分是否為 base64 字串
  const base64Regex = /^[A-Za-z0-9_-]+$/
  return parts.every(part => base64Regex.test(part))
}
