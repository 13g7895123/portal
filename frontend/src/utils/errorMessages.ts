/**
 * 錯誤訊息對應表（繁體中文）
 * 將 API 錯誤代碼對應至使用者友善的繁體中文訊息
 */

export const ERROR_MESSAGES: Record<string, string> = {
  // 認證錯誤
  INVALID_CREDENTIALS: '帳號或密碼錯誤',
  UNAUTHORIZED: '登入已過期，請重新登入',
  TOKEN_EXPIRED: '登入已過期，請重新登入',
  TOKEN_INVALID: 'Token 無效',
  REFRESH_TOKEN_EXPIRED: 'Refresh token 無效或已過期，請重新登入',

  // 網路錯誤
  NETWORK_ERROR: '無法連線至伺服器，請稍後再試',
  TIMEOUT: '請求逾時，請檢查網路連線',
  CONNECTION_FAILED: '連線失敗，請檢查網路連線',

  // 速率限制
  ACCOUNT_LOCKED: '登入失敗次數過多，請稍後再試',
  RATE_LIMIT_EXCEEDED: '登入嘗試過於頻繁，請稍後再試',

  // 驗證錯誤
  VALIDATION_ERROR: '驗證失敗',
  REQUIRED_FIELD: '此欄位為必填',
  INVALID_EMAIL: 'Email 格式不正確',
  INVALID_USERNAME: '帳號格式不正確',
  PASSWORD_TOO_SHORT: '密碼長度至少 8 字元',

  // 伺服器錯誤
  SERVER_ERROR: '伺服器錯誤，請稍後再試',
  SERVICE_UNAVAILABLE: '服務暫時無法使用，請稍後再試',

  // 離線狀態
  OFFLINE: '無網路連線',

  // 未知錯誤
  UNKNOWN_ERROR: '發生未知錯誤，請聯絡客服'
}

/**
 * 根據錯誤代碼或訊息取得繁體中文錯誤訊息
 * @param errorCode 錯誤代碼或訊息
 * @param fallback 當找不到對應訊息時的預設訊息
 * @returns 繁體中文錯誤訊息
 */
export function getErrorMessage(errorCode: string, fallback?: string): string {
  return ERROR_MESSAGES[errorCode] || fallback || ERROR_MESSAGES.UNKNOWN_ERROR
}

/**
 * 從 Axios 錯誤物件中提取錯誤訊息
 * @param error Axios 錯誤物件
 * @returns 繁體中文錯誤訊息
 */
export function extractErrorMessage(error: any): string {
  // 離線狀態
  if (!navigator.onLine) {
    return ERROR_MESSAGES.OFFLINE
  }

  // 網路錯誤
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return ERROR_MESSAGES.TIMEOUT
    }
    return ERROR_MESSAGES.NETWORK_ERROR
  }

  // HTTP 狀態碼錯誤
  const status = error.response.status
  const data = error.response.data

  // 優先使用後端返回的訊息
  if (data?.message) {
    return data.message
  }

  // 根據狀態碼返回預設訊息
  switch (status) {
    case 401:
      return ERROR_MESSAGES.INVALID_CREDENTIALS
    case 422:
      return ERROR_MESSAGES.VALIDATION_ERROR
    case 429:
      return ERROR_MESSAGES.RATE_LIMIT_EXCEEDED
    case 500:
    case 502:
    case 503:
      return ERROR_MESSAGES.SERVER_ERROR
    default:
      return ERROR_MESSAGES.UNKNOWN_ERROR
  }
}
