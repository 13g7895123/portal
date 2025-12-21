<script setup>
import Navbar from './components/Navbar.vue'
import { onMounted } from 'vue'

// Global mouse tracking
const handleMouseMove = (e) => {
  // Update global mouse position for background
  document.documentElement.style.setProperty("--mouse-x", `${e.clientX}px`);
  document.documentElement.style.setProperty("--mouse-y", `${e.clientY}px`);

  // Update card-relative positions (if any exist)
  const cards = document.getElementsByClassName("app-card");
  for (const card of cards) {
    const rect = card.getBoundingClientRect(),
      x = e.clientX - rect.left,
      y = e.clientY - rect.top;

    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  }
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove);
})
</script>

<template>
  <Navbar />

  <main class="main-container">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </main>
</template>

<style scoped>
.main-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  margin-top: 60px;
  /* Navbar height */
  position: relative;
  z-index: 1;
}

/* Global Spotlight background effect */
.main-container::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(800px circle at var(--mouse-x) var(--mouse-y),
      rgba(255, 255, 255, 0.03),
      transparent 40%);
  z-index: -1;
  pointer-events: none;
}

/* Router Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
