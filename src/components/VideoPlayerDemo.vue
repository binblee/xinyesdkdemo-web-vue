<template>
  <div class="video-player-container">
    <!-- Back Button -->
    <BackButton />
    
    <!-- Header -->
    <div class="header">
      <h2>🎬 视频播放演示</h2>
    </div>

    <!-- Video Player -->
    <div class="video-wrapper" @click="toggleControls" @touchstart="handleTouch">
      <!-- Video Element -->
      <video
        ref="videoElement"
        class="video-element"
        :src="currentVideoSrc"
        :poster="poster"
        :muted="muted"
        :loop="loop"
        @loadedmetadata="onLoadedMetadata"
        @timeupdate="onTimeUpdate"
        @play="onPlay"
        @pause="onPause"
        @ended="onEnded"
        @loadstart="onLoadStart"
        @canplay="onCanPlay"
        @error="onError"
        @click.stop="togglePlay"
        preload="metadata"
        playsinline
      >
        您的浏览器不支持视频标签。
      </video>

      <!-- Loading Spinner -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="spinner"></div>
        <p>正在加载视频...</p>
      </div>

      <!-- Error State -->
      <div v-if="hasError" class="error-overlay">
        <div class="error-icon">⚠️</div>
        <p>视频加载失败</p>
        <button @click="retryLoad" class="retry-button">重试</button>
      </div>

      <!-- Controls Overlay -->
      <div 
        v-show="showControls && !isLoading && !hasError" 
        class="controls-overlay"
        @click.stop
      >
        <!-- Main Controls Bar -->
        <div class="controls-bar">
          <!-- Play/Pause Button -->
          <button 
            @click="togglePlay" 
            class="control-button play-button"
            :class="{ playing: isPlaying }"
          >
            <span v-if="isPlaying">⏸️</span>
            <span v-else>▶️</span>
          </button>

          <!-- Progress Bar -->
          <div class="progress-container">
            <div 
              class="progress-bar" 
              @click="seekToPosition"
              ref="progressBar"
            >
              <div class="progress-buffered" :style="{ width: bufferedPercent + '%' }"></div>
              <div class="progress-played" :style="{ width: progressPercent + '%' }"></div>
              <div 
                class="progress-handle" 
                :style="{ left: progressPercent + '%' }"
                @mousedown="startDragging"
                @touchstart="startDragging"
              ></div>
            </div>
            
            <!-- Time Display -->
            <div class="time-display">
              <span class="current-time">{{ formatTime(currentTime) }}</span>
              <span class="separator">/</span>
              <span class="total-time">{{ formatTime(duration) }}</span>
            </div>
          </div>

          <!-- Volume Control -->
          <div class="volume-container">
            <button @click="toggleMute" class="control-button volume-button">
              <span v-if="isMuted || volume === 0">🔇</span>
              <span v-else-if="volume < 0.5">🔉</span>
              <span v-else>🔊</span>
            </button>
            <div class="volume-slider" v-show="showVolumeSlider">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                v-model="volume"
                @input="setVolume"
                class="volume-input"
              >
            </div>
          </div>

          <!-- Fullscreen Button -->
          <button @click="toggleFullscreen" class="control-button fullscreen-button">
            <span v-if="isFullscreen">🔳</span>
            <span v-else>⛶</span>
          </button>
        </div>
      </div>

      <!-- Center Play Button (when paused) -->
      <div 
        v-if="!isPlaying && !isLoading && !hasError && showControls" 
        class="center-play-button"
        @click="togglePlay"
      >
        <div class="play-icon">▶️</div>
      </div>
    </div>

    <!-- Video Source Selector -->
    <div class="video-selector">
      <h3>📺 选择视频源:</h3>
      <div class="source-buttons">
        <button 
          v-for="source in videoSources" 
          :key="source.id"
          @click="changeVideoSource(source.url)"
          :class="{ active: source.url === currentVideoSrc }"
          class="source-button"
        >
          {{ source.name }}
        </button>
      </div>
      
      <!-- Custom URL Input -->
      <div class="custom-url">
        <input 
          type="url" 
          v-model="customUrl" 
          placeholder="输入自定义视频URL..."
          class="url-input"
        >
        <button @click="loadCustomUrl" :disabled="!customUrl" class="load-button">
          加载
        </button>
      </div>
    </div>

    <!-- Video Info -->
    <div v-if="videoInfo.loaded" class="video-info">
      <h4>📊 视频信息:</h4>
      <div class="info-grid">
        <div class="info-item">
          <label>时长:</label>
          <span>{{ formatTime(duration) }}</span>
        </div>
        <div class="info-item">
          <label>分辨率:</label>
          <span>{{ videoInfo.width }}x{{ videoInfo.height }}</span>
        </div>
        <div class="info-item">
          <label>状态:</label>
          <span :class="isPlaying ? 'status-playing' : 'status-paused'">
            {{ isPlaying ? '播放中' : '已暂停' }}
          </span>
        </div>
        <div class="info-item">
          <label>当前时间:</label>
          <span>{{ formatTime(currentTime) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import BackButton from './BackButton.vue';

// Props
const props = defineProps({
  autoplay: {
    type: Boolean,
    default: false
  },
  loop: {
    type: Boolean,
    default: false
  },
  muted: {
    type: Boolean,
    default: false
  },
  poster: {
    type: String,
    default: ''
  }
});

// Refs
const videoElement = ref(null);
const progressBar = ref(null);

// State
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(1);
const isMuted = ref(props.muted);
const isFullscreen = ref(false);
const isLoading = ref(false);
const hasError = ref(false);
const showControls = ref(true);
const showVolumeSlider = ref(false);
const isDragging = ref(false);
const customUrl = ref('');

// Video sources
const videoSources = reactive([
  {
    id: 1,
    name: 'Sample Video 1',
    url: 'https://oss.taient.com/website/video/product_taient.mp4'
  },
  {
    id: 2,
    name: 'Sample Video 2',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  }
]);

const currentVideoSrc = ref(videoSources[0].url);

// Video info
const videoInfo = reactive({
  loaded: false,
  width: 0,
  height: 0
});

// Computed
const progressPercent = computed(() => {
  return duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0;
});

const bufferedPercent = computed(() => {
  if (!videoElement.value || !videoElement.value.buffered.length) return 0;
  const buffered = videoElement.value.buffered;
  return duration.value > 0 ? (buffered.end(buffered.length - 1) / duration.value) * 100 : 0;
});

// Controls timeout
let controlsTimeout = null;

// Event Handlers
function onLoadedMetadata() {
  if (videoElement.value) {
    duration.value = videoElement.value.duration;
    videoInfo.width = videoElement.value.videoWidth;
    videoInfo.height = videoElement.value.videoHeight;
    videoInfo.loaded = true;
  }
}

function onTimeUpdate() {
  if (videoElement.value && !isDragging.value) {
    currentTime.value = videoElement.value.currentTime;
  }
}

function onPlay() {
  isPlaying.value = true;
  showControlsTemporary();
}

function onPause() {
  isPlaying.value = false;
  showControlsTemporary();
}

function onEnded() {
  isPlaying.value = false;
  currentTime.value = 0;
  showControlsTemporary();
}

function onLoadStart() {
  isLoading.value = true;
  hasError.value = false;
}

function onCanPlay() {
  isLoading.value = false;
  if (props.autoplay && !isPlaying.value) {
    togglePlay();
  }
}

function onError() {
  isLoading.value = false;
  hasError.value = true;
  console.error('Video loading error');
}

// Control Functions
function togglePlay() {
  if (!videoElement.value) return;
  
  if (isPlaying.value) {
    videoElement.value.pause();
  } else {
    videoElement.value.play().catch(error => {
      console.error('Play failed:', error);
      hasError.value = true;
    });
  }
}

function setVolume() {
  if (videoElement.value) {
    videoElement.value.volume = volume.value;
    isMuted.value = volume.value === 0;
  }
}

function toggleMute() {
  if (videoElement.value) {
    if (isMuted.value) {
      videoElement.value.muted = false;
      volume.value = volume.value === 0 ? 0.5 : volume.value;
      videoElement.value.volume = volume.value;
      isMuted.value = false;
    } else {
      videoElement.value.muted = true;
      isMuted.value = true;
    }
  }
}

function seekToPosition(event) {
  if (!videoElement.value || !progressBar.value) return;
  
  const rect = progressBar.value.getBoundingClientRect();
  const pos = (event.clientX - rect.left) / rect.width;
  const newTime = pos * duration.value;
  
  videoElement.value.currentTime = newTime;
  currentTime.value = newTime;
}

function startDragging(event) {
  isDragging.value = true;
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDragging);
  document.addEventListener('touchmove', onDrag);
  document.addEventListener('touchend', stopDragging);
}

function onDrag(event) {
  if (!isDragging.value || !progressBar.value) return;
  
  const clientX = event.clientX || event.touches[0].clientX;
  const rect = progressBar.value.getBoundingClientRect();
  const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  const newTime = pos * duration.value;
  
  currentTime.value = newTime;
  if (videoElement.value) {
    videoElement.value.currentTime = newTime;
  }
}

function stopDragging() {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDragging);
  document.removeEventListener('touchmove', onDrag);
  document.removeEventListener('touchend', stopDragging);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    videoElement.value.requestFullscreen().catch(err => {
      console.error('Fullscreen failed:', err);
    });
  } else {
    document.exitFullscreen();
  }
}

