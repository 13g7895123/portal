<template>
  <div class="page-container safe-top safe-bottom">
    <div class="w-full max-w-md xs:max-w-[95%] sm:max-w-md">
      <LoginForm />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginForm from '@/components/LoginForm.vue'

const router = useRouter()
const authStore = useAuthStore()

// 若已登入則直接導向 dashboard
onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  }
})
</script>
