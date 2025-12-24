<script setup>
import AppCard from '../components/AppCard.vue'
import { ref, onMounted } from 'vue'

const apps = ref([])

const fetchApps = async () => {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/apps`)
        if (response.ok) {
            apps.value = await response.json()
        }
    } catch (e) {
        console.error("Failed to fetch apps", e)
    }
}

onMounted(fetchApps)
</script>

<template>
    <div class="grid-container">
        <div v-for="app in apps" :key="app.id" class="card-wrapper">
            <AppCard :title="app.title" :icon="app.icon_url" :url="app.link_url" :description="app.description" />
        </div>
    </div>
</template>

<style scoped>
.grid-container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 2.5rem;
    width: 100%;
    max-width: 1600px;
    margin: 0 auto;
    padding: 2rem;
}

.card-wrapper {
    position: relative;
    cursor: default;
}

@media (max-width: 1024px) {
    .grid-container {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (max-width: 768px) {
    .grid-container {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 480px) {
    .grid-container {
        grid-template-columns: 1fr;
    }
}
</style>
