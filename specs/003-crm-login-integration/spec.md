# Feature Specification: CRM Login Integration

**Feature Branch**: `003-crm-login-integration`
**Created**: 2025-01-24
**Status**: Draft
**Input**: User description: "docs\openapi.yaml有crm的api說明,目標是透過前端專案串接crm的api完成登入的功能,且登入後導至應用程式中心"

**核心目標**: 整合前端應用程式與 CRM 認證 API，讓使用者能夠透過 CRM 系統登入，並在成功認證後存取應用程式中心。

## Clarifications

### Session 2025-01-24

- Q: Login security rate limiting - How should the system protect against brute-force login attempts? → A: 3-5 failed attempts trigger 15-minute account lockout (frontend + backend)
- Q: Network reliability retry policy - How should the system handle transient network failures during login and API requests? → A: No automatic retry - show error immediately on first failure
- Q: Multi-tab synchronization for token management - How should token updates be synchronized across multiple browser tabs? → A: Use localStorage events to broadcast token updates across all tabs in real-time
- Q: Observability - Error and activity logging - What level of logging should be implemented for monitoring and debugging? → A: Full activity logging - all API requests, responses, and user actions logged to analytics service
- Q: Offline behavior - How should the system behave when the user has no internet connection? → A: Detect offline state, show clear "No internet connection" message, disable login attempts

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 基本登入認證 (Priority: P1)

使用者需要使用帳號和密碼登入系統，透過 CRM API 進行身份驗證，成功後獲得系統存取權限並進入應用程式中心。

**Why this priority**: 這是最基本且必要的功能，沒有登入就無法存取系統的任何功能。這是整個系統的入口點，必須優先實現。

**Independent Test**: 可透過在登入頁面輸入有效的 CRM 使用者憑證（帳號密碼），驗證使用者能成功獲得 JWT token、建立認證會話，並被重定向至應用程式中心頁面來完整測試。

**Acceptance Scenarios**:

1. **Given** 使用者擁有有效的 CRM 帳號憑證，**When** 他們在登入頁面輸入帳號和密碼並提交表單，**Then** 系統透過 CRM API 驗證憑證、返回 access_token 和 refresh_token、儲存 tokens、並將使用者重定向至應用程式中心
2. **Given** 使用者輸入錯誤的帳號或密碼，**When** 他們提交登入表單，**Then** CRM API 返回 401 錯誤，系統顯示「帳號或密碼錯誤」的錯誤訊息，使用者停留在登入頁面
3. **Given** 使用者已成功登入並持有有效 token，**When** 他們嘗試訪問登入頁面，**Then** 系統檢測到有效的認證狀態並自動將使用者重定向至應用程式中心
4. **Given** 使用者的 access_token 即將過期（剩餘時間 < 5 分鐘），**When** 系統自動檢測到即將過期的 token，**Then** 系統使用 refresh_token 透過 CRM API 自動更新 access_token，使用者可繼續使用系統無需重新登入

---

### User Story 2 - Token 生命週期管理 (Priority: P2)

使用者登入後，系統需要自動管理 JWT token 的生命週期，包括自動刷新即將過期的 token 和處理 token 失效的情況，確保使用者體驗流暢且安全。

**Why this priority**: Token 自動刷新機制能提升使用者體驗，避免頻繁要求重新登入。這是基本登入功能之後的重要增強功能，但不影響最基本的登入流程。

**Independent Test**: 可透過模擬 token 即將過期的情況（修改 token 的 expires_in 為小於 5 分鐘），驗證系統能自動呼叫 `/auth/refresh` API 並更新 token，使用者無需重新登入即可繼續使用系統。

**Acceptance Scenarios**:

1. **Given** 使用者持有的 access_token 剩餘有效時間少於 5 分鐘，**When** 系統檢測到 token 即將過期，**Then** 系統自動使用 refresh_token 向 CRM API `/auth/refresh` 端點請求新的 access_token，更新儲存的 token，使用者無感知地繼續使用系統
2. **Given** 使用者的 refresh_token 已失效或過期，**When** 系統嘗試刷新 access_token 時收到 401 錯誤，**Then** 系統清除所有認證狀態、顯示「登入已過期，請重新登入」訊息、並將使用者重定向至登入頁面
3. **Given** 使用者在執行 API 請求時收到 401 錯誤（token 無效），**When** 系統攔截到 401 回應，**Then** 系統自動嘗試使用 refresh_token 刷新 access_token，成功後自動重試原始請求；若刷新失敗則導向登入頁面

---

### User Story 3 - 使用者資訊與會話管理 (Priority: P3)

使用者登入後，系統需要從 CRM API 獲取並顯示使用者的基本資訊（如姓名、email、部門等），並在應用程式中心提供登出功能。

**Why this priority**: 顯示使用者資訊和提供登出功能能提升使用者體驗和系統完整性，但這些功能不影響核心的登入認證流程，可以在基本功能完成後再實現。

