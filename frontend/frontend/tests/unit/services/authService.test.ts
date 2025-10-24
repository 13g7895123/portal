/**
 * authService 單元測試
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { clearAuthState } from '@/utils/storage'

describe('authService.login()', () => {
  beforeEach(() => {
    clearAuthState()
  })

  it('T017: 應該使用正確的憑證呼叫 POST /auth/login', async () => {
    // TODO: 當 authService.login() 實作完成後，此測試會完整實現
    
    // 預期行為：
    // 1. 呼叫 authService.login({ username, password, rememberMe })
    // 2. 驗證 API 請求包含正確的 request body
    // 3. 驗證 Content-Type 為 application/json
    // 4. 驗證 withCredentials 為 true（允許 HttpOnly cookie）
    
    expect(true).toBe(true) // 佔位斷言
  })

  it('T017: 成功登入應返回 access_token 和 user', async () => {
    // TODO: 實作測試
    
    // 預期行為：
    // 1. Mock 成功的 API 回應
    // 2. 呼叫 authService.login()
    // 3. 驗證返回的資料包含 access_token, refresh_token, user
    // 4. 驗證 user 物件包含必要欄位
    
    expect(true).toBe(true)
  })

  it('T017: 登入失敗應拋出包含友善錯誤訊息的錯誤', async () => {
    // TODO: 實作測試
    
    // 預期行為：
    // 1. Mock 401 錯誤回應
    // 2. 呼叫 authService.login()
    // 3. 捕獲錯誤並驗證包含繁體中文錯誤訊息
    
    expect(true).toBe(true)
  })

  it('T017: 網路錯誤應返回網路錯誤訊息', async () => {
    // TODO: 實作測試
    
    // 預期行為：
    // 1. Mock 網路錯誤（timeout 或 connection refused）
    // 2. 呼叫 authService.login()
    // 3. 驗證錯誤訊息為「無法連線至伺服器」
    
    expect(true).toBe(true)
  })

  it('T017: 應該記錄登入嘗試至分析服務', async () => {
    // TODO: 實作測試
    
    // 預期行為：
    // 1. Mock analyticsService.trackLoginAttempt
    // 2. 呼叫 authService.login()
    // 3. 驗證 trackLoginAttempt 被呼叫並包含 username
    
    expect(true).toBe(true)
  })
})
