<script setup>
import Navbar from './components/Navbar.vue'
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref(null)
let animationId = null
const particles = []

// Global mouse tracking
const handleMouseMove = (e) => {
  document.documentElement.style.setProperty("--mouse-x", `${e.clientX}px`);
  document.documentElement.style.setProperty("--mouse-y", `${e.clientY}px`);
}

const initParticles = () => {
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width
            this.y = Math.random() * canvas.height
            this.size = Math.random() * 1.5 + 0.5
            this.speedX = Math.random() * 0.5 - 0.25
            this.speedY = Math.random() * 0.5 - 0.25
            this.opacity = Math.random() * 0.3 + 0.1
        }
        update() {
            this.x += this.speedX
            this.y += this.speedY
            if (this.x > canvas.width) this.x = 0
            else if (this.x < 0) this.x = canvas.width
            if (this.y > canvas.height) this.y = 0
            else if (this.y < 0) this.y = canvas.height
        }
        draw() {
            ctx.fillStyle = `rgba(56, 189, 248, ${this.opacity})`
            ctx.beginPath()
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
            ctx.fill()
        }
    }

    for (let i = 0; i < 60; i++) particles.push(new Particle())

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        particles.forEach(p => {
            p.update()
            p.draw()
        })
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                const dx = particles[a].x - particles[b].x
                const dy = particles[a].y - particles[b].y
                const distance = Math.sqrt(dx * dx + dy * dy)
                if (distance < 120) {
                    ctx.strokeStyle = `rgba(56, 189, 248, ${0.05 * (1 - distance/120)})`
                    ctx.lineWidth = 0.5
                    ctx.beginPath()
                    ctx.moveTo(particles[a].x, particles[a].y)
                    ctx.lineTo(particles[b].x, particles[b].y)
                    ctx.stroke()
                }
            }
        }
        animationId = requestAnimationFrame(animate)
    }
    animate()
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove);
  initParticles()
  window.addEventListener('resize', () => {
      if (canvasRef.value) {
          canvasRef.value.width = window.innerWidth
          canvasRef.value.height = window.innerHeight
      }
  })
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
  cancelAnimationFrame(animationId)
})

// Notification System
const notifications = ref([])

const addNotification = (message, type = 'info', duration = 4000) => {
    const id = Date.now()
    notifications.value.push({ id, message, type })
    setTimeout(() => {
        notifications.value = notifications.value.filter(n => n.id !== id)
    }, duration)
}

// Expose to window for easy access from any view
onMounted(() => {
    window.sysNotify = addNotification
})
</script>


<template>
  <div class="app-wrapper">
    <!-- Global High-Tech Background -->
    <div class="background-effects">
      <canvas ref="canvasRef" class="particle-canvas"></canvas>
      <div class="grid-overlay"></div>
      <div class="glow-orb orb-1"></div>
      <div class="glow-orb orb-2"></div>
      <div class="scan-line"></div>
    </div>

    <Navbar v-if="$route.name !== 'login'" />

    <main :class="['main-container', { 'full-page': $route.name === 'login' }]">

    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </main>
    <transition-group name="notif" tag="div" class="notification-container">
      <div v-for="n in notifications" :key="n.id" :class="['sys-notification', n.type]">
        <div class="notif-header">
           <span class="notif-badge">SYS_MSG</span>
           <span class="notif-status">{{ n.type.toUpperCase() }}</span>
        </div>
        <div class="notif-content">
          <span class="prompt">></span> {{ n.message }}
        </div>
        <div class="notif-decor t-l"></div>
        <div class="notif-decor b-r"></div>
        <div class="notif-scan"></div>
      </div>
    </transition-group>
  </div>
</template>


<style scoped>
.app-wrapper {
  background-color: #020617;
  color: #e2e8f0;
  min-height: 100vh;
  width: 100vw;
  overflow-x: hidden;
  position: relative;
}

.main-container {
  flex: 1;
  display: flex;
  justify-content: center; /* Center content blocks */
  padding: 3rem;
  margin-top: 70px;
  position: relative;
  z-index: 10;
  width: 100%;
}

