# 研究與技術決策

**功能**: CRM 登入整合
**日期**: 2025-01-24
**階段**: Phase 0

## 概述

本文件記錄CRM 登入整合功能的技術研究結果與設計決策。所有決策基於現有專案技術棧（Vue 3 + TypeScript + Pinia）與憲章要求。

## 技術決策

### 1. HTTP 客戶端與攔截器設計

**決策**: 使用 Axios 攔截器模式處理 token 管理與 401 錯誤

**理由**:
- 專案已使用 Axios 1.x
- Axios interceptors 提供集中化的請求/回應處理
- 可透過攔截器實現自動 token 附加、401 錯誤處理、請求重試
- 支援請求佇列機制，避免 token 刷新期間的競爭條件

**實作方式**:
```typescript
//  frontend/src/services/api.ts 的攔截器模式：
// 1. Request Interceptor: 自動從 sessionStorage 讀取 access_token 並附加到 Authorization header
// 2. Response Interceptor:
//    - 攔截 401 錯誤
//    - 使用 refresh_token 呼叫 /auth/refresh
//    - 更新 sessionStorage 中的 access_token
//    - 重試原始請求
//    - 若 refresh 失敗（401），清除所有認證狀態並重定向至登入頁
```

**替代方案考慮**:
- **Fetch API + 手動包裝**: 更輕量但需要更多手動實作，Axios 提供更好的錯誤處理和攔截器支援
- **Vue Query / TanStack Query**: 過於複雜，本功能不需要快取和背景重新驗證

### 2. Token 儲存策略

**決策**:
- Access Token → sessionStorage (用戶端可讀可寫)
- Refresh Token → HttpOnly Cookie (後端設定，用戶端無法透過 JavaScript 存取)

**理由**:
- **Access Token 在 sessionStorage**:
  - 前端需要讀取 token 以檢查過期時間和附加到請求
  - sessionStorage 限於單一分頁生命週期，關閉分頁即清除
  - 透過 localStorage events 可實現跨分頁同步
- **Refresh Token 在 HttpOnly Cookie**:
  - 最高安全性，防止 XSS 攻擊竊取
  - 由後端在 `/auth/login` 回應時自動設定
  - `/auth/refresh` 請求時瀏覽器自動帶上 cookie，無需前端處理

**安全性考量**:
- sessionStorage 比 localStorage 更安全（限於分頁生命週期）
- HttpOnly cookie 無法被 JavaScript 讀取，即使有 XSS 漏洞也無法竊取 refresh token
- 所有 CRM API 請求使用 HTTPS (production)

**替代方案考慮**:
- **兩者都用 HttpOnly Cookie**: 前端無法讀取 token 檢查過期，需依賴後端每次回應附加過期資訊
- **兩者都用 sessionStorage/localStorage**: refresh token 暴露於 XSS 風險，安全性較低

### 3. 多分頁 Token 同步機制

**決策**: 使用 `localStorage` + `storage` 事件廣播 token 更新

**理由**:
- `storage` 事件是瀏覽器原生機制，當一個分頁修改 localStorage 時，其他分頁會收到事件
- 實作簡單，無需額外依賴
- 即時同步，無延遲
- 支援雙向通訊（登入、登出、token 刷新）

**實作方式**:
```typescript
// 分頁 A 刷新 token 時：
// 1. 更新 sessionStorage 的 access_token
// 2. 同時設定 localStorage 的 'auth_token_update' 鍵值（帶時間戳）
// 3. 分頁 B、C、D 監聽 storage 事件
// 4. 偵測到 'auth_token_update' 變更時，從 sessionStorage 讀取最新 token
```

**edge case 處理**:
- 分頁 A 登出時，透過 localStorage 廣播 'auth_logout' 事件，其他分頁立即清除本地 token 並重定向
- 使用時間戳避免舊事件誤觸發

