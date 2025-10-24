# 實作計畫：CRM 登入整合

**分支**: `003-crm-login-integration` | **日期**: 2025-01-24 | **規格**: [spec.md](./spec.md)
**輸入**: 功能規格來自 `/specs/003-crm-login-integration/spec.md`

**注意**: 此模板由 `/speckit.plan` 指令填寫。執行工作流程請參見 `.specify/templates/commands/plan.md`。

## 摘要

本功能整合前端應用程式與 CRM 認證 API，實現使用者透過 CRM 系統登入並在成功認證後存取應用程式中心的完整流程。包含：
- 使用帳號密碼透過 CRM API 進行身份驗證
- JWT token 的安全儲存與自動刷新機制
- 多分頁 token 同步（透過 localStorage 事件）
- 完整的錯誤處理、離線偵測和安全性措施（登入失敗鎖定）
- 全面的活動記錄至分析服務

**技術方法**：在現有 Vue 3 + TypeScript + Pinia 前端架構上，實作認證狀態管理、Axios 攔截器處理 token 管理、Vue Router 守衛保護路由，並整合 CRM OpenAPI 定義的認證端點。

## 技術環境

**語言/版本**: TypeScript 5.x + Vue 3.5 (Composition API)
**主要依賴**:
- Vite 7.x (建置工具)
- Pinia 2.x (狀態管理)
- Vue Router 4.x (路由管理)
- Axios 1.x (HTTP 客戶端)
- VeeValidate 4.x + Yup (表單驗證)
- Tailwind CSS 3.x (樣式框架)

**儲存**:
- sessionStorage (access token)
- HttpOnly Cookies (refresh token，由後端設定)
- localStorage (跨分頁事件廣播)

**測試**:
- Vitest (單元測試 + 整合測試)
- Playwright (E2E 測試)
- MSW (Mock Service Worker，API 模擬)
- @vue/test-utils (Vue 元件測試)

**目標平台**: 現代瀏覽器 (支援 ES2020+, sessionStorage, localStorage events, HttpOnly cookies)

**專案類型**: Web 應用程式 (frontend + backend)

**效能目標**:
- 登入流程 < 3 秒 (包含 API 往返)
- Token 刷新無感知 (< 100ms 用戶端處理時間)
- 登出流程 < 2 秒
- Token 清除與重定向 < 1 秒
- API 請求超時設定: 10-15 秒

**限制條件**:
- CRM API 必須遵循 `docs/openapi.yaml` 規格
- 必須支援跨域請求 (CORS)
- 瀏覽器必須支援 sessionStorage, localStorage events, HttpOnly cookies
- 離線狀態下無法登入或執行 API 操作
- 登入失敗 3-5 次後鎖定帳號 15 分鐘

**規模/範圍**:
- 3 個使用者故事 (P1: 基本登入, P2: Token 生命週期, P3: 使用者資訊與登出)
- 21 個功能需求
- 6 個成功標準
- 約 10-15 個 Vue 元件/composables/services
- 全面的契約測試、整合測試和 E2E 測試

## 憲章檢查

*關卡：必須在 Phase 0 研究前通過。Phase 1 設計後重新檢查。*

### I. 程式碼品質與可維護性
- [x] **單一職責**: 每個模組有明確職責（authService: API 呼叫, auth store: 狀態管理, useAuth: 元件邏輯）
- [x] **自我文件化**: 使用清晰的命名 (loginWithCredentials, refreshAccessToken, clearAuthState)
- [x] **避免過早優化**: 先實作基本功能，效能優化在測試後進行
- [x] **技術債追蹤**: 任何快捷實作必須記錄在 tasks.md 的 TODO 區塊

### II. 測試標準 (不可妥協)
- [x] **TDD 必須**: 契約測試優先 (CRM API 端點)，整合測試覆蓋使用者故事，單元測試覆蓋邊緣案例
- [x] **契約測試**: 所有 CRM API 呼叫 (login, logout, refresh, me) 必須有契約測試
- [x] **整合測試**: 覆蓋 3 個使用者故事的所有驗收場景
- [x] **單元測試**: Token 過期檢測、錯誤處理、儲存同步邏輯

