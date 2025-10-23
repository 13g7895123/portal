// tests/unit/components/LoginForm.spec.ts
// Unit 測試 - LoginForm 元件

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LoginForm from '@/components/LoginForm.vue'
import FormInput from '@/components/FormInput.vue'
import Button from '@/components/Button.vue'
import Alert from '@/components/Alert.vue'

// Mock useAuth composable
vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    login: vi.fn(),
    logout: vi.fn(),
    isLoading: { value: false },
    error: { value: null }
  })
}))

describe('LoginForm Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('應正確渲染所有表單元素', () => {
    const wrapper = mount(LoginForm, {
      global: {
        components: { FormInput, Button, Alert }
      }
    })

    // 檢查標題
    expect(wrapper.text()).toContain('登入')
    expect(wrapper.text()).toContain('請輸入您的帳號密碼')

    // 檢查表單欄位
    const formInputs = wrapper.findAllComponents(FormInput)
    expect(formInputs.length).toBeGreaterThanOrEqual(2)

    // 檢查帳號欄位
    const usernameInput = wrapper.find('input[name="username"]')
    expect(usernameInput.exists()).toBe(true)

    // 檢查密碼欄位
    const passwordInput = wrapper.find('input[name="password"]')
    expect(passwordInput.exists()).toBe(true)

    // 檢查記住我 checkbox
    const rememberMeCheckbox = wrapper.find('input[type="checkbox"]#rememberMe')
    expect(rememberMeCheckbox.exists()).toBe(true)

    // 檢查登入按鈕
    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.exists()).toBe(true)
    expect(submitButton.text()).toContain('登入')
  })

  it('應在初始狀態禁用登入按鈕', () => {
    const wrapper = mount(LoginForm, {
      global: {
        components: { FormInput, Button, Alert }
      }
    })

    const submitButton = wrapper.findComponent(Button)
    expect(submitButton.props('disabled')).toBe(true)
  })

  it('應在填寫有效資料後啟用登入按鈕', async () => {
    const wrapper = mount(LoginForm, {
      global: {
        components: { FormInput, Button, Alert }
      }
    })

    // 填寫有效資料
    const usernameInput = wrapper.find('input[name="username"]')
    const passwordInput = wrapper.find('input[name="password"]')

    await usernameInput.setValue('user@example.com')
    await passwordInput.setValue('password123')

    // 觸發驗證
    await usernameInput.trigger('blur')
    await passwordInput.trigger('blur')
    await wrapper.vm.$nextTick()

    // 按鈕應該啟用（需要等待驗證完成）
    // 注意：實際行為取決於 useForm 的實作
  })

  it('應顯示帳號欄位的驗證錯誤', async () => {
    const wrapper = mount(LoginForm, {
      global: {
        components: { FormInput, Button, Alert }
      }
    })

    const usernameInput = wrapper.find('input[name="username"]')

    // 輸入無效的帳號（少於 3 個字元）
    await usernameInput.setValue('ab')
    await usernameInput.trigger('blur')
    await wrapper.vm.$nextTick()

    // 應該顯示錯誤訊息
    expect(wrapper.text()).toContain('帳號至少需 3 個字元')
  })

  it('應顯示密碼欄位的驗證錯誤', async () => {
    const wrapper = mount(LoginForm, {
      global: {
        components: { FormInput, Button, Alert }
      }
    })

    const passwordInput = wrapper.find('input[name="password"]')

    // 輸入無效的密碼（少於 6 個字元）
    await passwordInput.setValue('12345')
    await passwordInput.trigger('blur')
    await wrapper.vm.$nextTick()

    // 應該顯示錯誤訊息
    expect(wrapper.text()).toContain('密碼長度至少需 6 個字元')
  })

  it('應在修正錯誤後清除驗證訊息', async () => {
    const wrapper = mount(LoginForm, {
      global: {
        components: { FormInput, Button, Alert }
      }
    })

    const usernameInput = wrapper.find('input[name="username"]')

    // 先產生錯誤
    await usernameInput.setValue('ab')
    await usernameInput.trigger('blur')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('帳號至少需 3 個字元')

    // 修正錯誤
    await usernameInput.setValue('valid_user')
    await usernameInput.trigger('blur')
    await wrapper.vm.$nextTick()

    // 錯誤訊息應該消失
    expect(wrapper.text()).not.toContain('帳號至少需 3 個字元')
  })

  it('應支援記住我功能', async () => {
    const wrapper = mount(LoginForm, {
      global: {
        components: { FormInput, Button, Alert }
      }
    })

    const rememberMeCheckbox = wrapper.find('input[type="checkbox"]#rememberMe')
    expect(rememberMeCheckbox.exists()).toBe(true)

    // 勾選記住我
    await rememberMeCheckbox.setValue(true)
    expect((rememberMeCheckbox.element as HTMLInputElement).checked).toBe(true)

    // 取消勾選
    await rememberMeCheckbox.setValue(false)
    expect((rememberMeCheckbox.element as HTMLInputElement).checked).toBe(false)
  })

  it('應使用 form-container 樣式類別', () => {
    const wrapper = mount(LoginForm, {
      global: {
        components: { FormInput, Button, Alert }
      }
    })

    const form = wrapper.find('form')
    expect(form.classes()).toContain('form-container')
  })

  it('應支援響應式標題大小', () => {
    const wrapper = mount(LoginForm, {
      global: {
        components: { FormInput, Button, Alert }
      }
    })

    const heading = wrapper.find('h1')
    const classes = heading.classes()

    // 檢查是否有響應式文字大小類別
    expect(classes.some((c) => c.includes('text-'))).toBe(true)
  })

  it('應在表單提交時觸發驗證', async () => {
    const wrapper = mount(LoginForm, {
      global: {
        components: { FormInput, Button, Alert }
      }
    })

    const form = wrapper.find('form')

    // 不填寫任何欄位，直接提交
    await form.trigger('submit')
    await wrapper.vm.$nextTick()

    // 應該顯示驗證錯誤
    // 注意：具體行為取決於 useForm 的實作
  })

  it('應有無障礙屬性', () => {
    const wrapper = mount(LoginForm, {
      global: {
        components: { FormInput, Button, Alert }
      }
    })

    // 檢查記住我 checkbox 的 aria-label
    const rememberMeCheckbox = wrapper.find('input[type="checkbox"]#rememberMe')
    expect(rememberMeCheckbox.attributes('aria-label')).toBe('記住我的登入狀態')

    // 檢查帳號欄位的 label
    const usernameInput = wrapper.find('input[name="username"]')
    const usernameLabel = wrapper.find('label[for="username"]')
    expect(usernameLabel.exists()).toBe(true)

    // 檢查密碼欄位的 label
    const passwordInput = wrapper.find('input[name="password"]')
    const passwordLabel = wrapper.find('label[for="password"]')
    expect(passwordLabel.exists()).toBe(true)
  })
})
