// tests/unit/utils/validators.spec.ts
// Unit 測試 - Yup schema 驗證規則

import { describe, it, expect } from 'vitest'
import { loginCredentialsSchema } from '@/utils/validators'

describe('[US3] Validators', () => {
  describe('loginCredentialsSchema', () => {
    describe('username 驗證', () => {
      it('應通過有效的帳號', async () => {
        const validData = {
          username: 'valid_user',
          password: 'password123',
          rememberMe: false
        }

        const result = await loginCredentialsSchema.validate(validData)
        expect(result.username).toBe('valid_user')
      })

      it('應拒絕空白帳號', async () => {
        const invalidData = {
          username: '',
          password: 'password123'
        }

        try {
          await loginCredentialsSchema.validate(invalidData)
          expect.fail('應該拋出驗證錯誤')
        } catch (error: any) {
          expect(error.message).toBe('帳號為必填欄位')
        }
      })

      it('應拒絕長度少於 3 字元的帳號', async () => {
        const invalidData = {
          username: 'ab',
          password: 'password123'
        }

        try {
          await loginCredentialsSchema.validate(invalidData)
          expect.fail('應該拋出驗證錯誤')
        } catch (error: any) {
          expect(error.message).toBe('帳號至少需 3 個字元')
        }
      })

      it('應拒絕長度超過 50 字元的帳號', async () => {
        const invalidData = {
          username: 'a'.repeat(51),
          password: 'password123'
        }

        try {
          await loginCredentialsSchema.validate(invalidData)
          expect.fail('應該拋出驗證錯誤')
        } catch (error: any) {
          expect(error.message).toBe('帳號最多 50 個字元')
        }
      })

      it('應自動修剪帳號前後空白', async () => {
        const dataWithSpaces = {
          username: '  user@example.com  ',
          password: 'password123'
        }

        const result = await loginCredentialsSchema.validate(dataWithSpaces)
        expect(result.username).toBe('user@example.com')
      })
    })

    describe('password 驗證', () => {
      it('應通過有效的密碼', async () => {
        const validData = {
          username: 'user@example.com',
          password: 'password123',
          rememberMe: false
        }

        const result = await loginCredentialsSchema.validate(validData)
        expect(result.password).toBe('password123')
      })

      it('應拒絕空白密碼', async () => {
        const invalidData = {
          username: 'user@example.com',
          password: ''
        }

        try {
          await loginCredentialsSchema.validate(invalidData)
          expect.fail('應該拋出驗證錯誤')
        } catch (error: any) {
          expect(error.message).toBe('密碼為必填欄位')
        }
      })

      it('應拒絕長度少於 6 字元的密碼', async () => {
        const invalidData = {
          username: 'user@example.com',
          password: '12345'
        }

        try {
          await loginCredentialsSchema.validate(invalidData)
          expect.fail('應該拋出驗證錯誤')
        } catch (error: any) {
          expect(error.message).toBe('密碼長度至少需 6 個字元')
        }
      })

      it('應拒絕長度超過 100 字元的密碼', async () => {
        const invalidData = {
          username: 'user@example.com',
          password: 'a'.repeat(101)
        }

        try {
          await loginCredentialsSchema.validate(invalidData)
          expect.fail('應該拋出驗證錯誤')
        } catch (error: any) {
          expect(error.message).toBe('密碼最多 100 個字元')
        }
      })

      it('應保留密碼中的特殊字元', async () => {
        const dataWithSpecialChars = {
          username: 'user@example.com',
          password: 'P@ssw0rd!#$%^&*()'
        }

        const result = await loginCredentialsSchema.validate(dataWithSpecialChars)
        expect(result.password).toBe('P@ssw0rd!#$%^&*()')
      })

      it('應保留密碼中的空白', async () => {
        const dataWithSpaces = {
          username: 'user@example.com',
          password: 'pass word 123'
        }

        const result = await loginCredentialsSchema.validate(dataWithSpaces)
        expect(result.password).toBe('pass word 123')
      })
    })

    describe('rememberMe 驗證', () => {
      it('應設定 rememberMe 預設值為 false', async () => {
        const data = {
          username: 'user@example.com',
          password: 'password123'
        }

        const result = await loginCredentialsSchema.validate(data)
        expect(result.rememberMe).toBe(false)
      })

      it('應接受 rememberMe 為 true', async () => {
        const data = {
          username: 'user@example.com',
          password: 'password123',
          rememberMe: true
        }

        const result = await loginCredentialsSchema.validate(data)
        expect(result.rememberMe).toBe(true)
      })

      it('應接受 rememberMe 為 false', async () => {
        const data = {
          username: 'user@example.com',
          password: 'password123',
          rememberMe: false
        }

        const result = await loginCredentialsSchema.validate(data)
        expect(result.rememberMe).toBe(false)
      })
    })

    describe('完整表單驗證', () => {
      it('應通過所有欄位都有效的表單', async () => {
        const validData = {
          username: 'user@example.com',
          password: 'ValidP@ssw0rd123',
          rememberMe: true
        }

        const result = await loginCredentialsSchema.validate(validData)
        expect(result).toEqual({
          username: 'user@example.com',
          password: 'ValidP@ssw0rd123',
          rememberMe: true
        })
      })

      it('應在多個欄位無效時回傳第一個錯誤', async () => {
        const invalidData = {
          username: 'ab',
          password: '123'
        }

        try {
          await loginCredentialsSchema.validate(invalidData)
          expect.fail('應該拋出驗證錯誤')
        } catch (error: any) {
          // Yup 會回傳第一個遇到的錯誤
          expect(error.message).toBeTruthy()
        }
      })
    })
  })
})
