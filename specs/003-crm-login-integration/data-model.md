# 資料模型

**功能**: CRM 登入整合
**日期**: 2025-01-24
**階段**: Phase 1

## 概述

本文件定義 CRM 登入整合功能中所有資料實體的結構、關係和驗證規則。遵循規格 `spec.md` 中定義的 Key Entities。

## 核心實體

### 1. LoginCredentials (登入憑證)

**描述**: 使用者提交的登入憑證

**屬性**:

| 欄位 | 類型 | 必填 | 驗證規則 | 說明 |
|------|------|------|----------|------|
| `username` | string | ✓ | 長度 3-50, 無空白 | 使用者帳號 |
| `password` | string | ✓ | 長度 >= 8 | 使用者密碼 |
| `rememberMe` | boolean | ✗ | - | 是否記住登入（影響 refresh token 有效期） |

**TypeScript 定義**:
```typescript
interface LoginCredentials {
  username: string
  password: string
  rememberMe?: boolean
}
```

**驗證規則**:
- `username`: 必填，去除前後空白，長度 3-50 字元
- `password`: 必填，長度至少 8 字元（前端不驗證強度，由後端處理）
- `rememberMe`: 選填，預設 `false`

**來源**: 使用者在 `LoginForm.vue` 輸入

**生命週期**: 暫存於元件 state，提交後不儲存

---

### 2. AccessToken (存取令牌)

**描述**: 短期 JWT 令牌，用於驗證 API 請求

**屬性**:

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `token` | string (JWT) | ✓ | JWT 格式的 token 字串 |
| `expiresIn` | number | ✓ | Token 有效秒數（通常 3600 = 1 小時） |
| `expiresAt` | number | ✓ | 過期時間戳 (ms)，由前端計算 |

**TypeScript 定義**:
```typescript
interface AccessToken {
  token: string          // JWT 字串
  expiresIn: number      // 有效秒數 (來自 CRM API)
  expiresAt: number      // 過期時間戳 (Date.now() + expiresIn * 1000)
}
```

**JWT Payload 結構** (decoded，僅前端讀取，不驗證簽名):
```typescript
interface JWTPayload {
  sub: string          // 使用者 ID
  username: string     // 使用者帳號
  exp: number          // 過期時間戳 (秒)
  iat: number          // 簽發時間戳 (秒)
}
```

**儲存位置**: `sessionStorage` (key: `'access_token'`)

