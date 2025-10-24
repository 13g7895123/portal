# 任務清單：CRM 登入整合

**輸入文件**：來自 `/specs/003-crm-login-integration/` 的設計文件
**前置需求**：plan.md、spec.md、research.md、data-model.md、contracts/crm-auth-api.yaml

**測試**：本功能依照憲章需求包含契約和整合層級的完整測試。

**組織方式**：任務依使用者故事分組，以便每個故事可獨立實作和測試。

## 格式：`[ID] [P?] [Story] 描述`

- **[P]**：可並行執行（不同檔案，無相依性）
- **[Story]**：此任務所屬的使用者故事（US1、US2、US3）
- 描述中包含確切的檔案路徑

## 路徑慣例

- **Web 應用程式**：`frontend/src/`、`backend/`（CRM API 已存在，無後端變更）
- 以下所有路徑相對於儲存庫根目錄

---

## 階段 1：專案設定（共享基礎建設）

**目的**：專案初始化與基本結構驗證

- [x] T001 驗證 frontend/ 專案結構符合 plan.md（components/、views/、stores/、services/、composables/、utils/、types/、router/）
- [x] T002 [P] 安裝必要依賴套件：axios、pinia、vue-router、vee-validate、yup、vitest、msw、@vue/test-utils
- [x] T003 [P] 在 tsconfig.json 設定 TypeScript 嚴格模式與路徑別名
- [x] T004 [P] 設定 Vitest 測試環境，包含 jsdom 與 MSW 設定

---

## 階段 2：基礎建設（阻塞性前置需求）

**目的**：核心基礎建設，必須在任何使用者故事開始前完成

**⚠️ 關鍵**：在本階段完成前，不能開始任何使用者故事的工作

- [x] T005 [P] 建立 frontend/src/utils/errorMessages.ts - 錯誤訊息對應（繁體中文）
- [x] T006 [P] 建立 frontend/src/utils/tokenUtils.ts - JWT 解析、過期檢查、驗證工具
- [x] T007 [P] 建立 frontend/src/utils/storage.ts - sessionStorage/localStorage 封裝，包含型別安全與跨分頁事件
- [x] T008 建立 frontend/src/services/api.ts - Axios 實例，設定 base URL、逾時（10-15 秒）與佔位攔截器
- [x] T009 建立 frontend/src/services/analyticsService.ts - 抽象分析服務用於記錄（開發環境用 console，正式環境用 API）
- [x] T010 [P] 建立 frontend/src/types/auth.ts - TypeScript 介面（LoginCredentials、AccessToken、UserInfo、AuthState、LoginAttemptRecord）
- [x] T011 [P] 建立 frontend/src/types/api.ts - API 回應型別（ApiResponse、ErrorResponse、LoginResponse 等）
- [x] T012 建立 frontend/src/stores/ui.ts - Pinia store 用於 UI 狀態（離線偵測）
- [x] T013 建立 frontend/src/stores/auth.ts - Pinia store 用於認證狀態（isAuthenticated、user、accessToken、isLoading、error）

**檢查點**：基礎建設就緒 - 現在可以並行開始使用者故事的實作

---

## 階段 3：使用者故事 1 - 基本登入認證（優先級：P1）🎯 MVP

**目標**：使用者能透過 CRM API 使用帳號密碼登入，成功後重定向至應用程式中心

**獨立測試**：在登入頁面輸入有效的 CRM 憑證，驗證能成功獲得 JWT token、建立認證會話，並重定向至 app_center

### 使用者故事 1 的測試（契約與整合測試 - TDD）

> **注意：先撰寫這些測試，確保在實作前測試會失敗**

- [ ] T014 [P] [US1] POST /auth/login 的契約測試（200、401、422）於 frontend/tests/contract/crm-auth-api.test.ts
- [ ] T015 [P] [US1] 成功登入流程的整合測試於 frontend/tests/integration/login-flow.test.ts
- [ ] T016 [P] [US1] 登入失敗情境的整合測試於 frontend/tests/integration/login-flow.test.ts
- [ ] T017 [P] [US1] authService.login() 的單元測試於 frontend/tests/unit/services/authService.test.ts
- [ ] T018 [P] [US1] auth store login action 的單元測試於 frontend/tests/unit/stores/auth.test.ts