### III. 使用者體驗一致性
- [x] **錯誤訊息**: 所有錯誤使用友善的繁體中文訊息（「帳號或密碼錯誤」、「網路連線失敗」）
- [x] **載入狀態**: 登入、登出、token 刷新時顯示載入指示器
- [x] **無障礙**: 登入表單符合 WCAG 2.1 AA 標準（鍵盤導航、螢幕閱讀器支援、適當的 ARIA 標籤）
- [x] **離線處理**: 清晰的「無網路連線」訊息，禁用網路操作

### IV. 效能需求
- [x] **效能預算**: 已定義（登入 <3s, 登出 <2s, token 清除 <1s, API 超時 10-15s）
- [x] **監控**: 所有 API 請求記錄至分析服務，包含回應時間和錯誤
- [x] **最佳化**: Token 刷新使用防抖機制避免重複請求

### V. 文件語言
- [x] **規格與計畫**: 使用繁體中文 (spec.md, plan.md)
- [x] **使用者介面**: 所有 UI 文字和錯誤訊息使用繁體中文
- [x] **程式碼註解**: 業務邏輯註解優先使用繁體中文；技術/框架註解可使用英文
- [x] **API 文件**: contracts/ 中的 OpenAPI 定義包含繁體中文描述

**通過條件**: ✅ 所有檢查點已滿足

## 專案結構

### 文件 (本功能)

```text
specs/003-crm-login-integration/
├── spec.md              # 功能規格（由 /speckit.specify 產生）
├── plan.md              # 本檔案（由 /speckit.plan 產生）
├── research.md          # Phase 0 輸出（由 /speckit.plan 產生）
├── data-model.md        # Phase 1 輸出（由 /speckit.plan 產生）
├── quickstart.md        # Phase 1 輸出（由 /speckit.plan 產生）
├── contracts/           # Phase 1 輸出（由 /speckit.plan 產生）
│   └── crm-auth-api.yaml  # CRM 認證 API 契約定義
├── checklists/          # 品質檢查清單
│   └── requirements.md  # 需求完整性檢查
└── tasks.md             # Phase 2 輸出（由 /speckit.tasks 產生 - 非 /speckit.plan）
```

### 原始碼 (儲存庫根目錄)

```text
frontend/
├── src/
│   ├── components/          # Vue 元件
│   │   ├── LoginForm.vue        # 登入表單元件（已存在，需更新）
│   │   ├── AppHeader.vue        # 應用程式標題（含登出按鈕）
│   │   └── OfflineIndicator.vue # 離線狀態指示器（新增）
│   │
│   ├── views/               # 頁面元件
│   │   ├── LoginPage.vue        # 登入頁面（已存在，需更新）
│   │   ├── AppCenterPage.vue    # 應用程式中心（新增）
│   │   └── ProfilePage.vue      # 使用者資訊頁面（已存在）
│   │
│   ├── stores/              # Pinia 狀態管理
│   │   ├── auth.ts              # 認證 store（已存在，需更新）
│   │   └── ui.ts                # UI 狀態 store（新增，管理離線狀態）
│   │
│   ├── services/            # API 服務層
│   │   ├── api.ts               # Axios 實例與攔截器（已存在，需更新）
│   │   ├── authService.ts       # CRM 認證 API 服務（已存在，需更新）
│   │   └── analyticsService.ts  # 分析/日誌服務（新增）
│   │
│   ├── composables/         # Vue Composables
│   │   ├── useAuth.ts           # 認證邏輯 composable（已存在，需更新）
│   │   ├── useTokenRefresh.ts   # Token 刷新邏輯（新增）
│   │   ├── useOfflineDetection.ts # 離線偵測（新增）
│   │   └── useLoginRateLimit.ts # 登入失敗鎖定邏輯（新增）
│   │
│   ├── utils/               # 工具函式
│   │   ├── storage.ts           # 儲存管理（sessionStorage, localStorage events）
│   │   ├── tokenUtils.ts        # Token 解析與驗證工具
│   │   └── errorMessages.ts     # 錯誤訊息對應（繁體中文）
│   │
│   ├── types/               # TypeScript 類型定義
│   │   ├── auth.ts              # 認證相關類型
│   │   └── api.ts               # API 回應類型
│   │
│   ├── router/              # Vue Router 設定
│   │   └── index.ts             # 路由定義與守衛（已存在，需更新）
│   │
│   └── App.vue              # 根元件（已存在）
│
└── tests/                   # 測試目錄
    ├── contract/            # 契約測試
    │   └── crm-auth-api.test.ts  # CRM 認證 API 契約測試
    │
    ├── integration/         # 整合測試
    │   ├── login-flow.test.ts     # 登入流程整合測試
    │   ├── token-lifecycle.test.ts # Token 生命週期測試
    │   └── multi-tab-sync.test.ts # 多分頁同步測試
    │
    ├── unit/                # 單元測試
    │   ├── stores/
    │   │   └── auth.test.ts
    │   ├── services/
    │   │   ├── authService.test.ts
    │   │   └── analyticsService.test.ts
    │   ├── composables/
    │   │   ├── useAuth.test.ts
    │   │   ├── useTokenRefresh.test.ts
    │   │   └── useLoginRateLimit.test.ts
    │   └── utils/
    │       ├── storage.test.ts
    │       └── tokenUtils.test.ts
    │
    └── e2e/                 # E2E 測試 (Playwright)
        ├── login.spec.ts            # 完整登入流程
        ├── token-refresh.spec.ts    # Token 自動刷新
        ├── logout.spec.ts           # 登出流程
        ├── offline.spec.ts          # 離線行為
        └── rate-limit.spec.ts       # 登入失敗鎖定

backend/
├── (CRM API 已存在，假設符合 docs/openapi.yaml)
└── (本功能不修改後端)

docs/
└── openapi.yaml         # CRM API 規格（參考文件）
```