**替代方案考慮**:
- **BroadcastChannel API**: 更現代但瀏覽器支援度較低（IE 不支援）
- **SharedWorker**: 過於複雜，需要額外基礎設施
- **定期輪詢 sessionStorage**: 有延遲，效率低

### 4. Token 自動刷新策略

**決策**: 在 access_token 剩餘有效時間 < 5 分鐘時自動刷新

**理由**:
- 規格要求：FR-009 規定 < 5 分鐘時刷新
- 避免使用者操作中途 token 過期
- 提供充足緩衝時間（access_token 有效期 1 小時）

**實作方式**:
```typescript
// frontend/src/composables/useTokenRefresh.ts
// 使用 Vue's watchEffect + setInterval:
// 1. 解析 access_token，取得 exp (過期時間戳)
// 2. 每 1 分鐘檢查一次剩餘時間
// 3. 若剩餘 < 5 分鐘，呼叫 authService.refreshToken()
// 4. 更新 sessionStorage 與 localStorage (觸發其他分頁同步)
```

**防抖機制**:
- 使用全域標記避免多次同時刷新（例如多個元件同時掛載）
- 刷新進行中時，其他請求進入佇列等待

**替代方案考慮**:
- **被動刷新（僅在 API 返回 401 時）**: 可能導致使用者操作中斷
- **更頻繁檢查（每 10 秒）**: 資源浪費
- **使用 Web Worker**: 過於複雜，本功能無需背景執行緒

### 5. 登入失敗鎖定機制

**決策**: 前端 + 後端雙重實作，使用 localStorage 記錄失敗次數

**理由**:
- 規格要求：FR-017 規定 3-5 次失敗後鎖定 15 分鐘
- **前端鎖定**: 提供即時反饋，避免不必要的 API 請求
- **後端鎖定**: 真正的安全防護，防止繞過前端驗證

**實作方式**:
```typescript
// frontend/src/composables/useLoginRateLimit.ts
// localStorage 儲存結構：
// {
//   "login_attempts": {
//     "count": 3,
//     "firstAttempt": 1706000000000,
//     "lockedUntil": 1706000900000  // 15 分鐘後
//   }
// }
//
// 邏輯：
// 1. 登入失敗時遞增 count
// 2. count >= 3 時，設定 lockedUntil = now + 15 * 60 * 1000
// 3. 登入前檢查 lockedUntil，若未過期則顯示剩餘時間並禁用按鈕
// 4. 登入成功時清除計數
```

**顯示訊息**: 「登入失敗次數過多，請在 {剩餘分鐘} 後再試」

**替代方案考慮**:
- **僅後端鎖定**: 用戶體驗較差，需等待 API 回應才知道被鎖
- **使用 sessionStorage**: 關閉分頁後鎖定失效，安全性較低

### 6. 離線偵測

**決策**: 使用 `navigator.onLine` + 定期 ping 健康檢查

**理由**:
- `navigator.onLine` 提供瀏覽器層級的網路狀態
- 監聽 `online`/`offline` 事件以即時更新 UI
- 定期 ping（每 30 秒）CRM API 健康端點以驗證實際連通性

**實作方式**:
```typescript
// frontend/src/composables/useOfflineDetection.ts
// 1. 初始狀態 = navigator.onLine
// 2. 監聽 window.addEventListener('online', ...) 和 'offline'
// 3. 每 30 秒 ping /health 或類似端點
// 4. 狀態變更時更新 Pinia store (ui.ts: isOffline)
// 5. OfflineIndicator.vue 元件訂閱 store 並顯示全域訊息
```

**UI 行為**:
- 離線時: 顯示頂部橫幅「無網路連線」，禁用登入按鈕和所有 API 操作
- 恢復線上時: 自動移除橫幅，重新啟用功能

**替代方案考慮**:
- **僅依賴 `navigator.onLine`**: 不夠準確（可能顯示 online 但實際無法連到後端）
- **每次請求失敗才判斷**: 反應太慢，用戶體驗差

### 7. 錯誤訊息本地化