### 使用者故事 1 的實作

- [x] T019 [US1] 在 frontend/src/services/authService.ts 實作 authService.login() - 呼叫 POST /auth/login，處理回應
- [x] T020 [US1] 在 frontend/src/stores/auth.ts 實作 auth store login action - 呼叫 authService，更新狀態，儲存 tokens
- [x] T021 [US1] 在 frontend/src/utils/storage.ts 實作 storage.setAccessToken() - 儲存至 sessionStorage 並記錄過期時間（已在 Phase 2 完成）
- [x] T022 [US1] 更新 frontend/src/components/LoginForm.vue - 新增表單驗證（VeeValidate + Yup）、載入狀態、錯誤顯示（已存在）
- [x] T023 [US1] 更新 frontend/src/views/LoginPage.vue - 整合 LoginForm，處理登入成功/錯誤，重定向邏輯（已更新至 app-center）
- [x] T024 [US1] 建立 frontend/src/composables/useAuth.ts - 登入邏輯、錯誤處理、載入狀態管理（已修正 API 呼叫）
- [x] T025 [US1] 更新 frontend/src/router/index.ts - 新增受保護路由的 auth guard，已認證使用者的重定向邏輯（已更新至 app-center）
- [x] T026 [US1] 建立 frontend/src/views/AppCenterPage.vue - 基本佔位頁面，顯示「歡迎來到應用程式中心」訊息
- [x] T027 [US1] 新增 POST /auth/login 的分析記錄至 analyticsService（login_attempt、login_success、login_failure）（已在 Phase 2 完成）
- [x] T028 [US1] 在載入狀態時禁用登入按鈕以防止重複提交（LoginForm.vue 已實作）

**檢查點**：此時，使用者故事 1 應該完全正常運作且可獨立測試

---

## 階段 4：使用者故事 2 - Token 生命週期管理（優先級：P2）

**目標**：自動管理 JWT token 生命週期，包括自動刷新和 token 失效處理

**獨立測試**：模擬 token 即將過期（<5 分鐘），驗證系統能自動呼叫 /auth/refresh 並更新 token，無需重新登入

### 使用者故事 2 的測試（契約與整合測試 - TDD）

> **注意：先撰寫這些測試，確保在實作前測試會失敗**

- [ ] T032 [P] [US2] POST /auth/refresh 的契約測試（200、401）於 frontend/tests/contract/crm-auth-api.test.ts
- [ ] T033 [P] [US2] 自動 token 刷新的整合測試於 frontend/tests/integration/token-lifecycle.test.ts
- [ ] T034 [P] [US2] Token 刷新失敗（401）→ 登出的整合測試於 frontend/tests/integration/token-lifecycle.test.ts
- [ ] T035 [P] [US2] 401 錯誤攔截 → 重試的整合測試於 frontend/tests/integration/token-lifecycle.test.ts
- [ ] T036 [P] [US2] 多分頁 token 同步的整合測試於 frontend/tests/integration/multi-tab-sync.test.ts
- [ ] T037 [P] [US2] tokenUtils.isTokenExpiring() 的單元測試於 frontend/tests/unit/utils/tokenUtils.test.ts
- [ ] T038 [P] [US2] useTokenRefresh composable 的單元測試於 frontend/tests/unit/composables/useTokenRefresh.test.ts
- [ ] T039 [P] [US2] storage 跨分頁事件的單元測試於 frontend/tests/unit/utils/storage.test.ts

### 使用者故事 2 的實作

