<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isDropdownOpen = ref(false)
const dropdownRef = ref(null)

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const handleLogout = () => {
  localStorage.removeItem('token')
  isDropdownOpen.value = false
  router.push('/login')
}

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<template>
  <nav class="navbar">
    <div class="nav-content">
      <div class="logo-box" @click="router.push('/')">
        <span class="logo-text">PORTAL</span>
        <span class="logo-accent">X</span>
      </div>

      <div class="nav-links">
        <router-link to="/admin" class="nav-btn" active-class="active">
          <span class="btn-icon">⚡</span>
          SYSTEM_CONFIG
        </router-link>

        <div class="user-container" ref="dropdownRef">
          <div class="user-profile" @click="toggleDropdown">
            <div class="profile-glow"></div>
            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Admin" alt="User" />
            <div class="status-dot"></div>
          </div>
          
          <transition name="dropdown">
            <div v-if="isDropdownOpen" class="dropdown-menu glass-panel">
              <div class="dropdown-header">OPERATOR_ID: ADMIN</div>
              <div class="dropdown-divider"></div>
              <button class="logout-btn" @click="handleLogout">
                <span class="icon">⏻</span> 
                TERMINATE_SESSION
              </button>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 70px;
    z-index: 1000;
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid rgba(56, 189, 248, 0.15);
    display: flex;
    align-items: center;
}

.nav-content {
    width: 100%;
    padding: 0 3rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo-box {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    cursor: pointer;
    font-weight: 900;
    font-size: 1.4rem;
    letter-spacing: 3px;
}

.logo-text { color: #f1f5f9; }
.logo-accent {
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.1);
    padding: 2px 8px;
    border: 1px solid rgba(56, 189, 248, 0.3);
    border-top-right-radius: 8px;
    border-bottom-left-radius: 8px;
}

.nav-links {
    display: flex;
    align-items: center;
    gap: 2.5rem;
}

.nav-btn {
    text-decoration: none;
    color: #94a3b8;
    font-size: 0.75rem;
    font-weight: 800;
    letter-spacing: 1.5px;
    padding: 0.6rem 1.2rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 0.8rem;
}

.nav-btn.active {
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.1);
    border-color: rgba(56, 189, 248, 0.3);
}

.nav-btn:hover:not(.active) {
    border-color: rgba(255, 255, 255, 0.2);
    color: #f1f5f9;
}

.user-container {
    position: relative;
}

.user-profile {
    position: relative;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.user-profile img {
    width: 100%;
    height: 100%;
    border-radius: 10px;
    background: #0f172a;
    border: 1px solid rgba(56, 189, 248, 0.3);
    z-index: 1;
}

.profile-glow {
    position: absolute;
    inset: -5px;
    background: #38bdf8;
    filter: blur(15px);
    opacity: 0.2;
    border-radius: 50%;
}

.status-dot {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 10px;
    height: 10px;
    background: #22c55e;
    border: 2px solid #0f172a;
    border-radius: 50%;
    z-index: 2;
    box-shadow: 0 0 10px #22c55e;
}

.dropdown-menu {
    position: absolute;
    top: calc(100% + 15px);
    right: 0;
    width: 240px;
    padding: 1rem;
    border-radius: 12px;
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(56, 189, 248, 0.2);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
}

.dropdown-header {
    font-size: 0.65rem;
    font-weight: 800;
    color: #64748b;
    letter-spacing: 2px;
    padding: 0.5rem;
}

.dropdown-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.05);
    margin: 0.8rem 0;
}

.logout-btn {
    width: 100%;
    padding: 0.8rem;
    background: transparent;
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #f87171;
    font-weight: 900;
    font-size: 0.75rem;
    letter-spacing: 1.5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    transition: all 0.3s;
}

.logout-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: #f87171;
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.2);
    transform: translateY(-2px);
}

/* Transitions */
.dropdown-enter-active, .dropdown-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.dropdown-enter-from, .dropdown-leave-to {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
}
</style>


