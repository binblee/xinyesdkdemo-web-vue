<template>
  <div class="camera-test-demo">
    <div class="header">
      <h2>📹 Camera Test Demo</h2>
      <p>Basic camera access, preview, and device testing</p>
    </div>

    <!-- Camera Preview Area -->
    <div class="camera-container">
      <div class="video-wrapper" :class="{ 'camera-active': isCameraActive }">
        <video 
          ref="videoElement" 
          autoplay 
          muted 
          playsinline
          :style="{ transform: isFrontCamera ? 'scaleX(-1)' : 'scaleX(1)' }"
        ></video>
        
        <!-- Camera Info Overlay -->
        <div class="camera-info" v-if="isCameraActive">
          <div class="info-item">
            <span class="label">Resolution:</span>
            <span class="value">{{ currentResolution }}</span>
          </div>
          <div class="info-item">
            <span class="label">FPS:</span>
            <span class="value">{{ currentFps }}</span>
          </div>
          <div class="info-item">
            <span class="label">Camera:</span>
            <span class="value">{{ currentCameraLabel }}</span>
          </div>
        </div>

        <!-- Loading/Error States -->
        <div class="camera-placeholder" v-if="!isCameraActive">
          <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <p>Starting camera...</p>
          </div>
          <div v-else-if="error" class="error-state">
            <p class="error-message">❌ {{ error }}</p>
            <button @click="requestPermissions" class="retry-btn">Retry</button>
          </div>
          <div v-else class="initial-state">
            <p>📷 Click "Start Camera" to begin</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls Panel -->
    <div class="controls-panel">
      <div class="basic-controls">
        <button 
          @click="startCamera" 
          :disabled="isLoading || isCameraActive"
          class="btn btn-primary"
        >
          {{ isLoading ? 'Starting...' : 'Start Camera' }}
        </button>
        
        <button 
          @click="stopCamera" 
          :disabled="!isCameraActive"
          class="btn btn-secondary"
        >
          Stop Camera
        </button>

        <select 
          v-model="selectedCameraId" 
          @change="switchCamera"
          :disabled="!availableCameras.length || isLoading"
          class="camera-select"
        >
          <option value="" disabled>Select Camera</option>
          <option 
            v-for="camera in availableCameras" 
            :key="camera.deviceId"
            :value="camera.deviceId"
          >
            {{ camera.label || `Camera ${camera.deviceId.slice(0, 8)}...` }}
          </option>
        </select>
      </div>

      <div class="advanced-controls">
        <div class="resolution-controls">
          <label>Resolution:</label>
          <select v-model="selectedResolution" @change="applyResolution" :disabled="!isCameraActive">
            <option value="auto">Auto</option>
            <option value="480p">480p (640×480)</option>
            <option value="720p">720p (1280×720)</option>
            <option value="1080p">1080p (1920×1080)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Status & Information Panel -->
    <div class="status-panel">
      <div class="device-info">
        <h3>📱 Device Information</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Available Cameras:</span>
            <span class="value">{{ availableCameras.length }}</span>
          </div>
          <div class="info-item">
            <span class="label">Browser Support:</span>
            <span class="value">{{ browserSupport ? '✅ Supported' : '❌ Not Supported' }}</span>
          </div>
          <div class="info-item">
            <span class="label">Permissions:</span>
            <span class="value">{{ permissionStatus }}</span>
          </div>
        </div>
      </div>

      <div class="camera-capabilities" v-if="currentCapabilities">
        <h3>📋 Camera Capabilities</h3>
        <div class="capabilities-grid">
          <div class="capability-item" v-for="(value, key) in displayCapabilities" :key="key">
            <span class="label">{{ formatCapabilityName(key) }}:</span>
            <span class="value">{{ value }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CameraTestDemo',
  data() {
    return {
      // Camera state
      isCameraActive: false,
      isLoading: false,
      error: null,
      
      // Camera devices
      availableCameras: [],
      selectedCameraId: '',
      currentCameraLabel: '',
      
      // Video stream
      currentStream: null,
      currentTrack: null,
      
      // Camera info
      currentResolution: '',
      currentFps: 0,
      selectedResolution: 'auto',
      
      // Capabilities
      currentCapabilities: null,
      
      // Support & permissions
      browserSupport: false,
      permissionStatus: 'Unknown',
      
      // Performance monitoring
      fpsMonitorInterval: null,
      lastFrameTime: 0,
      frameCount: 0,
    }
  },
  
  computed: {
    isFrontCamera() {
      return this.currentCameraLabel.toLowerCase().includes('front') || 
             this.currentCameraLabel.toLowerCase().includes('user');
    },
    
    displayCapabilities() {
      if (!this.currentCapabilities) return {};
      
      const caps = this.currentCapabilities;
      return {
        width: this.formatRange(caps.width),
        height: this.formatRange(caps.height),
        frameRate: this.formatRange(caps.frameRate),
        facingMode: caps.facingMode || 'N/A',
        aspectRatio: this.formatRange(caps.aspectRatio),
      };
    }
  },
  
  async mounted() {
    await this.initializeCamera();
  },
  
  beforeUnmount() {
    this.stopCamera();
    if (this.fpsMonitorInterval) {
      clearInterval(this.fpsMonitorInterval);
    }
  },
  
  methods: {
    async initializeCamera() {
      // Check browser support with more comprehensive detection
      this.browserSupport = this.checkBrowserSupport();
      
      if (!this.browserSupport) {
        this.error = 'Camera access not supported by this browser. Please use a modern browser with HTTPS.';
        return;
      }
      
      // Check permissions
      await this.checkPermissions();
      
      // Get available cameras
      await this.enumerateDevices();
    },
    
    checkBrowserSupport() {
      // Check for modern MediaDevices API
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return true;
      }
      
      // Check for legacy getUserMedia (with vendor prefixes)
      const getUserMediaLegacy = navigator.getUserMedia || 
                                navigator.webkitGetUserMedia || 
                                navigator.mozGetUserMedia || 
                                navigator.msGetUserMedia;
      
      if (getUserMediaLegacy) {
        // Polyfill navigator.mediaDevices for legacy browsers
        if (!navigator.mediaDevices) {
          navigator.mediaDevices = {};
        }
        
        if (!navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia = function(constraints) {
            return new Promise((resolve, reject) => {
              getUserMediaLegacy.call(navigator, constraints, resolve, reject);
            });
          };
        }
        
        return true;
      }
      
      return false;
    },
    
    async checkPermissions() {
      try {
        if ('permissions' in navigator) {
          const permission = await navigator.permissions.query({ name: 'camera' });
          this.permissionStatus = permission.state;
          
          permission.addEventListener('change', () => {
            this.permissionStatus = permission.state;
          });
        }
      } catch (error) {
        console.warn('Could not check camera permissions:', error);
        this.permissionStatus = 'Unknown';
      }
    },
    
    async enumerateDevices() {
      try {
        // Check if enumerateDevices is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          console.warn('enumerateDevices not supported, using fallback');
          // Fallback: create a generic camera option
          this.availableCameras = [
            { deviceId: 'default', label: 'Default Camera', kind: 'videoinput' }
          ];
          this.selectedCameraId = 'default';
          return;
        }
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        this.availableCameras = devices.filter(device => device.kind === 'videoinput');
        
        // If no cameras found, add a default option
        if (this.availableCameras.length === 0) {
          this.availableCameras = [
            { deviceId: 'default', label: 'Default Camera', kind: 'videoinput' }
          ];
        }
        
        // Select the first camera if none selected
        if (this.availableCameras.length > 0 && !this.selectedCameraId) {
          this.selectedCameraId = this.availableCameras[0].deviceId;
        }
      } catch (error) {
        console.error('Error enumerating devices:', error);
        // Fallback: create a default camera option
        this.availableCameras = [
          { deviceId: 'default', label: 'Default Camera', kind: 'videoinput' }
        ];
        this.selectedCameraId = 'default';
      }
    },
    
    async startCamera() {
      if (this.isLoading || this.isCameraActive) return;
      
      this.isLoading = true;
      this.error = null;
      
      try {
        // Double-check browser support before attempting to start camera
        if (!this.checkBrowserSupport()) {
          throw new Error('Camera API not available. Please use HTTPS and a modern browser.');
        }
        
        const constraints = this.getConstraints();
        
        // Use the polyfilled or native getUserMedia
        this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Set up video element
        const video = this.$refs.videoElement;
        video.srcObject = this.currentStream;
        
        // Get track info
        this.currentTrack = this.currentStream.getVideoTracks()[0];
        this.currentCameraLabel = this.getCurrentCameraLabel();
        
        // Get capabilities (with error handling)
        try {
          if (this.currentTrack.getCapabilities) {
            this.currentCapabilities = this.currentTrack.getCapabilities();
          }
        } catch (capError) {
          console.warn('Could not get camera capabilities:', capError);
          this.currentCapabilities = null;
        }
        
        // Wait for video to load
        await new Promise((resolve) => {
          video.addEventListener('loadedmetadata', resolve, { once: true });
        });
        
        // Update resolution info
        this.updateResolutionInfo();
        
        // Start FPS monitoring
        this.startFpsMonitoring();
        
        this.isCameraActive = true;
        
        // Re-enumerate devices to get updated labels (with error handling)
        try {
          await this.enumerateDevices();
        } catch (enumError) {
          console.warn('Could not re-enumerate devices:', enumError);
        }
        
      } catch (error) {
        console.error('Error starting camera:', error);
        this.handleCameraError(error);
      } finally {
        this.isLoading = false;
      }
    },
    
    stopCamera() {
      if (this.currentStream) {
        this.currentStream.getTracks().forEach(track => track.stop());
        this.currentStream = null;
      }
      
      if (this.fpsMonitorInterval) {
        clearInterval(this.fpsMonitorInterval);
        this.fpsMonitorInterval = null;
      }
      
      this.isCameraActive = false;
      this.currentTrack = null;
      this.currentCapabilities = null;
      this.currentFps = 0;
      this.frameCount = 0;
    },
    
    async switchCamera() {
      if (!this.selectedCameraId) return;
      
      const wasActive = this.isCameraActive;
      if (wasActive) {
        this.stopCamera();
        await new Promise(resolve => setTimeout(resolve, 100)); // Brief delay
        await this.startCamera();
      }
    },
    
    async applyResolution() {
      if (!this.isCameraActive) return;
      
      const wasActive = this.isCameraActive;
      if (wasActive) {
        this.stopCamera();
        await new Promise(resolve => setTimeout(resolve, 100));
        await this.startCamera();
      }
    },
    
    getConstraints() {
      const constraints = {
        video: {}
      };
      
      // Only add deviceId constraint if it's not 'default'
      if (this.selectedCameraId && this.selectedCameraId !== 'default') {
        constraints.video.deviceId = { exact: this.selectedCameraId };
      }
      
      // Apply resolution constraints
      if (this.selectedResolution !== 'auto') {
        const resolutions = {
          '480p': { width: 640, height: 480 },
          '720p': { width: 1280, height: 720 },
          '1080p': { width: 1920, height: 1080 }
        };
        
        const resolution = resolutions[this.selectedResolution];
        if (resolution) {
          constraints.video.width = { ideal: resolution.width };
          constraints.video.height = { ideal: resolution.height };
        }
      }
      
      return constraints;
    },
    
    getCurrentCameraLabel() {
      const camera = this.availableCameras.find(cam => cam.deviceId === this.selectedCameraId);
      return camera ? camera.label : 'Unknown Camera';
    },
    
    updateResolutionInfo() {
      const video = this.$refs.videoElement;
      if (video) {
        this.currentResolution = `${video.videoWidth}×${video.videoHeight}`;
      }
    },
    
    startFpsMonitoring() {
      this.frameCount = 0;
      this.lastFrameTime = performance.now();
      
      this.fpsMonitorInterval = setInterval(() => {
        const video = this.$refs.videoElement;
        if (video && video.readyState >= 2) {
          this.frameCount++;
          const currentTime = performance.now();
          const elapsed = currentTime - this.lastFrameTime;
          
          if (elapsed >= 1000) { // Update every second
            this.currentFps = Math.round((this.frameCount * 1000) / elapsed);
            this.frameCount = 0;
            this.lastFrameTime = currentTime;
          }
        }
      }, 100);
    },
    
    async requestPermissions() {
      this.error = null;
      await this.startCamera();
    },
    
    handleCameraError(error) {
      switch (error.name) {
        case 'NotAllowedError':
          this.error = 'Camera access denied. Please grant permission and try again.';
          break;
        case 'NotFoundError':
          this.error = 'No camera found on this device.';
          break;
        case 'NotSupportedError':
          this.error = 'Camera not supported by this browser.';
          break;
        case 'OverconstrainedError':
          this.error = 'Camera constraints not supported. Try a different resolution.';
          break;
        default:
          this.error = `Camera error: ${error.message}`;
      }
    },
    
    formatRange(range) {
      if (!range) return 'N/A';
      if (typeof range === 'object') {
        if (range.min !== undefined && range.max !== undefined) {
          return `${range.min} - ${range.max}`;
        }
        if (range.ideal !== undefined) {
          return `${range.ideal} (ideal)`;
        }
      }
      return String(range);
    },
    
    formatCapabilityName(key) {
      return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }
  }
}
</script>