**結構決策**:

此專案是 Web 應用程式，分為 frontend（Vue 3 SPA）和 backend（CRM API，已存在）。

**前端結構**遵循 Vue 3 最佳實踐：
- **components/**: 可重用的 UI 元件（LoginForm, AppHeader, OfflineIndicator）
- **views/**: 頁面層級元件，對應路由（LoginPage, AppCenterPage, ProfilePage）
- **stores/**: Pinia stores 管理全域狀態（auth, ui）
- **services/**: API 通訊層，封裝所有 HTTP 請求（authService, analyticsService）
- **composables/**: 可重用的組合式 API 邏輯（useAuth, useTokenRefresh, useOfflineDetection）
- **utils/**: 純函式工具（storage, tokenUtils, errorMessages）
- **types/**: TypeScript 類型定義，確保型別安全
- **router/**: Vue Router 配置，包含認證守衛

**測試結構**遵循憲章要求：
- **contract/**: 驗證 CRM API 符合 OpenAPI 規格（優先，TDD）
- **integration/**: 測試跨元件互動和使用者故事流程
- **unit/**: 測試個別函式、composables、stores 的邏輯
- **e2e/**: 端對端測試，模擬真實使用者操作

**現有檔案**（需更新）：
- `LoginForm.vue`, `LoginPage.vue`: 新增離線偵測、錯誤處理、無障礙支援
- `auth.ts` (store): 新增 token 刷新、多分頁同步、登入失敗鎖定邏輯
- `authService.ts`: 更新 API 端點，新增分析記錄
- `api.ts`: 新增攔截器處理 401、token 刷新、請求佇列
- `useAuth.ts`: 新增離線檢查、錯誤處理
- `router/index.ts`: 更新守衛，新增 app_center 路由

**新增檔案**：
- `AppCenterPage.vue`: 登入後的目標頁面
- `OfflineIndicator.vue`: 全域離線狀態 UI
- `analyticsService.ts`: 記錄所有活動
- `useTokenRefresh.ts`: 自動 token 刷新邏輯
- `useOfflineDetection.ts`: 離線狀態偵測
- `useLoginRateLimit.ts`: 登入失敗計數與鎖定
- `storage.ts`: 封裝 sessionStorage/localStorage 操作
- `tokenUtils.ts`: JWT 解析、過期檢查
- `ui.ts` (store): 管理 UI 狀態（離線指示器）

## 複雜度追蹤

> **僅在憲章檢查有需要說明的違規時填寫**

無違規需要說明。本功能完全符合憲章所有原則。
