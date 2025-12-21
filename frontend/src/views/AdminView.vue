<script setup>
import { ref, onMounted } from 'vue'

const apps = ref([])
const showEditDialog = ref(false)
const editingApp = ref(null)

const fetchApps = async () => {
    try {
        const response = await fetch('http://localhost:8001/api/apps')
        if (response.ok) {
            apps.value = await response.json()
        }
    } catch (e) {
        console.error("Failed to fetch apps", e)
    }
}

const openEditDialog = (app) => {
    editingApp.value = { ...app }
    showEditDialog.value = true
}

const saveApp = async () => {
    try {
        const response = await fetch(`http://localhost:8001/api/apps/${editingApp.value.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingApp.value)
        })
        if (response.ok) {
            await fetchApps()
            showEditDialog.value = false
        }
    } catch (e) {
        console.error(e)
    }
}

onMounted(fetchApps)
</script>

<template>
    <div class="admin-container glass-panel">
        <h1>Application Management</h1>

        <table class="admin-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Icon</th>
                    <th>Title</th>
                    <th>URL</th>
                    <th>Description</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="app in apps" :key="app.id">
                    <td>{{ app.id }}</td>
                    <td><img :src="app.icon_url" class="table-icon" /></td>
                    <td>{{ app.title }}</td>
                    <td>{{ app.link_url }}</td>
                    <td>{{ app.description }}</td>
                    <td>
                        <button class="btn-edit" @click="openEditDialog(app)">Edit</button>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Edit Dialog -->
        <div v-if="showEditDialog" class="dialog-overlay" @click.self="showEditDialog = false">
            <div class="dialog glass-panel">
                <h2>Edit Application</h2>

                <div class="form-group">
                    <label>Title</label>
                    <input v-model="editingApp.title" type="text">
                </div>

                <div class="form-group">
                    <label>Icon URL</label>
                    <input v-model="editingApp.icon_url" type="text">
                </div>

                <div class="form-group">
                    <label>Link URL</label>
                    <input v-model="editingApp.link_url" type="text">
                </div>

                <div class="form-group">
                    <label>Description</label>
                    <input v-model="editingApp.description" type="text">
                </div>

                <div class="dialog-actions">
                    <button @click="showEditDialog = false" class="btn-cancel">Cancel</button>
                    <button @click="saveApp" class="btn-save">Save</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.admin-container {
    width: 100%;
    max-width: 1000px;
    padding: 2rem;
    border-radius: 16px;
    margin-top: 2rem;
}

h1 {
    margin-bottom: 2rem;
    text-align: center;
}

.admin-table {
    width: 100%;
    border-collapse: collapse;
}

.admin-table th,
.admin-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.table-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
}

.btn-edit {
    background: #38bdf8;
    color: #0f172a;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
}

/* Dialog Styles (Same as before) */
.dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 2000;
    display: flex;
    justify-content: center;
    align-items: center;
    backdrop-filter: blur(4px);
}

.dialog {
    padding: 2rem;
    border-radius: 16px;
    width: 100%;
    max-width: 400px;
    color: white;
    background: rgba(30, 41, 59, 1);
    /* Solid bg for dialog */
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.form-group {
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group input {
    padding: 0.5rem;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(0, 0, 0, 0.3);
    color: white;
}

.dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
}

button {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-weight: bold;
}

.btn-save {
    background: #38bdf8;
    color: #0f172a;
}

.btn-cancel {
    background: transparent;
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>
