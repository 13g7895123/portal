<template>
  <div class="page-container safe-top safe-bottom">
    <div class="w-full max-w-md xs:max-w-[95%] sm:max-w-md">
      <!-- Loading state during authentication check -->
      <div v-if="isCheckingAuth" class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">檢查登入狀態...</p>
      </div>

      <!-- Login form -->
      <LoginForm v-else />

      <!-- Error message for authentication check failures -->
      <div v-if="authCheckError" class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p class="text-sm text-yellow-800">
          無法驗證登入狀態，請重新登入
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginForm from '@/components/LoginForm.vue'

const router = useRouter()
const authStore = useAuthStore()

const isCheckingAuth = ref(false)
const authCheckError = ref(false)

/**
 * 檢查現有的認證狀態
 * - 若有 access token，嘗試驗證並取得使用者資訊
 * - 若已認證，直接導向 app-center
 * - 若驗證失敗，清除認證狀態並顯示登入表單
 */
onMounted(async () => {
  try {
    isCheckingAuth.value = true
    authCheckError.value = false

    // 檢查 sessionStorage 中是否有 token
    const accessToken = sessionStorage.getItem('access_token')

    if (accessToken) {
      // 嘗試取得使用者資訊以驗證 token 有效性
      try {
        await authStore.fetchCurrentUser()

        // Token 有效，使用者已認證
        if (authStore.isLoggedIn) {
          await router.push({ name: 'app-center' })
        }
      } catch (error) {
        // Token 無效或過期，清除並允許使用者重新登入
        console.warn('Token 驗證失敗，需要重新登入:', error)
        authStore.clearAuth()
        authCheckError.value = true
      }
    }
    // 沒有 token，顯示登入表單（預設行為）
  } catch (error) {
    console.error('認證狀態檢查失敗:', error)
    authCheckError.value = true
    // 確保清除任何殘留的認證狀態
    authStore.clearAuth()
  } finally {
    isCheckingAuth.value = false
  }
})
</script>
