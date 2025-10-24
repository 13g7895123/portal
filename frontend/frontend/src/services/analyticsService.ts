/**
 * 分析服務
 * 記錄使用者操作和 API 請求至分析系統
 * 開發環境使用 console，正式環境傳送至後端 API
 */

interface AnalyticsEvent {
  category: string              // 事件類別（如 'auth', 'api', 'user_action'）
  action: string                // 動作名稱（如 'login_success', 'login_failure'）
  label?: string                // 可選標籤
  value?: number                // 可選數值（如回應時間）
  metadata?: Record<string, any> // 額外的中繼資料
}

class AnalyticsService {
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = import.meta.env.MODE === 'development'
  }

  /**
   * 記錄分析事件
   * @param event 分析事件物件
   */
  track(event: AnalyticsEvent): void {
    const timestamp = new Date().toISOString()
    const logData = {
      ...event,
      timestamp,
      environment: import.meta.env.MODE
    }

    if (this.isDevelopment) {
      // 開發環境：輸出至 console
      console.log('[Analytics]', logData)
    } else {
      // 正式環境：傳送至後端 API
      this.sendToBackend(logData)
    }
  }

  /**
   * 記錄登入嘗試
   */
  trackLoginAttempt(username: string): void {
    this.track({
      category: 'auth',
      action: 'login_attempt',
      label: username
    })
  }

  /**
   * 記錄登入成功
   */
  trackLoginSuccess(username: string, responseTime?: number): void {
    this.track({
      category: 'auth',
      action: 'login_success',
      label: username,
      value: responseTime
    })
  }

  /**
   * 記錄登入失敗
   */
  trackLoginFailure(username: string, errorCode?: string): void {
    this.track({
      category: 'auth',
      action: 'login_failure',
      label: username,
      metadata: { errorCode }
    })
  }

  /**
   * 記錄登出
   */
  trackLogout(username: string): void {
    this.track({
      category: 'auth',
      action: 'logout',
      label: username
    })
  }

  /**
   * 記錄 token 刷新開始
   */
  trackTokenRefreshStart(): void {
    this.track({
      category: 'auth',
      action: 'token_refresh_start'
    })
  }

  /**
   * 記錄 token 刷新成功
   */
  trackTokenRefreshSuccess(responseTime?: number): void {
    this.track({
      category: 'auth',
      action: 'token_refresh_success',
      value: responseTime
    })
  }

  /**
   * 記錄 token 刷新失敗
   */
  trackTokenRefreshFailure(errorCode?: string): void {
    this.track({
      category: 'auth',
      action: 'token_refresh_failure',
      metadata: { errorCode }
    })
  }

  /**
   * 記錄速率限制觸發
   */
  trackRateLimitTriggered(username: string, remainingTime: number): void {
    this.track({
      category: 'auth',
      action: 'login_rate_limit_triggered',
      label: username,
      value: remainingTime,
      metadata: { remainingTimeMs: remainingTime }
    })
  }

  /**
   * 記錄速率限制過期
   */
  trackRateLimitExpired(username: string): void {
    this.track({
      category: 'auth',
      action: 'login_rate_limit_expired',
      label: username
    })
  }

  /**
   * 記錄離線狀態偵測
   */
  trackOfflineDetected(): void {
    this.track({
      category: 'network',
      action: 'offline_detected'
    })
  }

  /**
   * 記錄網路恢復
   */
  trackOnlineRestored(): void {
    this.track({
      category: 'network',
      action: 'online_restored'
    })
  }

  /**
   * 記錄 API 請求
   */
  trackApiRequest(endpoint: string, method: string, responseTime?: number): void {
    this.track({
      category: 'api',
      action: 'request',
      label: `${method} ${endpoint}`,
      value: responseTime
    })
  }

  /**
   * 記錄 API 錯誤
   */
  trackApiError(endpoint: string, method: string, statusCode: number, errorMessage?: string): void {
    this.track({
      category: 'api',
      action: 'error',
      label: `${method} ${endpoint}`,
      value: statusCode,
      metadata: { errorMessage }
    })
  }

  /**
   * 記錄頁面導航
   */
  trackPageView(pageName: string, fromPage?: string): void {
    this.track({
      category: 'user_action',
      action: 'page_view',
      label: pageName,
      metadata: { fromPage }
    })
  }

  /**
   * 傳送至後端分析 API
   * @param data 分析資料
   */
  private async sendToBackend(data: any): Promise<void> {
    try {
      const apiUrl = import.meta.env.VITE_CRM_API_URL || 'http://localhost:3000'
      const analyticsUrl = `${apiUrl}/api/v1/analytics`
      
      // 使用 navigator.sendBeacon 確保在頁面關閉時也能傳送
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
        navigator.sendBeacon(analyticsUrl, blob)
      } else {
        // 降級方案：使用 fetch
        await fetch(analyticsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          keepalive: true
        })
      }
    } catch (error) {
      // 靜默失敗：分析記錄失敗不應影響使用者體驗
      console.warn('Failed to send analytics:', error)
    }
  }
}

// 匯出單例
export const analyticsService = new AnalyticsService()
export default analyticsService