function toggleControls() {
  showControls.value = !showControls.value;
  if (showControls.value) {
    showControlsTemporary();
  }
}

function showControlsTemporary() {
  showControls.value = true;
  clearTimeout(controlsTimeout);
  controlsTimeout = setTimeout(() => {
    if (isPlaying.value) {
      showControls.value = false;
    }
  }, 3000);
}

function handleTouch() {
  showControlsTemporary();
}

function changeVideoSource(url) {
  currentVideoSrc.value = url;
  hasError.value = false;
  videoInfo.loaded = false;
  
  nextTick(() => {
    if (videoElement.value) {
      videoElement.value.load();
    }
  });
}

function loadCustomUrl() {
  if (customUrl.value) {
    changeVideoSource(customUrl.value);
    customUrl.value = '';
  }
}

function retryLoad() {
  hasError.value = false;
  if (videoElement.value) {
    videoElement.value.load();
  }
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Lifecycle
onMounted(() => {
  // Fullscreen event listeners
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement;
  });
  
  // Volume button hover
  const volumeContainer = document.querySelector('.volume-container');
  if (volumeContainer) {
    volumeContainer.addEventListener('mouseenter', () => {
      showVolumeSlider.value = true;
    });
    volumeContainer.addEventListener('mouseleave', () => {
      showVolumeSlider.value = false;
    });
  }
});

