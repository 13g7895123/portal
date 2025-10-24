/**
 * UI 狀態 Store (Pinia)
 * 管理 UI 相關的全域狀態，如離線狀態、載入指示器等
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { OfflineState } from '@/types/auth'

export const useUiStore = defineStore('ui', () => {
  // 狀態
  const isOffline = ref<boolean>(false)
  const lastOnlineCheck = ref<number>(Date.now())

  // Getters（computed）
  const offlineState = computed<OfflineState>(() => ({
    isOffline: isOffline.value,
    lastOnlineCheck: lastOnlineCheck.value
  }))

  // Actions
  
  /**
   * 設定離線狀態
   * @param offline 是否離線
   */
  function setOffline(offline: boolean): void {
    isOffline.value = offline
    lastOnlineCheck.value = Date.now()
  }

  /**
   * 更新最後上線檢查時間
   */
  function updateLastOnlineCheck(): void {
    lastOnlineCheck.value = Date.now()
  }

  return {
    // 狀態
    isOffline,
    lastOnlineCheck,

    // Getters
    offlineState,

    // Actions
    setOffline,
    updateLastOnlineCheck
  }
})
