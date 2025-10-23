// tests/unit/components/FormInput.spec.ts
// Unit 測試 - FormInput 元件

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FormInput from '@/components/FormInput.vue'

describe('FormInput Component', () => {
  it('應正確渲染基本輸入框', () => {
    const wrapper = mount(FormInput, {
      props: {
        id: 'test-input',
        name: 'test',
        label: '測試欄位',
        modelValue: ''
      }
    })

    // 檢查 label
    const label = wrapper.find('label')
    expect(label.exists()).toBe(true)
    expect(label.text()).toContain('測試欄位')

    // 檢查 input
    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('id')).toBe('test-input')
    expect(input.attributes('name')).toBe('test')
  })

  it('應顯示必填標記', () => {
    const wrapper = mount(FormInput, {
      props: {
        id: 'test-input',
        name: 'test',
        label: '測試欄位',
        required: true,
        modelValue: ''
      }
    })

    // 應該有紅色星號
    expect(wrapper.text()).toContain('*')
    const requiredMark = wrapper.find('.text-red-500')
    expect(requiredMark.exists()).toBe(true)
  })

  it('應支援 v-model 雙向綁定', async () => {
    const wrapper = mount(FormInput, {
      props: {
        id: 'test-input',
        name: 'test',
        modelValue: '',
        'onUpdate:modelValue': (e: string) => wrapper.setProps({ modelValue: e })
      }
    })

    const input = wrapper.find('input')

    // 輸入文字
    await input.setValue('測試文字')

    // 檢查是否觸發了 update:modelValue 事件
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['測試文字'])
  })

  it('應顯示錯誤訊息', () => {
    const wrapper = mount(FormInput, {
      props: {
        id: 'test-input',
        name: 'test',
        label: '測試欄位',
        error: '此欄位為必填',
        modelValue: ''
      }
    })

    // 檢查錯誤訊息
    const errorMessage = wrapper.find('p[role="alert"]')
    expect(errorMessage.exists()).toBe(true)
    expect(errorMessage.text()).toBe('此欄位為必填')
    expect(errorMessage.classes()).toContain('text-red-600')

    // 檢查輸入框樣式
    const input = wrapper.find('input')
    expect(input.classes()).toContain('border-red-500')
  })

  it('應設定 aria-invalid 和 aria-describedby', () => {
    const wrapper = mount(FormInput, {
      props: {
        id: 'test-input',
        name: 'test',
        error: '此欄位為必填',
        modelValue: ''
      }
    })

    const input = wrapper.find('input')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe('test-input-error')
  })

  it('應支援密碼類型輸入', () => {
    const wrapper = mount(FormInput, {
      props: {
        id: 'password-input',
        name: 'password',
        type: 'password',
        modelValue: ''
      }
    })

    const input = wrapper.find('input')
    expect(input.attributes('type')).toBe('password')
  })

  it('應顯示密碼切換按鈕', () => {
    const wrapper = mount(FormInput, {
      props: {
        id: 'password-input',
        name: 'password',
        type: 'password',
        modelValue: ''
      }
    })

    const toggleButton = wrapper.find('button[type="button"]')
    expect(toggleButton.exists()).toBe(true)
  })

  it('應支援密碼顯示/隱藏切換', async () => {
    const wrapper = mount(FormInput, {
      props: {
        id: 'password-input',
        name: 'password',
        type: 'password',
        modelValue: 'secret123'
      }
    })

    const input = wrapper.find('input')
    const toggleButton = wrapper.find('button[type="button"]')

    // 初始應該是 password 類型
    expect(input.attributes('type')).toBe('password')

    // 點擊切換按鈕
    await toggleButton.trigger('click')
    await wrapper.vm.$nextTick()

    // 應該變成 text 類型
    expect(input.attributes('type')).toBe('text')

    // 再次點擊
    await toggleButton.trigger('click')
    await wrapper.vm.$nextTick()

    // 應該變回 password 類型
    expect(input.attributes('type')).toBe('password')
  })

  it('應設定密碼切換按鈕的 aria-label', () => {
    const wrapper = mount(FormInput, {
      props: {
        id: 'password-input',
        name: 'password',
        type: 'password',
        modelValue: ''
      }
    })

    const toggleButton = wrapper.find('button[type="button"]')
    expect(toggleButton.attributes('aria-label')).toBeTruthy()
    expect(toggleButton.attributes('aria-label')).toContain('密碼')
  })

  it('應在禁用時套用正確樣式', () => {
    const wrapper = mount(FormInput, {
      props: {
        id: 'test-input',
        name: 'test',
        disabled: true,
        modelValue: ''
      }
    })

    const input = wrapper.find('input')
    expect(input.attributes('disabled')).toBeDefined()
    expect(input.classes()).toContain('bg-gray-100')
    expect(input.classes()).toContain('cursor-not-allowed')
  })

  it('應顯示 placeholder', () => {
    const wrapper = mount(FormInput, {
      props: {
        id: 'test-input',
        name: 'test',
        placeholder: '請輸入內容',
        modelValue: ''
      }
    })

    const input = wrapper.find('input')
    expect(input.attributes('placeholder')).toBe('請輸入內容')
  })

  it('應顯示提示訊息（無錯誤時）', () => {
    const wrapper = mount(FormInput, {
      props: {
        id: 'test-input',
        name: 'test',
        hint: '這是提示訊息',
        modelValue: ''
      }
    })

    const hintMessage = wrapper.find('.text-gray-500')
    expect(hintMessage.exists()).toBe(true)
    expect(hintMessage.text()).toBe('這是提示訊息')
  })

  it('應在有錯誤時隱藏提示訊息', () => {
    const wrapper = mount(FormInput, {
      props: {
        id: 'test-input',
        name: 'test',
        hint: '這是提示訊息',
        error: '此欄位為必填',
        modelValue: ''
      }
    })

    // 錯誤訊息應該顯示
    const errorMessage = wrapper.find('p[role="alert"]')
    expect(errorMessage.exists()).toBe(true)

    // 提示訊息不應該顯示
    const hintMessage = wrapper.find('.text-gray-500')
    expect(hintMessage.exists()).toBe(false)
  })

  it('應在失焦時觸發 blur 事件', async () => {
    const wrapper = mount(FormInput, {
      props: {
        id: 'test-input',
        name: 'test',
        modelValue: ''
      }
    })

    const input = wrapper.find('input')
    await input.trigger('blur')

    expect(wrapper.emitted('blur')).toBeTruthy()
  })

  it('應支援不同的輸入類型', async () => {
    const types = ['text', 'email', 'number'] as const

    for (const type of types) {
      const wrapper = mount(FormInput, {
        props: {
          id: 'test-input',
          name: 'test',
          type,
          modelValue: ''
        }
      })

      const input = wrapper.find('input')
      expect(input.attributes('type')).toBe(type)
    }
  })

  it('應有 focus 狀態樣式', () => {
    const wrapper = mount(FormInput, {
      props: {
        id: 'test-input',
        name: 'test',
        modelValue: ''
      }
    })

    const input = wrapper.find('input')
    const classes = input.classes().join(' ')

    // 檢查是否包含 focus 相關類別
    expect(classes).toContain('focus:outline-none')
    expect(classes).toContain('focus:ring-2')
  })

  it('應設定正確的 aria-label', () => {
    const wrapper = mount(FormInput, {
      props: {
        id: 'test-input',
        name: 'test',
        label: '測試欄位',
        modelValue: ''
      }
    })

    const input = wrapper.find('input')
    expect(input.attributes('aria-label')).toBe('測試欄位')
  })

  it('應在無 label 時使用 placeholder 作為 aria-label', () => {
    const wrapper = mount(FormInput, {
      props: {
        id: 'test-input',
        name: 'test',
        placeholder: '請輸入內容',
        modelValue: ''
      }
    })

    const input = wrapper.find('input')
    expect(input.attributes('aria-label')).toBe('請輸入內容')
  })
})
