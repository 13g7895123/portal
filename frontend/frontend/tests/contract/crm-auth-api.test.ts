/**
 * CRM 認證 API 契約測試
 * 驗證 CRM API 符合 contracts/crm-auth-api.yaml 規格
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api/v1'

// 模擬成功的登入回應
const mockLoginSuccess = {
  status: 'success',
  data: {
    access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImV4cCI6OTk5OTk5OTk5OX0.test',
    refresh_token: 'refresh_token_mock',
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
      lastLoginAt: '2025-01-24T10:30:00Z'
    }
  }
}

// 設定 MSW 伺服器
const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('CRM Auth API - POST /auth/login', () => {
  it('T014: 應該在成功登入時返回 200 並包含 access_token 和 user', async () => {
    // 設定 mock handler
    server.use(
      http.post(`${API_BASE_URL}/auth/login`, () => {
        return HttpResponse.json(mockLoginSuccess, { status: 200 })
      })
    )

    // 發送登入請求
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'testuser',
      password: 'password123',
      rememberMe: false
    })

    // 驗證回應
    expect(response.status).toBe(200)
    expect(response.data.status).toBe('success')
    expect(response.data.data).toHaveProperty('access_token')
    expect(response.data.data).toHaveProperty('refresh_token')
    expect(response.data.data).toHaveProperty('token_type', 'Bearer')
    expect(response.data.data).toHaveProperty('expires_in', 3600)
    expect(response.data.data).toHaveProperty('user')
    
    // 驗證使用者資訊
    expect(response.data.data.user).toHaveProperty('id')
    expect(response.data.data.user).toHaveProperty('username')
    expect(response.data.data.user).toHaveProperty('email')
    expect(response.data.data.user).toHaveProperty('isActive')
  })

  it('T014: 應該在帳號密碼錯誤時返回 401', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/login`, () => {
        return HttpResponse.json(
          {
            status: 'error',
            message: '帳號或密碼錯誤',
            code: 401
          },
          { status: 401 }
        )
      })
    )

    try {
      await axios.post(`${API_BASE_URL}/auth/login`, {
        username: 'testuser',
        password: 'wrongpassword'
      })
      expect.fail('應該拋出錯誤')
    } catch (error: any) {
      expect(error.response.status).toBe(401)
      expect(error.response.data.status).toBe('error')
      expect(error.response.data.message).toBe('帳號或密碼錯誤')
      expect(error.response.data.code).toBe(401)
    }
  })

  it('T014: 應該在驗證失敗時返回 422', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/login`, () => {
        return HttpResponse.json(
          {
            status: 'error',
            message: '驗證失敗',
            errors: {
              username: ['帳號為必填欄位'],
              password: ['密碼長度至少 8 字元']
            }
          },
          { status: 422 }
        )
      })
    )

    try {
      await axios.post(`${API_BASE_URL}/auth/login`, {
        username: '',
        password: '123'
      })
      expect.fail('應該拋出錯誤')
    } catch (error: any) {
      expect(error.response.status).toBe(422)
      expect(error.response.data.status).toBe('error')
      expect(error.response.data.message).toBe('驗證失敗')
      expect(error.response.data.errors).toBeDefined()
    }
  })
})
