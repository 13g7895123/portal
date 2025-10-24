/**
 * MSW (Mock Service Worker) 測試設定
 * 用於契約測試和整合測試中模擬 CRM API 回應
 */

import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// 建立 MSW 測試伺服器
export const server = setupServer(...handlers)

// 在所有測試開始前啟動 MSW 伺服器
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' })
})

// 每個測試後重置 handlers 為預設狀態
afterEach(() => {
  server.resetHandlers()
})

// 所有測試結束後關閉 MSW 伺服器
afterAll(() => {
  server.close()
})
