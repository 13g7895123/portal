/**
 * MSW Request Handlers
 * 定義 CRM API 端點的模擬回應
 */

import { http, HttpResponse } from 'msw'

const API_BASE_URL = import.meta.env.VITE_CRM_API_URL || 'http://localhost:3000/api/v1'

export const handlers = [
  // 預設處理器 - 可在個別測試中覆寫
  // 實際的 handler 會在契約測試中定義
]

// 成功登入的模擬回應
export const mockLoginSuccess = {
  status: 'success',
  data: {
    access_token: 'mock_access_token_12345',
    refresh_token: 'mock_refresh_token_67890',
    token_type: 'Bearer',
    expires_in: 3600,
    user: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      fullName: '測試使用者',
      department: 'IT',
      region: 'TW',
      isActive: true,
      lastLoginAt: new Date().toISOString()
    }
  }
}

// 登入失敗的模擬回應
export const mockLoginError = {
  status: 'error',
  message: '帳號或密碼錯誤',
  code: 401
}

// Token 刷新成功的模擬回應
export const mockRefreshSuccess = {
  status: 'success',
  data: {
    access_token: 'new_mock_access_token_99999',
    token_type: 'Bearer',
    expires_in: 3600
  }
}