<style scoped>
.camera-test-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.header p {
  color: #7f8c8d;
  font-size: 16px;
}

.camera-container {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.video-wrapper {
  position: relative;
  width: 640px;
  height: 480px;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.video-wrapper.camera-active {
  background: transparent;
}

.video-wrapper video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.camera-info {
  position: absolute;
  top: 15px;
  left: 15px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px;
  border-radius: 8px;
  font-size: 12px;
  font-family: 'Monaco', monospace;
}

.camera-info .info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  min-width: 150px;
}

.camera-info .info-item:last-child {
  margin-bottom: 0;
}

.camera-info .label {
  color: #bdc3c7;
  margin-right: 10px;
}

.camera-info .value {
  color: #ffffff;
  font-weight: bold;
}

.camera-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #7f8c8d;
  text-align: center;
}

.loading-state .spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #ecf0f1;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state .error-message {
  color: #e74c3c;
  margin-bottom: 15px;
  font-size: 16px;
}

.retry-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.retry-btn:hover {
  background: #c0392b;
}

.controls-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.basic-controls {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #7f8c8d;
}

.camera-select {
  padding: 10px 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  min-width: 200px;
}

.advanced-controls {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.resolution-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.resolution-controls label {
  font-weight: 500;
  color: #2c3e50;
}

.resolution-controls select {
  padding: 8px 12px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.status-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.device-info h3,
.camera-capabilities h3 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 18px;
}

.info-grid,
.capabilities-grid {
  display: grid;
  gap: 10px;
}

.info-item,
.capability-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: white;
  border-radius: 8px;
  border: 1px solid #ecf0f1;
}

.info-item .label,
.capability-item .label {
  color: #7f8c8d;
  font-weight: 500;
}

.info-item .value,
.capability-item .value {
  color: #2c3e50;
  font-weight: 600;
  font-family: 'Monaco', monospace;
}

@media (max-width: 768px) {
  .camera-test-demo {
    padding: 15px;
  }
  
  .video-wrapper {
    width: 100%;
    max-width: 480px;
    height: 360px;
  }
  
  .basic-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn {
    width: 100%;
  }
  
  .camera-select {
    width: 100%;
  }
  
  .status-panel {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}
</style>
