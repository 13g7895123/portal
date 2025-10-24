# 快速上手指南

**功能**: CRM 登入整合
**日期**: 2025-01-24
**對象**: 開發人員

## 概述

本指南協助開發人員快速理解並開始實作 CRM 登入整合功能。

**核心功能**:
- ✅ 使用帳號密碼透過 CRM API 登入
- ✅ JWT token 自動管理與刷新
- ✅ 多分頁 token 同步
- ✅ 登入失敗鎖定保護
- ✅ 離線狀態偵測
- ✅ 完整活動日誌記錄

**技術棧**: Vue 3 + TypeScript + Pinia + Axios + Vue Router

---

## 快速開始

### 1. 先決條件檢查

確保已安裝：
```bash
# Node.js 18+ (檢查版本)
node --version  # 應 >= v18.0.0

# npm 9+ (檢查版本)
npm --version   # 應 >= 9.0.0

# 確認專案依賴已安裝
cd /home/jarvis/project/idea/as/entry/frontend
npm install
```

### 2. 閱讀關鍵文件（5 分鐘）

**必讀順序**:
1. **[spec.md](./spec.md)** - 功能需求與驗收標準
2. **[data-model.md](./data-model.md)** - 資料結構與狀態管理
3. **[contracts/crm-auth-api.yaml](./contracts/crm-auth-api.yaml)** - API 契約定義

**選讀**:
- **[research.md](./research.md)** - 技術決策與最佳實踐
- **[plan.md](./plan.md)** - 完整實作計畫

### 3. 理解核心流程（10 分鐘）

#### 登入流程
```typescript
使用者輸入帳號密碼
    ↓
LoginForm.vue 驗證格式
    ↓
useAuth.login(credentials)
    ↓
authService.login() → CRM API /auth/login
    ↓ (成功)
儲存 access_token 至 sessionStorage
儲存 user 至 Pinia authStore
    ↓
router.push('/app-center')
```

#### Token 自動刷新流程
```typescript
useTokenRefresh (每分鐘檢查)
    ↓
剩餘時間 < 5 分鐘？
    ↓ (是)
authService.refreshToken() → CRM API /auth/refresh
    ↓ (成功)
更新 sessionStorage + localStorage (觸發多分頁同步)
```

#### API 401 自動處理流程
```typescript
任意 API 請求 → 收到 401 錯誤
    ↓
Axios Response Interceptor 攔截
    ↓
authService.refreshToken()
    ↓ (成功)
重試原始請求（附帶新 token）
    ↓ (失敗)
清除認證狀態 → 重定向至登入頁
```

---

## 檔案結構導覽

### 🔵 核心檔案（優先實作）

#### 1. 服務層（API 通訊）

**`frontend/src/services/authService.ts`**
- **職責**: 封裝所有 CRM 認證 API 呼叫
- **方法**:
  - `login(credentials)` → POST /auth/login
  - `logout()` → POST /auth/logout
  - `refreshToken()` → POST /auth/refresh
  - `getCurrentUser()` → GET /auth/me
- **參考**: `contracts/crm-auth-api.yaml`

**`frontend/src/services/api.ts`**
- **職責**: Axios 實例與攔截器
- **功能**:
  - Request Interceptor: 自動附加 `Authorization: Bearer {token}`
  - Response Interceptor: 攔截 401，自動刷新 token 並重試
  - 請求佇列機制（避免重複刷新）
- **關鍵實作**: 401 錯誤處理 + token 刷新邏輯

**`frontend/src/services/analyticsService.ts`**
- **職責**: 記錄所有 API 請求、回應和使用者操作
- **方法**:
  - `track(event)` → 發送事件至分析服務（開發環境：console，正式環境：後端 API）
- **記錄內容**: 登入/登出/token 刷新/API 請求/錯誤

#### 2. 狀態管理（Pinia Stores）