- [ ] T040 [US2] 在 frontend/src/services/authService.ts 實作 authService.refreshToken() - 呼叫 POST /auth/refresh
- [ ] T041 [US2] 在 frontend/src/utils/tokenUtils.ts 實作 tokenUtils.parseJWT() - 解碼 JWT 但不驗證
- [ ] T042 [US2] 在 frontend/src/utils/tokenUtils.ts 實作 tokenUtils.isTokenExpiring() - 檢查剩餘時間是否 < 5 分鐘
- [ ] T043 [US2] 在 frontend/src/utils/tokenUtils.ts 實作 tokenUtils.getTokenExpiry() - 從 JWT payload 提取 exp
- [ ] T044 [US2] 建立 frontend/src/composables/useTokenRefresh.ts - 自動刷新邏輯，使用 setInterval（每 1 分鐘檢查一次）
- [ ] T045 [US2] 更新 frontend/src/services/api.ts - 新增 request interceptor 從 sessionStorage 附加 Bearer token
- [ ] T046 [US2] 更新 frontend/src/services/api.ts - 新增 response interceptor 處理 401 錯誤，包含 token 刷新與重試
- [ ] T047 [US2] 在 frontend/src/services/api.ts 實作 request queue - 防止並發 401 時的重複刷新請求
- [ ] T048 [US2] 更新 frontend/src/utils/storage.ts - 新增 localStorage 事件廣播用於 token 更新（auth_token_update key）
- [ ] T049 [US2] 更新 frontend/src/utils/storage.ts - 在其他分頁新增 storage event listener 從 sessionStorage 同步 token
- [ ] T050 [US2] 在 frontend/src/stores/auth.ts 更新 auth store - 新增 refreshToken action 並處理刷新失敗（清除狀態 + 重定向）
- [ ] T051 [US2] 在 frontend/src/App.vue 整合 useTokenRefresh - 認證時啟動自動刷新
- [ ] T052 [US2] 新增 token 刷新分析記錄（token_refresh_start、token_refresh_success、token_refresh_failure）

**檢查點**：此時，使用者故事 1 和 2 都應該能獨立正常運作

---

## 階段 5：使用者故事 3 - 使用者資訊與會話管理（優先級：P3）

**目標**：顯示使用者資訊並提供登出功能

**獨立測試**：成功登入後，驗證 app_center 頁面能顯示使用者資訊（透過 /auth/me），且點擊登出按鈕能清除會話並返回登入頁面

### 使用者故事 3 的測試（契約與整合測試 - TDD）

> **注意：先撰寫這些測試，確保在實作前測試會失敗**

- [ ] T055 [P] [US3] GET /auth/me 的契約測試（200、401）於 frontend/tests/contract/crm-auth-api.test.ts
- [ ] T056 [P] [US3] POST /auth/logout 的契約測試（200、401）於 frontend/tests/contract/crm-auth-api.test.ts
- [ ] T057 [P] [US3] 取得使用者資訊流程的整合測試於 frontend/tests/integration/login-flow.test.ts
- [ ] T058 [P] [US3] 登出流程的整合測試於 frontend/tests/integration/login-flow.test.ts
- [ ] T059 [P] [US3] authService.getCurrentUser() 的單元測試於 frontend/tests/unit/services/authService.test.ts
- [ ] T060 [P] [US3] authService.logout() 的單元測試於 frontend/tests/unit/services/authService.test.ts
- [ ] T061 [P] [US3] auth store logout action 的單元測試於 frontend/tests/unit/stores/auth.test.ts

### 使用者故事 3 的實作