.main-container.full-page {
  margin-top: 0;
  padding: 0;
  height: 100vh;
}

/* Background Effects */
.background-effects {
    position: fixed;
    inset: 0;
    overflow: hidden;
    z-index: 0;
    pointer-events: none;
}

.particle-canvas {
    position: absolute;
    inset: 0;
    z-index: 1;
}

.grid-overlay {
    position: absolute;
    inset: 0;
    background-image: 
        linear-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(56, 189, 248, 0.05) 1px, transparent 1px);
    background-size: 50px 50px;
    mask-image: radial-gradient(circle at var(--mouse-x) var(--mouse-y), black, transparent 60%);
    z-index: 2;
}

.glow-orb {
    position: absolute;
    width: 800px;
    height: 800px;
    border-radius: 50%;
    filter: blur(150px);
    opacity: 0.1;
    z-index: 0;
    animation: move-orb 30s infinite alternate ease-in-out;
}

.orb-1 {
    background: #0ea5e9;
    top: -200px;
    right: -100px;
}

.orb-2 {
    background: #4f46e5;
    bottom: -200px;
    left: -200px;
    animation-delay: -15s;
}

@keyframes move-orb {
    from { transform: translate(0, 0) scale(1); }
    to { transform: translate(-100px, 100px) scale(1.1); }
}

.scan-line {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, 
        transparent 50%, 
        rgba(14, 165, 233, 0.03) 50%, 
        transparent 51%);
    background-size: 100% 4px;
    z-index: 3;
    pointer-events: none;
    animation: scan 15s linear infinite;
}

@keyframes scan {
    from { background-position-y: 0; }
    to { background-position-y: 100px; }
}

/* Notification Styling */
.notification-container {
    position: fixed;
    top: 90px;
    right: 30px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 15px;
    pointer-events: none;
}

.sys-notification {
    min-width: 320px;
    max-width: 450px;
    background: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(15px);
    border: 1px solid rgba(56, 189, 248, 0.2);
    padding: 1.2rem 1.8rem;
    position: relative;
    overflow: hidden;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
    pointer-events: auto;
}

.sys-notification.success { border-left: 4px solid #22c55e; }
.sys-notification.error { border-left: 4px solid #ef4444; }
.sys-notification.info { border-left: 4px solid #0ea5e9; }

.notif-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.8rem;
}

.notif-badge {
    font-size: 0.6rem;
    font-weight: 900;
    color: #64748b;
    letter-spacing: 2px;
}

.notif-status {
    font-size: 0.6rem;
    font-weight: 900;
    letter-spacing: 1.5px;
}

.success .notif-status { color: #22c55e; }
.error .notif-status { color: #ef4444; }
.info .notif-status { color: #38bdf8; }

.notif-content {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.85rem;
    color: #f1f5f9;
    line-height: 1.5;
}

.prompt { color: #38bdf8; margin-right: 8px; font-weight: 900; }

.notif-decor {
    position: absolute;
    width: 10px;
    height: 10px;
    border-color: rgba(56, 189, 248, 0.3);
    border-style: solid;
}
.notif-decor.t-l { top: 0; left: 0; border-width: 2px 0 0 2px; }
.notif-decor.b-r { bottom: 0; right: 0; border-width: 0 2px 2px 0; }

.notif-scan {
    position: absolute;
    inset: 0;
    background: linear-gradient(transparent, rgba(56, 189, 248, 0.03), transparent);
    height: 30%;
    animation: notif-scan-move 3s linear infinite;
    pointer-events: none;
}

@keyframes notif-scan-move {
    from { transform: translateY(-100%); }
    to { transform: translateY(400%); }
}

/* Notif Transitions */
.notif-enter-active {
    animation: notif-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}
.notif-leave-active {
    animation: notif-out 0.3s ease forwards;
}

@keyframes notif-in {
    from { opacity: 0; transform: translateX(50px) scale(0.9); }
    to { opacity: 1; transform: translateX(0) scale(1); }
}
@keyframes notif-out {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(100px); }
}

/* Existing Fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