**Independent Test**: 可透過成功登入後，驗證應用程式中心頁面能正確顯示使用者資訊（透過呼叫 `/auth/me` API 獲取），且點擊登出按鈕後能成功清除會話並返回登入頁面來測試。

**Acceptance Scenarios**:

1. **Given** 使用者已成功登入，**When** 使用者進入應用程式中心頁面，**Then** 系統透過 CRM API `/auth/me` 端點獲取使用者資訊，並在頁面上顯示使用者的姓名、email 等基本資訊
2. **Given** 使用者已登入且在應用程式中心，**When** 使用者點擊登出按鈕，**Then** 系統呼叫 CRM API `/auth/logout` 端點、清除本地儲存的所有 tokens 和使用者資料、並將使用者重定向至登入頁面
3. **Given** 使用者已登出，**When** 使用者嘗試直接訪問應用程式中心 URL，**Then** 系統檢測到無有效認證狀態並自動重定向至登入頁面

---

### Edge Cases

- 當 CRM API 伺服器無回應或網路中斷時如何處理？系統應顯示友善的錯誤訊息（如「無法連線至伺服器，請稍後再試」）而非技術性錯誤
- 當使用者在多個瀏覽器分頁同時登入時，系統透過 localStorage 事件機制即時廣播 token 更新，確保所有分頁都使用相同的最新 token，避免衝突；當一個分頁登出時，其他分頁也應同步登出
- 當使用者帳號在其他地方被停用（is_active = false）時，下次 API 請求應返回 401，系統需正確處理並要求重新登入
- 當 refresh_token 在 HttpOnly cookie 中但因瀏覽器設定而無法讀取時，系統如何優雅處理？應提供清晰的錯誤訊息指引使用者
- 當使用者快速連續點擊登入按鈕時，應防止重複提交請求（使用 loading 狀態和按鈕禁用）
- 當使用者因連續登入失敗被鎖定 15 分鐘時，系統應清楚告知使用者剩餘鎖定時間，並在鎖定期間拒絕登入嘗試
- 當瀏覽器偵測到離線狀態時，系統應立即顯示「無網路連線」訊息並禁用所有需要網路的操作；當網路恢復時，系統應自動移除離線訊息並重新啟用功能

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系統必須提供使用者登入介面，包含帳號（username）和密碼（password）輸入欄位以及提交按鈕
- **FR-002**: 系統必須在使用者提交登入表單時，向 CRM 認證服務傳送帳號和密碼進行身份驗證
- **FR-003**: 系統必須在認證成功後，安全地儲存 access_token 和 refresh_token（access token 存於會話儲存，refresh token 存於安全的 HTTP-only 儲存）
- **FR-004**: 系統必須在成功儲存認證資訊後，將使用者重定向至應用程式中心頁面
- **FR-005**: 系統必須在每個需要認證的請求中，自動附加使用者的認證憑證
- **FR-006**: 系統必須在使用者登入失敗時（401 錯誤），顯示清晰的錯誤訊息告知使用者「帳號或密碼錯誤」
- **FR-007**: 系統必須在使用者已登入且持有有效 token 時，訪問登入頁面自動重定向至應用程式中心
- **FR-008**: 系統必須在受保護頁面（如應用程式中心）被訪問時，檢查是否存在有效的 access_token，若無則重定向至登入頁面
- **FR-009**: 系統必須在檢測到 access_token 剩餘有效時間少於 5 分鐘時，自動向 CRM 認證服務請求更新 token
- **FR-010**: 系統必須在攔截到未授權錯誤（401）時，自動嘗試使用 refresh_token 刷新 access_token 並重試原始請求
- **FR-011**: 系統必須在 token 刷新失敗（refresh_token 失效）時，清除所有認證狀態並重定向使用者至登入頁面
- **FR-012**: 系統必須提供登出功能，向 CRM 認證服務發送登出請求並清除所有本地儲存的認證資料
- **FR-013**: 系統必須在使用者登入成功後，從 CRM 認證服務獲取使用者資訊並儲存至應用程式狀態
- **FR-014**: 系統必須在應用程式中心顯示使用者的基本資訊（姓名、email、部門等）
- **FR-015**: 系統必須在登入請求進行時顯示載入狀態（如 spinner 或 loading 文字），並禁用提交按鈕防止重複提交
- **FR-016**: 系統必須在網路錯誤（timeout、無回應等）發生時立即顯示友善的錯誤訊息，不進行自動重試，讓使用者可選擇手動重試
- **FR-017**: 系統必須在使用者連續 3-5 次登入失敗後，鎖定該帳號 15 分鐘，防止暴力破解攻擊（前端和後端皆需實施）
- **FR-018**: 系統必須為所有 CRM 認證服務請求設定合理的超時時間（建議 10-15 秒），超時後視為網路錯誤並立即通知使用者
- **FR-019**: 系統必須使用 localStorage 事件機制在多個瀏覽器分頁之間即時同步 token 更新，確保所有分頁使用相同的最新認證憑證
- **FR-020**: 系統必須記錄所有 API 請求、回應和使用者操作（登入嘗試、登入成功/失敗、token 刷新、登出、頁面導航等）至分析服務，以支援監控、除錯和安全審計
- **FR-021**: 系統必須偵測瀏覽器離線狀態，當偵測到無網路連線時顯示清晰的「無網路連線」訊息，並禁用登入按鈕和所有需要網路的功能

