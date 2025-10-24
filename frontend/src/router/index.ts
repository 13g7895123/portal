// router/index.ts
// Vue Router 配置 - Enhanced for CRM API Integration

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginPage.vue'),
      meta: {
        requiresAuth: false,
        title: '登入 - SaaS 登入系統',
      },
    },
    {
      path: '/app-center',
      name: 'app-center',
      component: () => import('@/views/AppCenterPage.vue'),
      meta: {
        requiresAuth: true,
        title: '應用程式中心 - SaaS 登入系統',
      },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardPage.vue'),
      meta: {
        requiresAuth: true,
        title: '會員頁面 - SaaS 登入系統',
      },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfilePage.vue'),
      meta: {
        requiresAuth: true,
        title: '個人資料 - SaaS 登入系統',
      },
    },
    {
      path: '/',
      redirect: '/login',
    },
  ],
})

/**
 * Navigation guard - Phase 3 Implementation
 *
 * 檢查路由是否需要認證，並進行相應的重定向
 */
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  // 檢查 sessionStorage 中是否有 access token
  const hasToken = !!sessionStorage.getItem('access_token')

  // 設定頁面標題
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  // 訪問需要認證的頁面
  if (requiresAuth && !hasToken) {
    // 沒有 token，重定向到登入頁
    next({ name: 'login' })
  }
  // 已登入用戶訪問登入頁，重定向到 app-center
  else if (to.name === 'login' && hasToken && authStore.isAuthenticated) {
    next({ name: 'app-center' })
  }
  // 其他情況正常通過
  else {
    next()
  }
})

export default router
