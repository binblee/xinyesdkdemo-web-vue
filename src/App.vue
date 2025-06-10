<script setup>
import { ref } from 'vue';
import AppNavigator from './components/AppNavigator.vue';
import ViewManager from './components/ViewManager.vue';

const activeComponent = ref('AppNavigator'); // Can be 'AppNavigator', 'VrmViewer', 'PrintView'
const currentViewForManager = ref(''); // To pass to ViewManager, e.g., 'vrm' or 'print'

function handleNavigation(view) {
  currentViewForManager.value = view; // e.g., 'vrm' or 'print'
  activeComponent.value = 'ViewManager'; // Switch to showing ViewManager
}

function handleGoBack() {
  activeComponent.value = 'AppNavigator'; // Switch back to showing AppNavigator
  currentViewForManager.value = ''; // Reset the view for manager
}
</script>

<template>
  <AppNavigator v-if="activeComponent === 'AppNavigator'" @navigate="handleNavigation" />
  <ViewManager 
    v-if="activeComponent === 'ViewManager'" 
    :currentView="currentViewForManager" 
    @goBack="handleGoBack" 
  />
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
