<template>
  <div class="page-container safe-top safe-bottom">
    <div class="w-full max-w-4xl mx-auto">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow-sm p-6 sm:p-8 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              歡迎來到應用程式中心
            </h1>
            <p class="text-sm sm:text-base text-gray-600">
              您已成功登入系統
            </p>
          </div>
          <div class="flex items-center space-x-4">
            <button
              @click="handleLogout"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              :disabled="isLoggingOut"
            >
              {{ isLoggingOut ? '登出中...' : '登出' }}
            </button>
          </div>
        </div>
      </div>

      <!-- User Info Card -->
      <div class="bg-white rounded-lg shadow-sm p-6 sm:p-8 mb-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">使用者資訊</h2>

        <div v-if="user" class="space-y-3">
          <div class="flex items-center">
            <span class="text-sm font-medium text-gray-500 w-24">使用者名稱：</span>
            <span class="text-sm text-gray-900">{{ user.username }}</span>
          </div>

          <div class="flex items-center">
            <span class="text-sm font-medium text-gray-500 w-24">電子郵件：</span>
            <span class="text-sm text-gray-900">{{ user.email }}</span>
          </div>

          <div v-if="user.fullName" class="flex items-center">
            <span class="text-sm font-medium text-gray-500 w-24">姓名：</span>
            <span class="text-sm text-gray-900">{{ user.fullName }}</span>
          </div>

          <div v-if="user.department" class="flex items-center">
            <span class="text-sm font-medium text-gray-500 w-24">部門：</span>
            <span class="text-sm text-gray-900">{{ user.department }}</span>
          </div>

          <div v-if="user.region" class="flex items-center">
            <span class="text-sm font-medium text-gray-500 w-24">區域：</span>
            <span class="text-sm text-gray-900">{{ user.region }}</span>
          </div>

          <div class="flex items-center">
            <span class="text-sm font-medium text-gray-500 w-24">帳號狀態：</span>
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
            >
              {{ user.isActive ? '啟用' : '停用' }}
            </span>
          </div>

          <div v-if="user.lastLoginAt" class="flex items-center">
            <span class="text-sm font-medium text-gray-500 w-24">上次登入：</span>
            <span class="text-sm text-gray-900">{{ formatDateTime(user.lastLoginAt) }}</span>
          </div>
        </div>

        <div v-else class="text-sm text-gray-500">
          載入使用者資訊中...
        </div>
      </div>

      <!-- Quick Links -->
      <div class="bg-white rounded-lg shadow-sm p-6 sm:p-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">快速連結</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <router-link
            to="/profile"
            class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-500 transition-colors"
          >
            <div class="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-medium text-gray-900">個人資料</h3>
              <p class="text-xs text-gray-500">查看和編輯個人資訊</p>
            </div>
          </router-link>

          <div class="flex items-center p-4 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed">
            <div class="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-medium text-gray-400">系統設定</h3>
              <p class="text-xs text-gray-400">即將推出</p>
            </div>
          </div>

          <div class="flex items-center p-4 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed">
            <div class="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-medium text-gray-400">文件管理</h3>
              <p class="text-xs text-gray-400">即將推出</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { user, logout } = useAuth()
const isLoggingOut = ref(false)

/**
 * 格式化日期時間
 */
const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  } catch (error) {
    return dateString
  }
}

/**
 * 處理登出
 */
const handleLogout = async () => {
  if (isLoggingOut.value) return

  try {
    isLoggingOut.value = true
    await logout()
  } catch (error) {
    console.error('登出失敗:', error)
  } finally {
    isLoggingOut.value = false
  }
}
</script>