**決策**: 建立 `errorMessages.ts` 映射表，所有錯誤碼對應繁體中文訊息

**理由**:
- 憲章要求：所有使用者面向內容必須使用繁體中文
- 集中管理易於維護和翻譯
- CRM API 可能返回英文錯誤，需轉換為友善訊息

**實作方式**:
```typescript
// frontend/src/utils/errorMessages.ts
export const ERROR_MESSAGES: Record<string, string> = {
  'INVALID_CREDENTIALS': '帳號或密碼錯誤',
  'NETWORK_ERROR': '無法連線至伺服器，請稍後再試',
  'TIMEOUT': '請求逾時，請檢查網路連線',
  'ACCOUNT_LOCKED': '登入失敗次數過多，請稍後再試',
  'TOKEN_EXPIRED': '登入已過期，請重新登入',
  'UNKNOWN_ERROR': '發生未知錯誤，請聯絡客服'
}

// 使用方式：
// catch (error) {
//   const message = ERROR_MESSAGES[error.code] || ERROR_MESSAGES.UNKNOWN_ERROR
//   showErrorToast(message)
// }
```

**替代方案考慮**:
- **Vue i18n**: 過於複雜，本功能僅支援單一語言
- **後端返回本地化訊息**: 前後端耦合，且後端可能不支援

### 8. 分析/日誌服務整合

**決策**: 建立 `analyticsService.ts` 作為抽象層，支援多種分析服務

**理由**:
- 規格要求：FR-020 規定記錄所有 API 請求、回應和使用者操作
- 抽象層允許未來切換或增加分析提供商（Google Analytics, Mixpanel, 自訂後端等）
- 集中化記錄邏輯，避免散落各處

**實作方式**:
```typescript
// frontend/src/services/analyticsService.ts
interface AnalyticsEvent {
  category: string  // 'auth', 'api', 'user_action'
  action: string    // 'login_success', 'login_failure', 'api_request'
  label?: string    // 可選的額外資訊
  value?: number    // 可選的數值（如回應時間）
  metadata?: Record<string, any>  // 額外資料
}

class AnalyticsService {
  track(event: AnalyticsEvent): void {
    // 1. 發送到瀏覽器 console (開發環境)
    // 2. 發送到後端分析端點 (生產環境)
    // 3. 可擴展：Google Analytics, Mixpanel 等
  }
}

// 使用範例：
// analyticsService.track({
//   category: 'auth',
//   action: 'login_success',
//   metadata: { username: user.username, timestamp: Date.now() }
// })
```

**記錄內容**:
- 登入嘗試（成功/失敗）
- Token 刷新（成功/失敗）
- 登出
- 所有 API 請求（端點、狀態碼、回應時間）
- 使用者操作（頁面導航、按鈕點擊）

**隱私考量**:
- 不記錄密碼或敏感個人資訊
- 遵循 GDPR/個資法規定

**替代方案考慮**:
- **直接使用 Google Analytics**: 與特定供應商綁定，難以遷移
- **僅在 Axios interceptor 記錄**: 無法追蹤 UI 操作

## 最佳實踐參考

### Vue 3 Composition API 認證模式
- **參考**: Vue 3 官方文檔 - Composables, Pinia 官方文檔 - Authentication Example
- **應用**: 使用 `useAuth` composable 封裝認證邏輯，所有元件透過 composable 訪問認證狀態和方法

### JWT Token 管理
- **參考**: OWASP Authentication Cheat Sheet, RFC 7519 (JWT)
- **應用**:
  - Access token 短期（1 小時），降低竊取風險
  - Refresh token 長期（數天），存於 HttpOnly cookie 以防 XSS
  - 使用 JWT decode 驗證 token 格式與過期時間（不驗證簽名，僅由後端驗證）

### Axios 攔截器模式
- **參考**: Axios 官方文檔 - Interceptors, JWT 刷新最佳實踐
- **應用**:
  - Request interceptor 附加 token
  - Response interceptor 處理 401，實作請求佇列避免重複刷新

