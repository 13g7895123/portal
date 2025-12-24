<script setup>
import { ref } from 'vue'

defineProps({
  title: String,
  icon: String,
  url: String,
  description: String
})

const cardRef = ref(null)
const tiltStyle = ref({})

const handleMouseMove = (e) => {
    if (!cardRef.value) return
    const rect = cardRef.value.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    const rotateX = ((y - centerY) / centerY) * -10 // Max -10 to 10 deg
    const rotateY = ((x - centerX) / centerX) * 10 // Max -10 to 10 deg

    tiltStyle.value = {
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
    }
}

const handleMouseLeave = () => {
    tiltStyle.value = {
        transform: 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)',
    }
}
</script>

<template>
  <a 
    :href="url" 
    class="app-card" 
    ref="cardRef"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    :style="tiltStyle"
  >
    <!-- Tech Corners -->
    <div class="corner t-l"></div>
    <div class="corner t-r"></div>
    <div class="corner b-l"></div>
    <div class="corner b-r"></div>

    <div class="card-inner">
      <div class="scanline"></div>
      
      <div class="card-header">
        <div class="pulse-ring"></div>
        <div class="icon-box">
          <img :src="icon" :alt="title" />
        </div>
      </div>

      <div class="card-body">
        <h3>{{ title }}</h3>
        <p v-if="description">{{ description }}</p>
      </div>

      <div class="card-footer">
        <div class="status-box">
          <span class="dot"></span>
          READY
        </div>
        <div class="tech-tag">ID: {{(title || '').substring(0,3).toUpperCase()}}</div>
      </div>
    </div>
  </a>
</template>


<style scoped>
.app-card {
  display: block;
  text-decoration: none;
  color: #f1f5f9;
  position: relative;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(56, 189, 248, 0.1);
  padding: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: visible;
}

.card-inner {
  padding: 1.5rem;
  background: rgba(2, 6, 23, 0.6);
  position: relative;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.scanline {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 2px;
  background: rgba(14, 165, 233, 0.1);
  animation: scan-vertical 4s linear infinite;
  z-index: 1;
}

@keyframes scan-vertical {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(400%); }
}

/* Tech Corners */
.corner {
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: #38bdf8;
  border-style: solid;
  z-index: 10;
}
.t-l { top: -2px; left: -2px; border-width: 2px 0 0 2px; }
.t-r { top: -2px; right: -2px; border-width: 2px 2px 0 0; }
.b-l { bottom: -2px; left: -2px; border-width: 0 0 2px 2px; }
.b-r { bottom: -2px; right: -2px; border-width: 0 2px 2px 0; }

.app-card:hover {
  transform: translateY(-8px) scale(1.02);
  border-color: rgba(56, 189, 248, 0.4);
  box-shadow: 0 0 30px rgba(14, 165, 233, 0.2);
}

.card-header {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.icon-box {
  width: 60px;
  height: 60px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 12px;
  padding: 8px;
  z-index: 2;
}

.icon-box img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.pulse-ring {
  position: absolute;
  width: 70px;
  height: 70px;
  border: 1px solid #0ea5e9;
  border-radius: 14px;
  animation: card-pulse 3s infinite;
  opacity: 0.3;
}

@keyframes card-pulse {
  0% { transform: scale(1); opacity: 0.3; }
  100% { transform: scale(1.3); opacity: 0; }
}

.card-body {
  flex: 1;
}

.card-body h3 {
  font-size: 1.4rem; /* Increased from 1.1rem */
  font-weight: 800;
  letter-spacing: 1.5px;
  color: #f1f5f9;
  margin: 0 0 0.8rem 0;
  text-transform: uppercase;
}

.card-body p {
  font-size: 1rem; /* Increased from 0.8rem */
  color: #94a3b8;
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9rem; /* Increased from 0.65rem */
}

.status-box {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #22c55e;
  font-weight: 800;
}

.dot {
  width: 10px; /* Increased from 6px */
  height: 10px;
  background: #22c55e;
  border-radius: 50%;
  box-shadow: 0 0 10px #22c55e;
}

.tech-tag {
  color: #64748b;
  font-weight: 700;
}
</style>

