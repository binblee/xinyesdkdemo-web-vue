<template>
  <div>
    <button @click="goBackToNavigator" class="back-button">Back</button>
    <VrmViewer v-if="currentView === 'vrm'" />
    <PrintView v-if="currentView === 'print'" />
  </div>
</template>

<script setup>
import PrintView from './PrintView.vue'
import VrmViewer from './VrmViewer.vue';

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