**`frontend/src/stores/auth.ts`**
- **State**:
  - `isAuthenticated`: boolean
  - `user`: UserInfo | null
  - `accessToken`: string | null
  - `lastRefresh`: number | null
  - `isLoading`: boolean
  - `error`: string | null
- **Actions**:
  - `login(username, password, rememberMe)`
  - `logout()`
  - `fetchCurrentUser()`
  - `updateAccessToken(token)`
  - `clearAuth()`
- **Getters**:
  - `isTokenExpiringSoon` (剩餘 < 5 分鐘)
  - `isLoggedIn` (已認證且有使用者)

**`frontend/src/stores/ui.ts`**
- **State**:
  - `isOffline`: boolean
  - `lastOnlineCheck`: number
- **Actions**:
  - `setOffline(value: boolean)`

#### 3. Composables（可重用邏輯）

**`frontend/src/composables/useAuth.ts`**
- **職責**: 元件層級的認證邏輯
- **方法**:
  - `login(credentials)` → 呼叫 store，處理錯誤，導航
  - `logout()` → 呼叫 store，清除狀態，導航至登入頁
- **使用範例**:
  ```typescript
  const { login, logout, isLoading, error } = useAuth()
  await login({ username, password, rememberMe })
  ```

**`frontend/src/composables/useTokenRefresh.ts`**
- **職責**: 自動偵測 token 過期並刷新
- **機制**:
  - 使用 `setInterval` 每分鐘檢查
  - 若剩餘 < 5 分鐘，自動呼叫 `authService.refreshToken()`
  - 更新 sessionStorage 和 localStorage (觸發多分頁同步)
- **使用位置**: App.vue 或 router beforeEach

**`frontend/src/composables/useOfflineDetection.ts`**
- **職責**: 偵測網路連線狀態
- **機制**:
  - 監聽 `window` 的 `online`/`offline` 事件
  - 定期 ping CRM API (可選)
  - 更新 `uiStore.isOffline`
- **使用位置**: App.vue (全域)

**`frontend/src/composables/useLoginRateLimit.ts`**
- **職責**: 登入失敗計數與帳號鎖定
- **機制**:
  - localStorage 儲存失敗次數與鎖定時間
  - 登入失敗時遞增計數
  - 達到 3-5 次時鎖定 15 分鐘
  - 登入成功時清除計數
- **使用位置**: LoginForm.vue

#### 4. 工具函式

**`frontend/src/utils/storage.ts`**
- **職責**: 封裝 sessionStorage/localStorage 操作
- **方法**:
  - `getAccessToken()` → 從 sessionStorage 讀取
  - `setAccessToken(token)` → 儲存至 sessionStorage
  - `removeAccessToken()` → 清除 sessionStorage
  - `broadcastTokenUpdate()` → 設定 localStorage 事件（跨分頁）
  - `listenToStorageEvents(callback)` → 監聽其他分頁的事件

**`frontend/src/utils/tokenUtils.ts`**
- **職責**: JWT token 處理工具
- **方法**:
  - `decodeToken(token)` → 解析 JWT payload (不驗證簽名)
  - `isTokenExpired(token)` → 檢查是否過期
  - `getTokenExpiresIn(token)` → 取得剩餘秒數
  - `isTokenExpiringSoon(token, threshold = 300)` → 檢查是否即將過期

**`frontend/src/utils/errorMessages.ts`**
- **職責**: 錯誤訊息本地化
- **格式**:
  ```typescript
  export const ERROR_MESSAGES: Record<string, string> = {
    'INVALID_CREDENTIALS': '帳號或密碼錯誤',
    'NETWORK_ERROR': '無法連線至伺服器，請稍後再試',
    // ...更多錯誤碼對應
  }
  ```

#### 5. 元件

**`frontend/src/components/LoginForm.vue`**
- **職責**: 登入表單 UI
- **功能**:
  - VeeValidate + Yup 驗證
  - 載入狀態顯示
  - 錯誤訊息顯示（繁體中文）
  - 記住我勾選框
  - 無障礙支援（ARIA labels, 鍵盤導航）
  - 離線時禁用提交
  - 鎖定時顯示倒數時間

