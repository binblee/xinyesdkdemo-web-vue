<template>
  <div class="app-navigator">
    <button @click="navigateTo('vrm')" :class="{ active: currentView === 'vrm' }">VRM Viewer</button>
    <button @click="navigateTo('print')" :class="{ active: currentView === 'print' }">Print View</button>
  </div>
</template>

<script setup>
// Props to receive the current view from the parent, to style the active button
defineProps({
  currentView: String
});

const emit = defineEmits(['navigate']);

function navigateTo(view) {
  emit('navigate', view);
}
</script>

<style scoped>
.app-navigator {
  display: flex;
  justify-content: center;
  padding: 10px;
  background-color: #f0f0f0;
  margin-bottom: 20px;
  border-bottom: 1px solid #ddd;
}

.app-navigator button {
  padding: 8px 15px;
  margin: 0 10px; /* Increased margin for better separation */
  border: 1px solid #ccc;
  border-radius: 5px; /* Slightly more rounded corners */
  background-color: #fff;
  cursor: pointer;
  font-size: 1em; /* Slightly larger font */
  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1); /* Subtle shadow */
}

.app-navigator button:hover {
  background-color: #e9e9e9;
  border-color: #bbb;
  box-shadow: 0 2px 5px rgba(0,0,0,0.15);
}

.app-navigator button.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05) inset; /* Inner shadow for active state */
}
</style>