### Key Entities

- **使用者憑證**: 包含帳號和密碼，用於向 CRM 認證服務進行身份驗證
- **Access Token**: 短期存取令牌，由 CRM 認證服務返回，有效期限為 1 小時，儲存於會話儲存中，用於後續請求的身份驗證
- **Refresh Token**: 長期更新令牌，由 CRM 認證服務返回，儲存於安全的 HTTP-only 儲存中以提高安全性，有效期限較長（數天至數週），用於更新 access_token
- **使用者資訊**: 包含使用者 ID、帳號、電子郵件、全名、部門、地區、帳號狀態、最後登入時間等欄位，由 CRM 認證服務提供
- **認證會話**: 使用者登入後的狀態，包含 access_token、refresh_token、使用者資訊和認證狀態標記

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 使用者使用有效憑證在穩定網路環境下，能在 3 秒內完成登入流程並到達應用程式中心頁面
- **SC-002**: 當使用者的 access_token 即將過期時，系統能在不中斷使用者操作的情況下自動完成 token 刷新（使用者無感知）
- **SC-003**: 95% 的登入錯誤情況（帳號密碼錯誤、網路錯誤、伺服器錯誤）都能向使用者顯示清晰且友善的中文錯誤訊息
- **SC-004**: 使用者在登入成功後的任何時間點，都能透過點擊登出按鈕，在 2 秒內完成登出並返回登入頁面
- **SC-005**: 當使用者的 refresh_token 失效時，系統能在 1 秒內清除認證狀態並重定向至登入頁面，不會造成使用者困惑或卡住
- **SC-006**: 100% 的認證相關活動（登入、登出、token 操作、錯誤）和 API 請求都能成功記錄至分析服務，確保完整的審計追蹤

## Assumptions *(optional)*

- CRM 認證服務已正確設定並可從前端應用程式的網路環境存取（跨域請求已正確配置）
- CRM 認證服務的登入、登出、token 更新和使用者資訊查詢功能已實作並可用
- 前端應用程式已有基本的路由系統可處理頁面導航和路由保護
- 前端應用程式已有狀態管理系統可儲存認證狀態和使用者資訊
- 目標瀏覽器支援會話儲存和安全的 HTTP-only cookie 儲存機制
- Access token 的有效期限為 1 小時
- Refresh token 的有效期限足夠長（至少數天），可支援合理的會話持續時間
- CRM 認證服務使用標準的 HTTP 狀態碼（200 成功、401 未授權、422 驗證錯誤等）

## Dependencies *(optional)*

- **CRM 認證服務**: 前端必須能存取 CRM 認證服務的登入、登出、token 更新和使用者資訊查詢功能
- **CRM 認證服務規格**: CRM 認證服務的行為必須符合 `docs/openapi.yaml` 中定義的規格
- **前端路由系統**: 需要路由系統支援程式化導航和路由守衛以實現認證檢查和頁面重定向
- **前端狀態管理**: 需要狀態管理系統儲存和管理認證狀態（tokens、使用者資訊、登入狀態）
- **HTTP 客戶端**: 需要支援請求/回應攔截的 HTTP 客戶端以實現自動添加認證憑證和處理未授權錯誤
- **應用程式中心頁面**: 需要有應用程式中心頁面的基本實作，作為登入成功後的導向目標
- **分析服務**: 需要分析/日誌服務以接收和儲存所有 API 請求、回應和使用者操作的日誌資料

## Scope Boundaries *(optional)*

### In Scope

- 使用者使用帳號密碼透過 CRM API 登入的完整流程
- Access token 和 refresh token 的儲存管理
- 自動 token 刷新機制（當 token 即將過期時）
- 登入頁面的 UI/UX 設計和實作
- 路由守衛實作以保護需要認證的頁面
- 登出功能實作（呼叫 API 並清除本地狀態）
- 從 CRM API 獲取和顯示使用者基本資訊
- 錯誤處理和友善錯誤訊息顯示
- API 請求攔截器實作（自動添加 Authorization header、處理 401 錯誤）

### Out of Scope

- CRM API 後端的實作或修改（假設 API 已存在且可用）
- 其他認證方式（如 OAuth2、SSO、多因素認證等）
- 使用者註冊功能（新增使用者帳號）
- 密碼重設或忘記密碼功能
- 記住我（Remember me）功能的進階實作（如延長 session 時間）
- 使用者個人資料的編輯功能
- 角色和權限管理（Role-Based Access Control）的 UI 實作
- CRM API 的其他功能模組（Roles、Permissions、Role Assignments、Audit Logs 等），這些在未來需求中可能會實作
- 完整的應用程式中心功能實作（僅需基本頁面可供導向即可）
- 多語系支援（目前僅支援中文）
- 使用者操作審計日誌的前端顯示
