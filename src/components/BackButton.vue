<template>
  <button @click="goBack" class="back-button">
    ← {{ buttonText }}
  </button>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  buttonText: {
    type: String,
    default: '返回'
  }
})

const router = useRouter()

function goBack() {
  // Check if there's history to go back to
  if (window.history.length > 1) {
    router.back()
  } else {
    // If no history, go to home
    router.push('/')
  }
}
</script>

<style scoped>
.back-button {
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 1000;
  padding: 8px 15px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: background-color 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.back-button:hover {
  background-color: #5a6268;
}

.back-button:active {
  background-color: #545b62;
  transform: translateY(1px);
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .back-button {
    top: 8px;
    left: 8px;
    padding: 10px 16px;
    font-size: 16px;
    min-height: 44px; /* Better touch target */
  }
}
</style>
