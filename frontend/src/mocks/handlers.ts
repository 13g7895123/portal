// mocks/handlers.ts
// MSW Request Handlers - 模擬 CRM API 用於開發與測試

import { http, HttpResponse, delay } from 'msw'
import type { LoginCredentials, AuthToken, UserInfo } from '@/types/auth'
import type { LoginApiResponse, VerifySuccessResponse, ErrorResponse } from '@/types/api'

const BASE_URL = 'http://localhost:3000/api'

// 模擬使用者資料
const mockUsers = [
  {
    username: 'user@example.com',
    password: 'password123',
    user: {
      id: 'user-001',
      username: 'user@example.com',
      displayName: '測試使用者',
      email: 'user@example.com',
      role: 'user' as const,
      permissions: ['read']
    }
  },
  {
    username: 'admin@example.com',
    password: 'admin123',
    user: {
      id: 'admin-001',
      username: 'admin@example.com',
      displayName: '系統管理員',
      email: 'admin@example.com',
      role: 'admin' as const,
      permissions: ['read', 'write', 'admin']
    }
  }
]

// 模擬 token 資料
const mockToken: AuthToken = {
  accessToken: 'mock_access_token_' + Date.now(),
  refreshToken: 'mock_refresh_token_' + Date.now(),
  expiresIn: 3600, // 1小時
  tokenType: 'Bearer'
}

// 儲存有效的 tokens（模擬伺服器端 session）
const validTokens = new Set<string>()

export const handlers = [
  /**
   * POST /api/auth/login
   * 登入端點
   */
  http.post(`${BASE_URL}/auth/login`, async ({ request }) => {
    // 模擬網路延遲
    await delay(500)

    try {
      const credentials = (await request.json()) as LoginCredentials

      // 驗證帳號密碼
      const mockUser = mockUsers.find(
        (u) => u.username === credentials.username && u.password === credentials.password
      )

      if (!mockUser) {
        return HttpResponse.json<ErrorResponse>(
          {
            success: false,
            error: {
              message: '帳號或密碼錯誤，請重新輸入',
              type: 'auth',
              code: 'INVALID_CREDENTIALS'
            }
          },
          { status: 401 }
        )
      }

      // 產生新的 token
      const token: AuthToken = {
        ...mockToken,
        accessToken: 'mock_access_token_' + Date.now()
      }

      // 儲存 token
      validTokens.add(token.accessToken)

      // 成功回應
      return HttpResponse.json<LoginApiResponse>(
        {
          success: true,
          data: {
            user: mockUser.user,
            token
          }
        },
        { status: 200 }
      )
    } catch (error) {
      return HttpResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            message: '請求格式錯誤',
            type: 'validation',
            code: 'INVALID_REQUEST'
          }
        },
        { status: 400 }
      )
    }
  }),

  /**
   * GET /api/auth/verify
   * 驗證 token 端點
   */
  http.get(`${BASE_URL}/auth/verify`, async ({ request }) => {
    // 模擬網路延遲
    await delay(200)

    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            message: '未提供驗證憑證',
            type: 'auth',
            code: 'MISSING_TOKEN'
          }
        },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // 移除 "Bearer "

    // 檢查 token 是否有效
    if (!validTokens.has(token)) {
      return HttpResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            message: '驗證憑證無效或已過期',
            type: 'auth',
            code: 'INVALID_TOKEN'
          }
        },
        { status: 401 }
      )
    }

    // 回傳預設使用者資訊
    return HttpResponse.json<VerifySuccessResponse>(
      {
        success: true,
        data: {
          user: mockUsers[0].user
        }
      },
      { status: 200 }
    )
  }),

  /**
   * POST /api/auth/logout
   * 登出端點
   */
  http.post(`${BASE_URL}/auth/logout`, async ({ request }) => {
    await delay(200)

    const authHeader = request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      validTokens.delete(token)
    }

    return HttpResponse.json(
      {
        success: true,
        data: {
          message: '登出成功'
        }
      },
      { status: 200 }
    )
  })
]