**儲存格式**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "expiresAt": 1706001234567
}
```

**生命週期**:
1. 登入成功時由 CRM API `/auth/login` 返回
2. 儲存至 sessionStorage
3. 每次 API 請求時從 sessionStorage 讀取並附加到 `Authorization: Bearer {token}`
4. 剩餘有效時間 < 5 分鐘時自動刷新
5. 登出或分頁關閉時清除

---

### 3. RefreshToken (更新令牌)

**描述**: 長期令牌，用於更新 access_token

**屬性**:

| 欄位 | 類型 | 說明 |
|------|------|------|
| `token` | string | Refresh token 字串（不透過 JavaScript 存取） |
| `expiresIn` | number | 有效期（秒），取決於 rememberMe (session 或 30 天) |

**儲存位置**: HttpOnly Cookie (由後端在 `/auth/login` 回應時設定)

**Cookie 屬性**:
```
Set-Cookie: refresh_token={token}; HttpOnly; Secure; SameSite=Strict; Max-Age={expiresIn}
```

**前端處理**: 前端無法透過 JavaScript 讀取或修改，瀏覽器在呼叫 `/auth/refresh` 時自動帶上

**生命週期**:
1. 登入成功時由 CRM API `/auth/login` 在回應 header 設定
2. 前端無需儲存或管理
3. `/auth/refresh` 請求時瀏覽器自動附加
4. 登出時由 `/auth/logout` API 清除 cookie

---

### 4. UserInfo (使用者資訊)

**描述**: 認證使用者的基本資料

**屬性**:

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `id` | number | ✓ | 使用者 ID (唯一識別) |
| `username` | string | ✓ | 使用者帳號 |
| `email` | string | ✓ | 電子郵件地址 |
| `fullName` | string | ✗ | 全名 |
| `department` | string | ✗ | 部門 |
| `region` | string | ✗ | 地區 |
| `isActive` | boolean | ✓ | 帳號是否啟用 |
| `lastLoginAt` | string (ISO 8601) | ✗ | 最後登入時間 |

**TypeScript 定義**:
```typescript
interface UserInfo {
  id: number
  username: string
  email: string
  fullName?: string | null
  department?: string | null
  region?: string | null
  isActive: boolean
  lastLoginAt?: string | null  // ISO 8601 格式
}
```

**來源**: CRM API `/auth/login` 或 `/auth/me` 回應的 `user` 欄位

**儲存位置**: Pinia `authStore.user` (記憶體)

**生命週期**:
1. 登入成功時從 `/auth/login` 回應取得
2. 儲存至 Pinia store
3. 可在應用程式中心和個人檔案頁面顯示
4. 登出時清除

---

### 5. AuthState (認證狀態)

**描述**: 應用程式的全域認證狀態

**屬性**:

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `isAuthenticated` | boolean | ✓ | 是否已認證 |
| `user` | UserInfo \| null | ✓ | 使用者資訊 (未登入為 null) |
| `accessToken` | string \| null | ✓ | Access token 字串 (未登入為 null) |
| `lastRefresh` | number \| null | ✗ | 最後刷新時間戳 |
| `isLoading` | boolean | ✓ | 是否正在處理認證操作 |
| `error` | string \| null | ✓ | 錯誤訊息 (無錯誤為 null) |

**TypeScript 定義**:
```typescript
interface AuthState {
  isAuthenticated: boolean
  user: UserInfo | null
  accessToken: string | null
  lastRefresh: number | null
  isLoading: boolean
  error: string | null
}
```

**儲存位置**: Pinia `authStore` (Vuex-like reactive state)

**生命週期**:
1. 初始化時從 sessionStorage 恢復 (若存在 access_token)
2. 登入成功時設定 `isAuthenticated = true`, `user`, `accessToken`
3. Token 刷新時更新 `accessToken`, `lastRefresh`
4. 登出時重置所有欄位為初始值

**Getters**:
```typescript
interface AuthGetters {
  isTokenExpiringSoon: (state: AuthState) => boolean  // 剩餘時間 < 5 分鐘
  isLoggedIn: (state: AuthState) => boolean           // isAuthenticated && user != null
  currentUser: (state: AuthState) => UserInfo | null  // 便利存取器
}
```

---

### 6. LoginAttemptRecord (登入嘗試記錄)

**描述**: 追蹤登入失敗次數以實作帳號鎖定

**屬性**:

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `count` | number | ✓ | 失敗次數 |
| `firstAttempt` | number | ✓ | 第一次失敗時間戳 (ms) |
| `lockedUntil` | number \| null | ✗ | 鎖定到期時間戳 (ms)，null 表示未鎖定 |

**TypeScript 定義**:
```typescript
interface LoginAttemptRecord {
  count: number
  firstAttempt: number
  lockedUntil: number | null
}
```

**儲存位置**: `localStorage` (key: `'login_attempts'`)

**儲存格式**:
```json
{
  "count": 3,
  "firstAttempt": 1706000000000,
  "lockedUntil": 1706000900000
}
```

**邏輯規則**:
- 登入失敗時: `count++`, 若 `count >= 3` 則設定 `lockedUntil = now + 15 * 60 * 1000`
- 登入成功時: 清除整個記錄 (移除 localStorage key)
- 檢查鎖定: 若 `lockedUntil > Date.now()` 則禁用登入按鈕

**生命週期**:
1. 首次登入失敗時建立
2. 連續失敗時更新 `count` 和 `lockedUntil`
3. 登入成功時清除
4. 鎖定期過後自動失效 (但記錄仍存在，直到下次成功登入)

---

### 7. OfflineState (離線狀態)

**描述**: 網路連線狀態

**屬性**:

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `isOffline` | boolean | ✓ | 是否離線 |
| `lastOnlineCheck` | number | ✓ | 最後檢查時間戳 |

**TypeScript 定義**:
```typescript
interface OfflineState {
  isOffline: boolean
  lastOnlineCheck: number
}
```

**儲存位置**: Pinia `uiStore` (記憶體)

**偵測機制**:
1. 初始值 = `!navigator.onLine`
2. 監聽 `window` 的 `online`/`offline` 事件
3. 每 30 秒 ping CRM API health endpoint (可選)

**生命週期**: 應用程式全生命週期，即時更新

---

## 資料流與狀態轉換

### 登入流程資料流

```
[使用者輸入] LoginCredentials
    ↓