onBeforeUnmount(() => {
  clearTimeout(controlsTimeout);
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDragging);
  document.removeEventListener('touchmove', onDrag);
  document.removeEventListener('touchend', stopDragging);
});
</script>

<style scoped>
.video-player-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  color: #333;
  overflow-y: auto;
}

.header {
  text-align: center;
  margin-bottom: 20px;
  color: white;
}

.header h2 {
  margin: 0 0 5px 0;
  font-size: 1.8rem;
  font-weight: 600;
}

.video-wrapper {
  position: relative;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  aspect-ratio: 16/9;
  min-height: 200px;
  max-height: 400px;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

.loading-overlay, .error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  z-index: 10;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 10px;
}

.retry-button {
  padding: 8px 16px;
  border: 1px solid white;
  background: transparent;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.retry-button:hover {
  background: white;
  color: black;
}

.controls-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 20px;
  z-index: 5;
  transition: opacity 0.3s ease;
}

.controls-bar {
  display: flex;
  align-items: center;
  gap: 15px;
  color: white;
}

.control-button {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background 0.2s ease;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.progress-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  position: relative;
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  cursor: pointer;
}

.progress-buffered {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 3px;
  transition: width 0.2s ease;
}

.progress-played {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #4caf50;
  border-radius: 3px;
  transition: width 0.1s ease;
}

.progress-handle {
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  background: white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.time-display {
  font-size: 0.9rem;
  font-family: 'Courier New', monospace;
  min-width: 80px;
  text-align: center;
}

.separator {
  opacity: 0.7;
  margin: 0 2px;
}

.volume-container {
  position: relative;
  display: flex;
  align-items: center;
}

.volume-slider {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.volume-input {
  writing-mode: bt-lr;
  appearance: slider-vertical;
  -webkit-appearance: slider-vertical;
  width: 30px;
  height: 80px;
}

.center-play-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 6;
  cursor: pointer;
}

.play-icon {
  font-size: 4rem;
  background: rgba(0, 0, 0, 0.7);
  padding: 20px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.play-icon:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: scale(1.1);
}

.video-selector {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.video-selector h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.source-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.source-button {
  padding: 8px 16px;
  border: 2px solid #1e3c72;
  background: white;
  color: #1e3c72;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.source-button:hover {
  background: #f0f0f0;
}

.source-button.active {
  background: #1e3c72;
  color: white;
}

.custom-url {
  display: flex;
  gap: 10px;
  align-items: center;
}

.url-input {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.url-input:focus {
  outline: none;
  border-color: #1e3c72;
}

.load-button {
  padding: 8px 16px;
  border: none;
  background: #4caf50;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.load-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.load-button:not(:disabled):hover {
  background: #45a049;
}

.video-info {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.video-info h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.info-item label {
  font-weight: 500;
  color: #666;
}

.status-playing {
  color: #4caf50;
  font-weight: bold;
}

.status-paused {
  color: #ff9800;
  font-weight: bold;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .video-player-container {
    padding: 15px;
  }
  
  .video-wrapper {
    max-height: 250px;
  }
  
  .controls-bar {
    gap: 10px;
  }
  
  .control-button {
    font-size: 1rem;
    min-width: 40px;
    min-height: 40px;
  }
  
  .progress-container {
    gap: 8px;
  }
  
  .time-display {
    font-size: 0.8rem;
    min-width: 70px;
  }
  
  .source-buttons {
    flex-direction: column;
  }
  
  .source-button {
    width: 100%;
    text-align: center;
  }
  
  .custom-url {
    flex-direction: column;
  }
  
  .url-input, .load-button {
    width: 100%;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .video-player-container {
    padding: 10px;
  }
  
  .header h2 {
    font-size: 1.4rem;
  }
  
  .video-wrapper {
    max-height: 200px;
  }
  
  .controls-overlay {
    padding: 15px;
  }
  
  .play-icon {
    font-size: 3rem;
    padding: 15px;
  }
}
</style>