- [ ] T062 [P] [US3] 在 frontend/src/services/authService.ts 實作 authService.getCurrentUser() - 呼叫 GET /auth/me
- [ ] T063 [P] [US3] 在 frontend/src/services/authService.ts 實作 authService.logout() - 呼叫 POST /auth/logout
- [ ] T064 [US3] 在 frontend/src/stores/auth.ts 更新 auth store - 新增 fetchUser action（呼叫 getCurrentUser，更新 user 狀態）
- [ ] T065 [US3] 在 frontend/src/stores/auth.ts 更新 auth store - 新增 logout action（呼叫 authService.logout，清除狀態，重定向）
- [ ] T066 [US3] 更新 frontend/src/utils/storage.ts - 新增 clearAuthState() 移除 access_token 並觸發跨分頁登出
- [ ] T067 [US3] 更新 frontend/src/views/AppCenterPage.vue - 顯示使用者資訊（fullName、email、department、region）
- [ ] T068 [US3] 建立 frontend/src/components/AppHeader.vue - 新增登出按鈕並確認
- [ ] T069 [US3] 更新 frontend/src/App.vue - 整合 AppHeader 元件
- [ ] T070 [US3] 更新 frontend/src/composables/useAuth.ts - 新增 logout() 方法
- [ ] T071 [US3] 新增多分頁登出同步 - 在 frontend/src/stores/auth.ts 監聽 clearAuthState 的 storage events
- [ ] T072 [US3] 新增登出分析記錄（logout_start、logout_success、logout_failure）

**檢查點**：所有使用者故事現在都應該能獨立正常運作

---

## 階段 6：跨領域關注點（來自澄清階段）

**目的**：來自澄清會議的額外需求（登入速率限制、離線偵測等）

### 跨領域關注點的測試（TDD）

> **注意：先撰寫這些測試，確保在實作前測試會失敗**

- [ ] T075 [P] useLoginRateLimit composable 的單元測試於 frontend/tests/unit/composables/useLoginRateLimit.test.ts
- [ ] T076 [P] useOfflineDetection composable 的單元測試於 frontend/tests/unit/composables/useOfflineDetection.test.ts
- [ ] T077 [P] 登入速率限制（3-5 次嘗試 → 15 分鐘鎖定）的整合測試於 frontend/tests/integration/login-flow.test.ts
- [ ] T078 [P] 離線偵測的整合測試於 frontend/tests/integration/login-flow.test.ts

### 跨領域關注點的實作

- [ ] T079 [P] 建立 frontend/src/composables/useLoginRateLimit.ts - 在 localStorage 追蹤登入嘗試，失敗 3-5 次後實作 15 分鐘鎖定
- [ ] T080 [P] 建立 frontend/src/composables/useOfflineDetection.ts - 監控 navigator.onLine，監聽 online/offline 事件
- [ ] T081 更新 frontend/src/stores/ui.ts - 新增 isOffline 狀態與 actions
- [ ] T082 建立 frontend/src/components/OfflineIndicator.vue - 離線時顯示「無網路連線」訊息
- [ ] T083 更新 frontend/src/App.vue - 整合 OfflineIndicator 元件
- [ ] T084 更新 frontend/src/App.vue - 初始化 useOfflineDetection composable
- [ ] T085 更新 frontend/src/composables/useAuth.ts - 整合 useLoginRateLimit，登入前檢查
- [ ] T086 更新 frontend/src/components/LoginForm.vue - 離線或帳號鎖定時禁用登入按鈕
- [ ] T087 更新 frontend/src/components/LoginForm.vue - 帳號鎖定時顯示倒數計時
- [ ] T088 新增離線/上線事件分析記錄（offline_detected、online_restored）
- [ ] T089 新增速率限制分析記錄（login_rate_limit_triggered、login_rate_limit_expired）

---

## 階段 7：優化與無障礙功能

**目的**：改善使用者體驗、無障礙功能與文件

- [ ] T092 [P] 為 LoginForm 的輸入欄位與按鈕新增 ARIA 標籤以支援螢幕閱讀器於 frontend/src/components/LoginForm.vue
- [ ] T093 [P] 實作鍵盤導航支援（Tab、Enter）於 frontend/src/components/LoginForm.vue
- [ ] T094 [P] 新增焦點管理 - 載入時自動聚焦使用者名稱欄位於 frontend/src/views/LoginPage.vue
- [ ] T095 [P] 確保錯誤訊息與按鈕的顏色對比符合 WCAG 2.1 AA 標準
- [ ] T096 [P] 新增載入旋轉器元件以改善載入使用者體驗於 frontend/src/components/LoadingSpinner.vue
- [ ] T097 更新 frontend/src/components/LoginForm.vue - 整合 LoadingSpinner
- [ ] T098 [P] 新增 API 逾時錯誤處理，顯示使用者友善訊息「請求逾時，請檢查網路連線」
- [ ] T099 [P] 驗證 quickstart.md 工作流程 - 確保所有步驟正確
- [ ] T100 [P] 更新 CLAUDE.md 包含最終技術堆疊與專案結構
- [ ] T101 程式碼清理與重構 - 移除 console.logs，最佳化 imports