[LoginForm.vue] 驗證格式
    ↓
[useAuth.login()] 呼叫 authService.login()
    ↓
[CRM API /auth/login]
    ↓ (成功)
[回應] { access_token, refresh_token (cookie), token_type, expires_in, user }
    ↓
[authService] 解析並儲存:
  - sessionStorage: access_token
  - Pinia authStore: user, isAuthenticated = true
    ↓
[router.push('/app-center')]
```

### Token 刷新流程資料流

```
[Interval Check] 每 1 分鐘檢查 token 過期時間
    ↓ (剩餘 < 5 分鐘)
[useTokenRefresh] 呼叫 authService.refreshToken()
    ↓
[CRM API /auth/refresh] (refresh_token 在 cookie 自動帶上)
    ↓ (成功)
[回應] { access_token, token_type, expires_in }
    ↓
[authService] 更新:
  - sessionStorage: 新 access_token
  - localStorage: 'auth_token_update' 事件 (觸發其他分頁同步)
  - Pinia authStore: accessToken, lastRefresh
```

### 登出流程資料流

```
[使用者點擊登出]
    ↓
[useAuth.logout()] 呼叫 authService.logout()
    ↓
[CRM API /auth/logout]
    ↓ (成功)
[authService] 清除:
  - sessionStorage: 移除 access_token
  - localStorage: 設定 'auth_logout' 事件 (通知其他分頁)
  - Pinia authStore: 重置為初始狀態
    ↓
[router.push('/login')]
```

### 401 錯誤自動刷新流程資料流

```
[任意 API 請求] 附帶過期/無效 token
    ↓
[CRM API] 回應 401 Unauthorized
    ↓
[Axios Response Interceptor] 偵測 401
    ↓
[檢查] isRefreshing 標記
    ↓ (未在刷新中)
[設定] isRefreshing = true
    ↓
[呼叫] authService.refreshToken()
    ↓ (成功)
[更新] sessionStorage access_token
    ↓
[重試] 原始請求 (附帶新 token)
    ↓
[設定] isRefreshing = false, 處理佇列中的請求
    ↓ (刷新失敗)
[清除] 所有認證狀態
    ↓
[重定向] /login
```

## 關係圖

```
┌─────────────────┐
│ LoginCredentials│
└────────┬────────┘
         │ 提交
         ↓
┌─────────────────────┐      ┌──────────────┐
│ CRM API /auth/login │─────→│ AccessToken  │─→ sessionStorage
└─────────────────────┘      └──────────────┘
         │
         ├─────→ RefreshToken ─→ HttpOnly Cookie
         │
         └─────→ UserInfo ─────→ Pinia authStore
                                     │
                                     ↓
                            ┌─────────────────┐
                            │   AuthState     │
                            │ (全域認證狀態)  │
                            └─────────────────┘
                                     │
                                     ├→ isAuthenticated
                                     ├→ user
                                     ├→ accessToken
                                     └→ isLoading, error

┌────────────────────┐
│ LoginAttemptRecord │─→ localStorage (防暴力破解)
└────────────────────┘

