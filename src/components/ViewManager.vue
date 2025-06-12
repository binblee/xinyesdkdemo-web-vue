<template>
  <div>
    <button @click="goBackToNavigator" class="back-button">Back</button>
    <VrmViewer v-if="currentView === 'vrm'" />
    <PrintView v-if="currentView === 'print'" />
    <XunfeiTtsDemo v-if="currentView === 'tts'" />
    <CameraTestDemo v-if="currentView === 'camera'" />
    <MicrophoneTestDemo v-if="currentView === 'microphone'" />
  </div>
</template>

<script setup>
import PrintView from './PrintView.vue'
import VrmViewer from './VrmViewer.vue';
import XunfeiTtsDemo from './XunfeiTtsDemo.vue';
import CameraTestDemo from './CameraTestDemo.vue';
import MicrophoneTestDemo from './MicrophoneTestDemo.vue';

defineProps({
  currentView: String
});

const emit = defineEmits(['goBack']);

function goBackToNavigator() {
  emit('goBack');
}
</script>

<style scoped>
.back-button {
  margin: 10px;
  padding: 8px 15px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
.back-button:hover {
  background-color: #5a6268;
}
</style>