### 無障礙設計 (WCAG 2.1 AA)
- **參考**: WCAG 2.1 Guidelines, Vue A11y 指南
- **應用**:
  - 表單 label 使用 `<label for="...">` 明確關聯
  - 錯誤訊息使用 `aria-live="polite"` 即時通知螢幕閱讀器
  - 鍵盤導航支援（Tab 順序、Enter 提交）
  - 顏色對比度 >= 4.5:1

### TypeScript 類型安全
- **參考**: TypeScript 官方 Handbook, Vue 3 TypeScript Support
- **應用**:
  - 所有 API 回應定義介面（LoginResponse, RefreshResponse, UserInfo）
  - Pinia stores 使用強型別定義 state, getters, actions
  - Composables 返回型別明確定義

## 技術風險與緩解

### 風險 1: Token 刷新期間的請求競爭

**風險描述**: 多個同時發出的 API 請求都收到 401，可能觸發多次 token 刷新

**緩解措施**:
- 實作請求佇列機制
- 使用全域標記 `isRefreshing` 防止重複刷新
- 刷新進行中的請求進入佇列，刷新完成後批次重試

**實作細節**: 參考 axios-auth-refresh 套件模式（不直接使用，自行實作以符合需求）

### 風險 2: localStorage 事件同步延遲

**風險描述**: 分頁間的 storage 事件可能有微小延遲，導致短暫不同步

**緩解措施**:
- 同時更新 sessionStorage（本地立即生效）和 localStorage（廣播到其他分頁）
- 事件處理器中加入時間戳驗證，忽略舊事件

### 風險 3: 瀏覽器關閉時 sessionStorage 清除

**風險描述**: sessionStorage 在分頁關閉時清除，使用者需重新登入

**說明**: 這是預期行為，符合安全最佳實踐（不持久化 access token）

**使用者溝通**: 文件中說明需保持分頁開啟以維持登入狀態

### 風險 4: HttpOnly Cookie 在某些環境失效

**風險描述**: 某些瀏覽器設定或企業政策可能阻擋 HttpOnly cookies

**緩解措施**:
- 在登入失敗後檢查是否為 cookie 問題（後端回應特定錯誤碼）
- 顯示清晰錯誤訊息：「瀏覽器設定阻擋了必要的功能，請檢查 Cookie 設定」
- 提供替代方案文件（引導使用者調整設定）

## 效能考量

### 目標 vs 實作

| 指標 | 目標 | 實作策略 |
|------|------|----------|
| 登入流程 | < 3 秒 | CRM API 呼叫 + token 儲存 + 路由跳轉，預期 1-2 秒（網路良好時） |
| Token 刷新 | 無感知 | 背景執行，interceptor 自動處理，用戶端處理 < 100ms |
| 登出流程 | < 2 秒 | API 呼叫 + localStorage 清除 + 路由跳轉，預期 < 1 秒 |
| 多分頁同步 | 即時 | localStorage 事件為瀏覽器原生，延遲 < 10ms |

### 最佳化措施

1. **減少 API 往返**:
   - `/auth/login` 一次返回 access_token + refresh_token + user
   - 避免登入後立即再呼叫 `/auth/me`

2. **Lazy Loading**:
   - AppCenterPage 使用 Vue Router 的動態 import，減少初始包大小

3. **快取使用者資訊**:
   - 成功登入後將 user 存於 Pinia store，避免重複請求

4. **防抖 Token 刷新**:
   - 全域鎖機制避免重複刷新

## 結論

所有技術決策基於：
1. **現有技術棧**: Vue 3, TypeScript, Pinia, Axios, Vue Router
2. **憲章要求**: TDD, 繁體中文, 無障礙, 效能預算
3. **安全最佳實踐**: HttpOnly cookies, XSS 防護, JWT 短期化
4. **使用者體驗**: 無感知 token 刷新, 友善錯誤訊息, 離線偵測

下一步：Phase 1 - 設計 data-model.md 和 contracts/
