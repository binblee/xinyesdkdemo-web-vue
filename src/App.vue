<script setup>
import { ref } from 'vue'; // Added ref
import HelloWorld from './components/HelloWorld.vue'
import PrintView from './components/print-view/PrintView.vue'
import VrmViewer from './components/VrmViewer.vue';
import AppNavigator from './components/AppNavigator.vue'; // Import the new component

const currentView = ref('vrm'); // Default to VrmViewer

function handleNavigation(view) {
  currentView.value = view;
}
</script>

<template>
  <AppNavigator :currentView="currentView" @navigate="handleNavigation" />

  <VrmViewer v-if="currentView === 'vrm'" />
  <PrintView v-if="currentView === 'print'" />
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