---

## 相依性與執行順序

### 階段相依性

- **專案設定（階段 1）**：無相依性 - 可立即開始
- **基礎建設（階段 2）**：相依於專案設定完成 - 阻塞所有使用者故事
- **使用者故事（階段 3-5）**：全部相依於基礎建設階段完成
  - 使用者故事之後可並行執行（如有人力配置）
  - 或依優先順序依序執行（P1 → P2 → P3）
- **跨領域關注點（階段 6）**：可在基礎建設之後開始，與使用者故事並行
- **優化（階段 7）**：相依於所有期望的使用者故事完成

### 使用者故事相依性

- **使用者故事 1（P1）**：可在基礎建設（階段 2）後開始 - 不相依於其他故事
- **使用者故事 2（P2）**：可在基礎建設（階段 2）後開始 - 擴展 US1 但可獨立測試
- **使用者故事 3（P3）**：可在基礎建設（階段 2）後開始 - 相依於 US1 登入流程但可獨立測試

### 每個使用者故事內部

- 測試必須先撰寫並在實作前失敗（TDD）
- Utils/services 先於 composables
- Composables 先於 components
- Components 先於 views
- Views 先於 router 整合
- 核心實作先於分析記錄
- 故事完成後再進入下一個優先級

### 並行執行機會

- 所有標記 [P] 的專案設定任務可並行執行
- 所有標記 [P] 的基礎建設任務可並行執行（在階段 2 內）
- 基礎建設階段完成後，所有使用者故事可並行開始（如團隊容量允許）
- 使用者故事內所有標記 [P] 的測試可並行執行
- 故事內所有標記 [P] 的 utils/services 可並行執行
- 不同使用者故事可由不同團隊成員並行處理

---

## 並行範例：使用者故事 1

```bash
# 一起啟動使用者故事 1 的所有契約測試（TDD 優先）：
Task T014：「POST /auth/login 的契約測試於 frontend/tests/contract/crm-auth-api.test.ts」
Task T015：「成功登入流程的整合測試於 frontend/tests/integration/login-flow.test.ts」
Task T016：「登入失敗情境的整合測試於 frontend/tests/integration/login-flow.test.ts」
Task T017：「authService.login() 的單元測試於 frontend/tests/unit/services/authService.test.ts」
Task T018：「auth store login action 的單元測試於 frontend/tests/unit/stores/auth.test.ts」

# 測試失敗後，啟動並行實作：
Task T019：「在 frontend/src/services/authService.ts 實作 authService.login()」
Task T021：「在 frontend/src/utils/storage.ts 實作 storage.setAccessToken()」
Task T024：「在 frontend/src/composables/useAuth.ts 建立 useAuth.ts composable」
```

---

## 並行範例：使用者故事 2

```bash
# 一起啟動所有測試（TDD 優先）：
Task T032-T039：token lifecycle 的所有契約、整合和單元測試

# 測試失敗後，啟動並行實作：
Task T040：「實作 authService.refreshToken()」
Task T041：「實作 tokenUtils.parseJWT()」
Task T042：「實作 tokenUtils.isTokenExpiring()」
Task T043：「實作 tokenUtils.getTokenExpiry()」
Task T044：「建立 useTokenRefresh.ts composable」
```

---

## 實作策略

### MVP 優先（僅使用者故事 1）

