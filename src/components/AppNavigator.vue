<template>
  <div class="app-navigator">
    <button @click="navigateTo('vrm')">VRM Viewer</button>
    <button @click="navigateTo('print')">Print View</button>
    <button @click="navigateTo('tts')">Xunfei TTS Demo</button>
    <button @click="navigateTo('camera')">Camera Test Demo</button>
    <button @click="navigateTo('microphone')">Microphone Test Demo</button>
  </div>
</template>

<script setup>
const emit = defineEmits(['navigate']);

function navigateTo(view) {
  emit('navigate', view);
}
</script>

<style scoped>
.app-navigator {
  display: flex;
  flex-direction: column; /* ADDED: Stack buttons vertically */
  align-items: center; /* ADDED: Center buttons horizontally in the column */
  padding: 10px;
  background-color: #f0f0f0;
  margin-bottom: 20px;
  border-bottom: 1px solid #ddd;
  width: 100%; /* ADDED: Make container 100% width */
  box-sizing: border-box; /* ADDED: Include padding in width calculation */
  min-width: 100%; /* ADDED: Ensure minimum width is 100% */
}

.app-navigator button {
  padding: 8px 15px;
  margin: 5px 0; /* MODIFIED: Adjusted margin for vertical stacking */
  border: 1px solid #ccc;
  border-radius: 5px; /* Slightly more rounded corners */
  background-color: #fff;
  cursor: pointer;
  font-size: 1em; /* Slightly larger font */
  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1); /* Subtle shadow */
  width: 200px; /* ADDED: Give buttons a consistent width */
  text-align: center; /* ADDED: Ensure text is centered in buttons */
}

.app-navigator button:hover {
  background-color: #e9e9e9;
  border-color: #bbb;
  box-shadow: 0 2px 5px rgba(0,0,0,0.15);
}
</style>