**`frontend/src/components/OfflineIndicator.vue`**
- **職責**: 全域離線狀態橫幅
- **顯示**: 「無網路連線」訊息（當 `uiStore.isOffline === true`）
- **樣式**: 頂部固定，醒目顏色

**`frontend/src/views/LoginPage.vue`**
- **職責**: 登入頁面容器
- **功能**:
  - 使用 `<LoginForm>` 元件
  - 檢查已登入時自動重定向
  - 頁面標題與 SEO

**`frontend/src/views/AppCenterPage.vue`**
- **職責**: 應用程式中心（登入成功後的目標頁面）
- **功能**:
  - 顯示使用者資訊（姓名、email、部門）
  - 登出按鈕
  - 歡迎訊息

#### 6. 路由

**`frontend/src/router/index.ts`**
- **新增路由**:
  ```typescript
  {
    path: '/app-center',
    name: 'app_center',
    component: () => import('@/views/AppCenterPage.vue'),
    meta: { requiresAuth: true }
  }
  ```
- **更新守衛**:
  ```typescript
  router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    const hasToken = !!sessionStorage.getItem('access_token')

    if (to.meta.requiresAuth && !hasToken) {
      next({ name: 'login' })
    } else if (to.name === 'login' && hasToken) {
      next({ name: 'app_center' })  // 改為 app_center
    } else {
      next()
    }
  })
  ```

---

## 開發工作流程

### Phase 0: 設定與準備（已完成）
- ✅ 閱讀 spec.md, data-model.md, contracts/
- ✅ 理解技術決策 (research.md)

### Phase 1: 契約測試（TDD 第一步）

**目標**: 確保 CRM API 符合契約

1. **建立測試檔案**:
   ```bash
   touch frontend/tests/contract/crm-auth-api.test.ts
   ```

2. **實作契約測試** (參考 `contracts/crm-auth-api.yaml`):
   ```typescript
   // 測試 POST /auth/login
   // 測試 POST /auth/logout
   // 測試 POST /auth/refresh
   // 測試 GET /auth/me
   ```

3. **執行測試**:
   ```bash
   cd frontend
   npm run test tests/contract/
   ```

4. **驗證**: 所有契約測試通過（使用 MSW mock CRM API）

### Phase 2: 核心服務實作

**順序**: 由底層到上層

#### 2.1 工具函式
```bash
# 實作順序
1. frontend/src/utils/errorMessages.ts
2. frontend/src/utils/tokenUtils.ts
3. frontend/src/utils/storage.ts
```

#### 2.2 API 服務層
```bash
4. frontend/src/services/api.ts (Axios 實例 + 攔截器)
5. frontend/src/services/authService.ts
6. frontend/src/services/analyticsService.ts
```

#### 2.3 Pinia Stores
```bash
7. frontend/src/stores/ui.ts
8. frontend/src/stores/auth.ts (依賴 authService)
```

#### 2.4 Composables
```bash
9. frontend/src/composables/useLoginRateLimit.ts
10. frontend/src/composables/useOfflineDetection.ts
11. frontend/src/composables/useTokenRefresh.ts
12. frontend/src/composables/useAuth.ts (依賴 authStore)
```

**每個模組實作後**:
- ✅ 寫單元測試 (`tests/unit/`)
- ✅ 測試通過再繼續下一個

### Phase 3: UI 元件實作

#### 3.1 元件
```bash
13. frontend/src/components/OfflineIndicator.vue
14. 更新 frontend/src/components/LoginForm.vue (新增離線偵測、錯誤處理、鎖定邏輯)
```

#### 3.2 頁面
```bash
15. 更新 frontend/src/views/LoginPage.vue
16. 新增 frontend/src/views/AppCenterPage.vue
```

#### 3.3 路由
```bash
17. 更新 frontend/src/router/index.ts (新增 app_center 路由與守衛)
```