┌────────────────────┐
│   OfflineState     │─→ Pinia uiStore (離線偵測)
└────────────────────┘
```

## 驗證規則摘要

### 前端驗證 (即時反饋)

| 欄位 | 規則 | 錯誤訊息 |
|------|------|----------|
| `username` | 必填, 長度 3-50 | 「請輸入帳號（3-50 字元）」 |
| `password` | 必填, 長度 >= 8 | 「請輸入密碼（至少 8 字元）」 |
| `email` (UserInfo) | 有效 email 格式 | 「電子郵件格式不正確」 |

### 後端驗證 (最終防護)

所有輸入由 CRM API 進行完整驗證，包含：
- 帳號是否存在
- 密碼是否正確
- 帳號是否啟用 (`isActive`)
- Token 簽名與過期驗證

### 狀態驗證

| 狀態 | 驗證規則 | 處理方式 |
|------|----------|----------|
| Token 過期 | `exp < Date.now() / 1000` | 自動刷新或重定向登入 |
| 帳號鎖定 | `lockedUntil > Date.now()` | 禁用登入，顯示剩餘時間 |
| 離線狀態 | `isOffline === true` | 禁用所有網路操作 |
| 使用者停用 | `isActive === false` | API 返回 401，清除狀態 |

## 效能考量

### 儲存大小

- **sessionStorage**: ~1-2 KB (access_token + metadata)
- **localStorage**: ~0.5 KB (login_attempts, auth_token_update 事件)
- **Pinia store**: ~1-2 KB (user, authState)
- **HttpOnly Cookie**: ~0.5-1 KB (refresh_token)

**總計**: < 5 KB，對瀏覽器儲存無顯著影響

### 讀寫頻率

| 操作 | 頻率 | 影響 |
|------|------|------|
| sessionStorage 讀取 | 每次 API 請求 (~10-100次/分鐘) | 極低 (記憶體操作) |
| sessionStorage 寫入 | Token 刷新 (~1次/小時) | 極低 |
| localStorage 寫入 | Token 刷新 + 登入/登出 (~1-2次/小時) | 極低 |
| Pinia store 讀取 | 元件渲染時 (響應式) | 低 (Vue 優化) |
| Pinia store 寫入 | 登入/登出/刷新 (~1-2次/小時) | 低 |

### 記憶體佔用

- Pinia stores: ~10 KB (包含 reactive overhead)
- Composables: ~5 KB (函式與狀態)
- 事件監聽器: 4 個 (`storage`, `online`, `offline`, `interval`)

**總計**: < 20 KB，可忽略不計

## 安全性考量

### 敏感資料處理

| 資料 | 儲存位置 | 暴露風險 | 緩解措施 |
|------|----------|----------|----------|
| 密碼 | 不儲存 | N/A | 提交後立即清除，不留痕跡 |
| Access Token | sessionStorage | XSS | 短期化（1 小時），HTTPS only |
| Refresh Token | HttpOnly Cookie | XSS | HttpOnly 防止 JS 存取，Secure + SameSite |
| UserInfo | Pinia store | XSS | 不包含敏感資訊 (密碼、支付等) |

### XSS 防護

- **Content Security Policy**: 建議後端設定 CSP headers
- **輸入清理**: 所有使用者輸入經過 Vue 自動轉義
- **HttpOnly Cookie**: Refresh token 無法被 JavaScript 竊取

### CSRF 防護

- **SameSite Cookie**: Refresh token 使用 `SameSite=Strict`
- **CORS**: 後端限制允許的來源
- **Token Binding**: CRM API 可實作 token 與 user-agent 綁定 (後端責任)

## 測試資料

### 單元測試 Mock 資料

```typescript
// 有效登入憑證
export const mockValidCredentials: LoginCredentials = {
  username: 'testuser',
  password: 'password123',
  rememberMe: false
}

// 有效 access token
export const mockAccessToken: AccessToken = {
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImV4cCI6MTcwNjAwMTIzNH0.xxx',
  expiresIn: 3600,
  expiresAt: Date.now() + 3600000
}

// 有效使用者資訊
export const mockUserInfo: UserInfo = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  fullName: '測試使用者',
  department: 'IT',
  region: 'TW',
  isActive: true,
  lastLoginAt: new Date().toISOString()
}

// 過期 access token
export const mockExpiredToken: AccessToken = {
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1MDAwMDAwMDB9.xxx',
  expiresIn: 3600,
  expiresAt: Date.now() - 1000  // 已過期
}
```

## 結論

此資料模型定義了 CRM 登入整合功能的所有核心實體、關係和驗證規則。所有設計符合：
- **安全性**: HttpOnly cookies, 短期 tokens, XSS/CSRF 防護
- **效能**: 最小化儲存和讀寫，響應式狀態管理
- **可測試性**: 清晰的介面定義，易於 mock
- **可維護性**: TypeScript 強型別，明確的生命週期

下一步：定義 API 契約 (contracts/)
