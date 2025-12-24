<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {

    loading.value = true
    error.value = ''
    
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username.value,
                password: password.value
            })
        })

        if (response.ok) {
            const data = await response.json()
            localStorage.setItem('token', data.access_token)
            router.push('/')
        } else {

            const data = await response.json()
            error.value = data.detail || 'Access Denied: Invalid Credentials'
        }
    } catch (e) {
        error.value = 'System Error: Connection Failed'
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="login-page">
        <div class="content-wrapper">

            <div class="login-card glass-panel">
                <div class="card-header">
                    <div class="system-icon">
                        <div class="pulse-ring"></div>
                        <span class="icon">🔒</span>
                    </div>
                    <h1>ACCESS CONTROL</h1>
                    <p class="subtitle">Enter credentials to proceed to Secure Portal</p>
                </div>

                <form @submit.prevent="handleLogin" class="login-form">
                    <div class="input-group">
                        <label>Personnel ID</label>
                        <div class="input-wrapper">
                            <input v-model="username" type="text" required placeholder="USERNAME">
                            <div class="corner t-l"></div>
                            <div class="corner t-r"></div>
                            <div class="corner b-l"></div>
                            <div class="corner b-r"></div>
                        </div>
                    </div>

                    <div class="input-group">
                        <label>Access Code</label>
                        <div class="input-wrapper">
                            <input v-model="password" type="password" required placeholder="••••••••">
                            <div class="corner t-l"></div>
                            <div class="corner t-r"></div>
                            <div class="corner b-l"></div>
                            <div class="corner b-r"></div>
                        </div>
                    </div>

                    <transition name="shake">
                        <div v-if="error" class="error-container">
                            <span class="alert-icon">⚠️</span>
                            <span class="error-msg">{{ error }}</span>
                        </div>
                    </transition>

                    <button type="submit" :disabled="loading" class="btn-primary">
                        <span class="btn-text" v-if="!loading">AUTHORIZE</span>
                        <div class="loader" v-else>
                            <div class="bar"></div>
                            <div class="bar"></div>
                            <div class="bar"></div>
                        </div>
                    </button>
                    
                    <div class="card-footer">
                        <span class="system-status">SYSTEM STATUS: OPTIMAL</span>
                        <span class="encryption-tag">TLS 1.3 SECURE</span>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<style scoped>
.login-page {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #e2e8f0;
    font-family: 'Inter', system-ui, sans-serif;
}


/* Content */
.content-wrapper {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 450px;
    padding: 20px;
}

.login-card {
    padding: 40px;
    border-radius: 4px; /* Industrial look */
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(56, 189, 248, 0.1);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
    position: relative;
}

.login-card::before {
    content: "";
    position: absolute;
    top: 0; left: 0; width: 100%; height: 2px;
    background: linear-gradient(90deg, transparent, #0ea5e9, transparent);
}

.card-header {
    text-align: center;
    margin-bottom: 40px;
}

.system-icon {
    position: relative;
    width: 60px;
    height: 60px;
    margin: 0 auto 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(14, 165, 233, 0.1);
    border-radius: 12px;
    border: 1px solid rgba(14, 165, 233, 0.3);
}

.icon {
    font-size: 30px;
    filter: drop-shadow(0 0 10px rgba(14, 165, 233, 0.5));
}

.pulse-ring {
    position: absolute;
    width: 100%;
    height: 100%;
    border: 2px solid #0ea5e9;
    border-radius: 12px;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { transform: scale(1); opacity: 0.5; }
    100% { transform: scale(1.5); opacity: 0; }
}

h1 {
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: 4px;
    margin: 0;
    color: #f1f5f9;
}

.subtitle {
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 8px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

/* Forms */
.login-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

label {
    font-size: 0.7rem;
    font-weight: 700;
    color: #38bdf8;
    letter-spacing: 2px;
    text-transform: uppercase;
}

.input-wrapper {
    position: relative;
    background: rgba(0, 0, 0, 0.4);
}

input {
    width: 100%;
    background: transparent !important;
    border: 1px solid rgba(255, 255, 255, 0.05) !important;
    padding: 14px 16px;
    color: white !important;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 0.9rem;
    letter-spacing: 1px;
    transition: all 0.3s;
    outline: none;
}

input:focus {
    border-color: rgba(14, 165, 233, 0.5);
    background: rgba(14, 165, 233, 0.05);
    box-shadow: 0 0 20px rgba(14, 165, 233, 0.1);
}

/* Input Corners */
.corner {
    position: absolute;
    width: 6px;
    height: 6px;
    border-color: #38bdf8;
    border-style: solid;
    opacity: 0.3;
    transition: opacity 0.3s;
}

input:focus ~ .corner {
    opacity: 1;
}

.t-l { top: -1px; left: -1px; border-width: 1px 0 0 1px; }
.t-r { top: -1px; right: -1px; border-width: 1px 1px 0 0; }
.b-l { bottom: -1px; left: -1px; border-width: 0 0 1px 1px; }
.b-r { bottom: -1px; right: -1px; border-width: 0 1px 1px 0; }

.btn-primary {
    margin-top: 10px;
    padding: 16px;
    background: transparent !important;
    border: 1px solid #0ea5e9 !important;
    color: #0ea5e9 !important;
    font-weight: 900;
    letter-spacing: 3px;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
    overflow: hidden;
}

.btn-primary:hover:not(:disabled) {
    background: rgba(14, 165, 233, 0.15) !important;
    transform: translateY(-2px);
    box-shadow: 0 0 30px rgba(14, 165, 233, 0.4);
}

/* Loader */
.loader {
    display: flex;
    justify-content: center;
    gap: 4px;
}

.bar {
    width: 4px;
    height: 16px;
    background: #020617;
    animation: loading-bar 1s ease-in-out infinite;
}

.bar:nth-child(2) { animation-delay: 0.15s; }
.bar:nth-child(3) { animation-delay: 0.3s; }

@keyframes loading-bar {
    0%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(0.4); }
}

.error-container {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.8rem;
    color: #f87171;
}

.alert-icon { font-size: 1rem; }

/* Status Bar */
.card-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
    font-size: 0.6rem;
    color: #475569;
    font-family: monospace;
}

.system-status { display: flex; align-items: center; gap: 5px; }
.system-status::before { 
    content: ""; width: 6px; height: 6px; 
    border-radius: 50%; background: #22c55e; 
    box-shadow: 0 0 10px #22c55e;
}

/* Transitions */
.shake-enter-active {
    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
    10%, 90% { transform: translate3d(-1px, 0, 0); }
    20%, 80% { transform: translate3d(2px, 0, 0); }
    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
    40%, 60% { transform: translate3d(4px, 0, 0); }
}
</style>