#### 3.4 App 整合
```bash
18. 更新 frontend/src/App.vue (加入 OfflineIndicator, 初始化 useTokenRefresh)
```

**每個元件實作後**:
- ✅ 寫元件測試 (`tests/unit/components/`)
- ✅ 手動測試 UI 與交互

### Phase 4: 整合測試

```bash
# 建立整合測試
19. frontend/tests/integration/login-flow.test.ts
20. frontend/tests/integration/token-lifecycle.test.ts
21. frontend/tests/integration/multi-tab-sync.test.ts
```

**執行整合測試**:
```bash
npm run test tests/integration/
```

### Phase 5: E2E 測試

```bash
# 建立 E2E 測試 (Playwright)
22. frontend/tests/e2e/login.spec.ts
23. frontend/tests/e2e/token-refresh.spec.ts
24. frontend/tests/e2e/logout.spec.ts
25. frontend/tests/e2e/offline.spec.ts
26. frontend/tests/e2e/rate-limit.spec.ts
```

**執行 E2E 測試**:
```bash
npm run test:e2e
```

### Phase 6: 手動測試與調整

**測試場景** (參考 `spec.md` 驗收場景):
1. ✅ 成功登入流程
2. ✅ 錯誤處理（帳號密碼錯誤、網路錯誤）
3. ✅ Token 自動刷新
4. ✅ 多分頁同步（開啟 2-3 個分頁測試）
5. ✅ 登入失敗鎖定（故意輸入錯誤密碼 3-5 次）
6. ✅ 離線行為（使用瀏覽器 DevTools 模擬離線）
7. ✅ 登出流程

---

## 關鍵概念速查

### 1. Token 管理

**Access Token**:
- 儲存位置: `sessionStorage['access_token']`
- 有效期: 1 小時
- 使用方式: `Authorization: Bearer {token}`
- 刷新時機: 剩餘 < 5 分鐘

**Refresh Token**:
- 儲存位置: HttpOnly Cookie (後端設定)
- 有效期: session 或 30 天 (取決於 rememberMe)
- 使用方式: 瀏覽器自動附加到 `/auth/refresh` 請求

### 2. 多分頁同步

**機制**: localStorage + storage 事件

**流程**:
1. 分頁 A 刷新 token → 更新 sessionStorage + 設定 localStorage['auth_token_update']
2. 分頁 B、C 監聽 `storage` 事件 → 偵測到變更
3. 分頁 B、C 從 sessionStorage 讀取最新 token → 更新本地 state

**實作位置**:
- `utils/storage.ts`: `broadcastTokenUpdate()`, `listenToStorageEvents()`
- `stores/auth.ts`: 在 store 初始化時設定監聽器

### 3. 錯誤處理

**原則**: 所有錯誤訊息必須為繁體中文且友善

**錯誤分類**:
- **認證錯誤 (401)**: 「帳號或密碼錯誤」 / 「登入已過期，請重新登入」
- **網路錯誤**: 「無法連線至伺服器，請稍後再試」
- **驗證錯誤 (422)**: 「帳號為必填欄位」等
- **鎖定錯誤**: 「登入失敗次數過多，請在 X 分鐘後再試」
- **離線錯誤**: 「無網路連線」

**實作**: `utils/errorMessages.ts` + 各元件的錯誤處理邏輯

### 4. 無障礙設計

**WCAG 2.1 AA 標準**:
- ✅ 所有表單欄位有 `<label for="...">`
- ✅ 錯誤訊息使用 `aria-live="polite"`
- ✅ 按鈕和連結有明確的 `aria-label`
- ✅ 鍵盤導航支援 (Tab, Enter)
- ✅ 顏色對比度 >= 4.5:1
- ✅ Focus 樣式清晰可見

**測試工具**: Chrome DevTools Lighthouse + axe DevTools

---

## 常見問題

### Q1: 為什麼 access_token 存在 sessionStorage 而非 localStorage？