1. 完成階段 1：專案設定
2. 完成階段 2：基礎建設（關鍵 - 阻塞所有故事）
3. 完成階段 3：使用者故事 1（測試 → 實作）
4. **停止並驗證**：獨立測試使用者故事 1
5. 如準備好即可部署/展示

### 漸進式交付

1. 完成專案設定 + 基礎建設 → 基礎就緒
2. 新增使用者故事 1 → 獨立測試 → 部署/展示（MVP！基本登入認證）
3. 新增使用者故事 2 → 獨立測試 → 部署/展示（Token 生命週期管理）
4. 新增使用者故事 3 → 獨立測試 → 部署/展示（使用者資訊與會話管理）
5. 新增跨領域關注點（階段 6）→ 測試 → 部署（速率限制、離線偵測）
6. 新增優化（階段 7）→ 最終發布
7. 每個增量都增加價值且不破壞先前功能

### 並行團隊策略

若有多位開發人員：

1. 團隊一起完成專案設定 + 基礎建設
2. 基礎建設完成後：
   - 開發人員 A：使用者故事 1（T014-T028）
   - 開發人員 B：使用者故事 2（T032-T052）
   - 開發人員 C：使用者故事 3（T055-T072）
   - 開發人員 D：跨領域關注點（T075-T089）
3. 故事獨立完成並整合
4. 團隊一起完成優化

---

## 測試執行順序（TDD 工作流程）

依照憲章需求：**TDD 為必要**

### 階段 3（使用者故事 1）- TDD 循環

1. **紅燈**：撰寫契約測試（T014-T018）→ 所有測試失敗
2. **綠燈**：實作最小程式碼（T019-T028）→ 測試通過
3. **重構**：清理程式碼，最佳化

### 階段 4（使用者故事 2）- TDD 循環

1. **紅燈**：撰寫契約/整合測試（T032-T039）→ 所有測試失敗
2. **綠燈**：實作 token 生命週期（T040-T052）→ 測試通過
3. **重構**：清理程式碼，最佳化

### 階段 5（使用者故事 3）- TDD 循環

1. **紅燈**：撰寫契約/整合測試（T055-T061）→ 所有測試失敗
2. **綠燈**：實作使用者資訊與登出（T062-T072）→ 測試通過
3. **重構**：清理程式碼，最佳化

### 階段 6（跨領域關注點）- TDD 循環

1. **紅燈**：撰寫單元/整合測試（T075-T078）→ 所有測試失敗
2. **綠燈**：實作速率限制與離線偵測（T079-T089）→ 測試通過
3. **重構**：清理程式碼，最佳化

---

## 注意事項

- [P] 任務 = 不同檔案，無相依性 - 可並行執行
- [Story] 標籤將任務對應至特定使用者故事以便追蹤
- 每個使用者故事都應該可獨立完成與測試
- **TDD 為必要**：先撰寫測試，確保失敗，然後實作
- 在實作前驗證測試失敗（紅燈 → 綠燈 → 重構）
- 在每個任務或邏輯群組後提交
- 在任何檢查點停止以獨立驗證故事
- 所有錯誤訊息必須使用繁體中文
- 所有 UI 文字必須使用繁體中文
- 業務邏輯的程式碼註解應優先使用繁體中文
- 所有使用者操作與 API 請求都需要分析記錄
- 避免：模糊的任務、相同檔案衝突、破壞獨立性的跨故事相依性

---

## 任務數量摘要

- **階段 1（專案設定）**：4 個任務
- **階段 2（基礎建設）**：9 個任務
- **階段 3（使用者故事 1）**：15 個任務（5 個測試 + 10 個實作）
- **階段 4（使用者故事 2）**：21 個任務（8 個測試 + 13 個實作）
- **階段 5（使用者故事 3）**：18 個任務（7 個測試 + 11 個實作）
- **階段 6（跨領域關注點）**：15 個任務（4 個測試 + 11 個實作）
- **階段 7（優化）**：10 個任務

**總計**：92 個任務

**MVP 範圍（僅使用者故事 1）**：28 個任務（階段 1 + 階段 2 + 階段 3）
