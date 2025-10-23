// tests/unit/composables/useForm.spec.ts
// Unit 測試 - useForm composable

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { useForm } from '@/composables/useForm'
import { loginCredentialsSchema } from '@/utils/validators'

describe('[US3] useForm', () => {
  const TestComponent = defineComponent({
    template: `
      <form @submit.prevent="onSubmit">
        <input
          v-model="values.username"
          name="username"
          @blur="validateField('username')"
        />
        <span v-if="errors.username">{{ errors.username }}</span>

        <input
          v-model="values.password"
          name="password"
          @blur="validateField('password')"
        />
        <span v-if="errors.password">{{ errors.password }}</span>

        <button type="submit" :disabled="!isValid">Submit</button>
      </form>
    `,
    setup() {
      const { values, errors, isValid, validateField, validateForm } = useForm(
        loginCredentialsSchema,
        {
          username: '',
          password: '',
          rememberMe: false
        }
      )

      const onSubmit = () => {
        validateForm()
      }

      return {
        values,
        errors,
        isValid,
        validateField,
        onSubmit
      }
    }
  })

  it('應初始化表單值', () => {
    const wrapper = mount(TestComponent)

    const usernameInput = wrapper.find('input[name="username"]')
    const passwordInput = wrapper.find('input[name="password"]')

    expect((usernameInput.element as HTMLInputElement).value).toBe('')
    expect((passwordInput.element as HTMLInputElement).value).toBe('')
  })

  it('應在欄位失焦時觸發驗證', async () => {
    const wrapper = mount(TestComponent)

    // 找到帳號輸入框
    const usernameInput = wrapper.find('input[name="username"]')

    // 輸入無效值
    await usernameInput.setValue('ab')
    await usernameInput.trigger('blur')

    // 等待驗證
    await wrapper.vm.$nextTick()

    // 檢查錯誤訊息
    expect(wrapper.text()).toContain('帳號至少需 3 個字元')
  })

  it('應在欄位值改變時更新 values', async () => {
    const wrapper = mount(TestComponent)

    const usernameInput = wrapper.find('input[name="username"]')
    await usernameInput.setValue('test_user')

    expect(wrapper.vm.values.username).toBe('test_user')
  })

  it('應在所有欄位有效時設定 isValid 為 true', async () => {
    const wrapper = mount(TestComponent)

    // 輸入有效值
    await wrapper.find('input[name="username"]').setValue('user@example.com')
    await wrapper.find('input[name="password"]').setValue('password123')

    // 觸發驗證
    await wrapper.find('input[name="username"]').trigger('blur')
    await wrapper.find('input[name="password"]').trigger('blur')

    await wrapper.vm.$nextTick()

    // 按鈕應該啟用
    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.attributes('disabled')).toBeUndefined()
  })

  it('應在欄位無效時設定 isValid 為 false', async () => {
    const wrapper = mount(TestComponent)

    // 輸入無效值
    await wrapper.find('input[name="username"]').setValue('ab')
    await wrapper.find('input[name="username"]').trigger('blur')

    await wrapper.vm.$nextTick()

    // 按鈕應該禁用
    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.attributes('disabled')).toBeDefined()
  })

  it('應在修正錯誤後清除錯誤訊息', async () => {
    const wrapper = mount(TestComponent)

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

  it('應支援多個欄位同時驗證', async () => {
    const wrapper = mount(TestComponent)

    // 兩個欄位都輸入無效值
    await wrapper.find('input[name="username"]').setValue('ab')
    await wrapper.find('input[name="password"]').setValue('123')

    await wrapper.find('input[name="username"]').trigger('blur')
    await wrapper.find('input[name="password"]').trigger('blur')

    await wrapper.vm.$nextTick()

    // 應該同時顯示兩個錯誤
    expect(wrapper.text()).toContain('帳號至少需 3 個字元')
    expect(wrapper.text()).toContain('密碼長度至少需 6 個字元')
  })

  it('應在表單提交時驗證所有欄位', async () => {
    const wrapper = mount(TestComponent)

    // 不填寫任何欄位，直接提交
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    // 應該顯示所有必填欄位的錯誤
    expect(wrapper.text()).toContain('帳號為必填欄位')
  })
})
