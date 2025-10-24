/**
 * Axios 實例配置與攔截器
 * 提供統一的 API 請求介面，處理認證、錯誤和 token 刷新
 */

import axios, type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { getAccessToken, setAccessToken } from '@/utils/storage'
import { extractErrorMessage } from '@/utils/errorMessages'

// API 基礎 URL（從環境變數取得）
const API_BASE_URL = import.meta.env.VITE_CRM_API_URL || 'http://localhost:3000/api/v1'

// 請求逾時設定（10-15 秒）
const REQUEST_TIMEOUT = 15000

// 建立 Axios 實例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true  // 允許傳送 HttpOnly cookie
})

// 請求攔截器：自動附加 access_token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 從 sessionStorage 取得 access token
    const tokenData = getAccessToken()
    if (tokenData && tokenData.token) {
      config.headers.Authorization = `Bearer ${tokenData.token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 回應攔截器：處理 401 錯誤和 token 刷新
// 注意：實際的 token 刷新邏輯會在 User Story 2 實作
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: AxiosError) => {
    // 提取友善的錯誤訊息
    const errorMessage = extractErrorMessage(error)

    // 將錯誤訊息附加到 error 物件
    if (error.response) {
      error.response.data = {
        ...error.response.data,
        friendlyMessage: errorMessage
      }
    } else {
      // 網路錯誤或逾時
      error.message = errorMessage
    }

    // TODO: User Story 2 會在此處實作 401 錯誤處理和 token 刷新邏輯
    // if (error.response?.status === 401) {
    //   // 嘗試刷新 token 並重試請求
    // }

    return Promise.reject(error)
  }
)

export default apiClient