**A**: 安全性考量。sessionStorage 限於單一分頁生命週期，關閉分頁即清除，降低 token 被竊取後的風險。雖然需多分頁同步，但透過 localStorage 事件機制可以實現。

### Q2: 如何測試多分頁同步？

**A**:
1. 開啟兩個分頁，都導航至登入頁
2. 在分頁 A 登入
3. 切換至分頁 B，應自動偵測到已登入並重定向至 app_center
4. 在分頁 A 登出
5. 分頁 B 應自動登出並返回登入頁

### Q3: 如何處理 token 刷新期間的 API 請求？

**A**: 使用請求佇列機制（在 `api.ts` 實作）：
1. 第一個 401 錯誤觸發 token 刷新
2. 後續的 401 錯誤進入佇列等待
3. Token 刷新成功後，批次重試佇列中的請求

### Q4: 如何測試登入失敗鎖定？

**A**:
1. 故意輸入錯誤密碼 3 次
2. 應看到「登入失敗次數過多，請在 15 分鐘後再試」
3. 登入按鈕應被禁用
4. 等待 15 分鐘或手動清除 localStorage['login_attempts'] 後恢復

### Q5: 離線偵測是否準確？

**A**: `navigator.onLine` 僅偵測瀏覽器層級的網路狀態，不保證 CRM API 可達。建議搭配定期 ping 健康端點（每 30 秒）以提高準確性。

---

## 效能檢查清單

執行以下檢查確保符合效能目標：

- [ ] 登入流程 < 3 秒 (使用 Chrome DevTools Performance)
- [ ] Token 刷新無感知 (< 100ms 用戶端處理)
- [ ] 登出流程 < 2 秒
- [ ] 多分頁同步延遲 < 100ms
- [ ] 無記憶體洩漏 (Chrome DevTools Memory Profiler)
- [ ] 首次載入 < 2 秒 (使用 Lighthouse)

---

## 部署前檢查清單

- [ ] 所有測試通過 (`npm run test` + `npm run test:e2e`)
- [ ] Linting 無錯誤 (`npm run lint`)
- [ ] TypeScript 類型檢查通過 (`npm run type-check`)
- [ ] 無障礙檢查通過 (Lighthouse Accessibility >= 90)
- [ ] 手動測試所有驗收場景 (參考 `spec.md`)
- [ ] 多瀏覽器測試 (Chrome, Firefox, Safari, Edge)
- [ ] 行動裝置測試 (iOS Safari, Android Chrome)
- [ ] 環境變數正確設定 (`.env.production`)
- [ ] API 端點指向正確環境
- [ ] CORS 設定已與後端確認

---

## 相關資源

### 內部文件
- [功能規格 (spec.md)](./spec.md)
- [實作計畫 (plan.md)](./plan.md)
- [資料模型 (data-model.md)](./data-model.md)
- [技術研究 (research.md)](./research.md)
- [API 契約 (contracts/crm-auth-api.yaml)](./contracts/crm-auth-api.yaml)

### 外部參考
- [Vue 3 文件](https://vuejs.org/)
- [Pinia 文件](https://pinia.vuejs.org/)
- [Axios 文件](https://axios-http.com/)
- [VeeValidate 文件](https://vee-validate.logaretm.com/)
- [WCAG 2.1 指南](https://www.w3.org/WAI/WCAG21/quickref/)
- [JWT 最佳實踐](https://tools.ietf.org/html/rfc8725)

### 工具
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
- [MSW (Mock Service Worker)](https://mswjs.io/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [axe DevTools](https://www.deque.com/axe/devtools/)

---

## 下一步

1. ✅ 完成 Phase 1 契約測試
2. ⏳ 開始 Phase 2 核心服務實作
3. ⏳ Phase 3 UI 元件實作
4. ⏳ Phase 4-5 整合與 E2E 測試
5. ⏳ Phase 6 手動測試與調整

**準備好開始了嗎？** 從 Phase 1 的契約測試開始吧！🚀
