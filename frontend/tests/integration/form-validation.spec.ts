// tests/integration/form-validation.spec.ts
// Integration 測試 - 表單驗證與即時回饋

import { test, expect } from '@playwright/test'

test.describe('[US3] Form Validation Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/login')
  })

  test('應在空白帳號欄位失焦時顯示驗證錯誤', async ({ page }) => {
    // 聚焦到帳號欄位
    await page.focus('input[name="username"]')

    // 失焦（不輸入任何內容）
    await page.blur('input[name="username"]')

    // 等待錯誤訊息出現
    await page.waitForSelector('text=帳號為必填欄位', { timeout: 1000 })

    // 驗證錯誤訊息顯示
    const errorMessage = await page.locator('text=帳號為必填欄位')
    await expect(errorMessage).toBeVisible()
  })

  test('應在帳號長度不足時顯示驗證錯誤', async ({ page }) => {
    // 輸入少於 3 個字元
    await page.fill('input[name="username"]', 'ab')
    await page.blur('input[name="username"]')

    // 驗證錯誤訊息
    await expect(page.locator('text=帳號至少需 3 個字元')).toBeVisible()
  })

  test('應在密碼長度不足時顯示驗證錯誤', async ({ page }) => {
    // 輸入少於 6 個字元的密碼
    await page.fill('input[name="password"]', '12345')
    await page.blur('input[name="password"]')

    // 驗證錯誤訊息
    await expect(page.locator('text=密碼長度至少需 6 個字元')).toBeVisible()
  })

  test('應在修正錯誤後移除驗證訊息並啟用按鈕', async ({ page }) => {
    // 先產生錯誤
    await page.fill('input[name="username"]', 'ab')
    await page.blur('input[name="username"]')
    await expect(page.locator('text=帳號至少需 3 個字元')).toBeVisible()

    // 驗證按鈕被禁用
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeDisabled()

    // 修正錯誤
    await page.fill('input[name="username"]', 'valid_user')
    await page.fill('input[name="password"]', 'valid_password')
    await page.blur('input[name="password"]')

    // 等待錯誤訊息消失
    await expect(page.locator('text=帳號至少需 3 個字元')).not.toBeVisible()

    // 驗證按鈕啟用
    await expect(submitButton).not.toBeDisabled()
  })

  test('應在所有欄位驗證通過前禁用登入按鈕', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]')

    // 初始狀態應該禁用
    await expect(submitButton).toBeDisabled()

    // 只填寫帳號
    await page.fill('input[name="username"]', 'user@example.com')
    await expect(submitButton).toBeDisabled()

    // 填寫密碼但長度不足
    await page.fill('input[name="password"]', '123')
    await expect(submitButton).toBeDisabled()

    // 填寫有效密碼
    await page.fill('input[name="password"]', '123456')
    await expect(submitButton).not.toBeDisabled()
  })

  test('應支援密碼顯示/隱藏切換', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]')
    const toggleButton = page.locator('button', { has: page.locator('text=/👁/') })

    // 初始應該是 password 類型
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // 點擊切換按鈕
    await toggleButton.click()

    // 應該變成 text 類型
    await expect(passwordInput).toHaveAttribute('type', 'text')

    // 再次點擊切換回去
    await toggleButton.click()

    // 應該回到 password 類型
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('應支援 Enter 鍵提交表單', async ({ page }) => {
    // 填寫有效資料
    await page.fill('input[name="username"]', 'user@example.com')
    await page.fill('input[name="password"]', 'ValidPassword123')

    // 在密碼欄位按 Enter
    await page.press('input[name="password"]', 'Enter')

    // 應該觸發提交並導向 dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 5000 })
  })

  test('應支援 Tab 鍵在欄位間導航', async ({ page }) => {
    // 聚焦到帳號欄位
    await page.focus('input[name="username"]')

    // 按 Tab 鍵
    await page.keyboard.press('Tab')

    // 應該聚焦到密碼欄位
    const passwordInput = page.locator('input[name="password"]')
    await expect(passwordInput).toBeFocused()

    // 再按 Tab
    await page.keyboard.press('Tab')

    // 應該聚焦到記住我 checkbox
    const rememberMeCheckbox = page.locator('input[type="checkbox"]#rememberMe')
    await expect(rememberMeCheckbox).toBeFocused()
  })

  test('應在驗證訊息顯示後 100ms 內回應', async ({ page }) => {
    const startTime = Date.now()

    // 輸入無效資料並失焦
    await page.fill('input[name="username"]', 'ab')
    await page.blur('input[name="username"]')

    // 等待錯誤訊息出現
    await page.waitForSelector('text=帳號至少需 3 個字元')

    const endTime = Date.now()
    const duration = endTime - startTime

    // 驗證回應時間在 100ms 內
    expect(duration).toBeLessThan(100)
  })

  test('應顯示無障礙錯誤訊息（aria-describedby）', async ({ page }) => {
    // 產生錯誤
    await page.fill('input[name="username"]', 'ab')
    await page.blur('input[name="username"]')

    // 檢查 aria-describedby 屬性
    const usernameInput = page.locator('input[name="username"]')
    const ariaDescribedBy = await usernameInput.getAttribute('aria-describedby')
    expect(ariaDescribedBy).toBeTruthy()

    // 檢查 aria-invalid 屬性
    const ariaInvalid = await usernameInput.getAttribute('aria-invalid')
    expect(ariaInvalid).toBe('true')
  })

  test('應正確處理密碼特殊字元', async ({ page }) => {
    // 輸入包含特殊字元的密碼
    await page.fill('input[name="username"]', 'user@example.com')
    await page.fill('input[name="password"]', 'P@ssw0rd!#$%')

    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).not.toBeDisabled()

    // 應該可以提交
    await submitButton.click()
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 5000 })
  })
})
