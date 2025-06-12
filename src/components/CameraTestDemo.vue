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
          <div class="info-item">
            <span class="label">Is WebView:</span>
            <span class="value">{{ isWebView() ? '📱 Yes' : '🖥️ No' }}</span>
          </div>
          <div class="info-item">
            <span class="label">Protocol:</span>
            <span class="value">{{ currentProtocol }}</span>
          </div>
          <div class="info-item">
            <span class="label">User Agent:</span>
            <span class="value" style="font-size: 10px; word-break: break-all;">{{ userAgentSlice }}</span>
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

      <!-- WebView Debug Panel -->
      <div class="webview-debug" v-if="isWebView()">
        <h3>🤖 WebView Debug Panel</h3>
        <div class="debug-controls">
          <button @click="runWebViewDiagnostics" class="btn btn-secondary">
            🔧 Run WebView Diagnostics
          </button>
          <button @click="testAndroidBridge" class="btn btn-secondary" v-if="androidInterfaceAvailable.includes('✅')">
            📱 Test Android Bridge
          </button>
          <button @click="exportDebugLog" class="btn btn-secondary">
            📋 Export Debug Log
          </button>
          <button @click="clearDebugLog" class="btn btn-outline">
            🗑️ Clear Log
          </button>
        </div>
        
        <div class="webview-info">
          <h4>📊 WebView Information</h4>
          <div class="webview-info-grid">
            <div class="info-item">
              <span class="label">Chrome Version:</span>
              <span class="value">{{ getChromeVersion() }}</span>
            </div>
            <div class="info-item">
              <span class="label">Android Interface:</span>
              <span class="value">{{ androidInterfaceAvailable }}</span>
            </div>
            <div class="info-item">
              <span class="label">Screen Size:</span>
              <span class="value">{{ currentScreenInfo }}</span>
            </div>
            <div class="info-item">
              <span class="label">Pixel Ratio:</span>
              <span class="value">{{ currentPixelRatio }}</span>
            </div>
          </div>
        </div>

        <div class="debug-log" v-if="debugLog.length > 0">
          <h4>📝 Debug Log (Last {{ Math.min(debugLog.length, 10) }} entries)</h4>
          <div class="log-entries">
            <div v-for="(entry, index) in debugLog.slice(-10)" :key="index" 
                 class="log-entry" :class="entry.type">
              <span class="timestamp">{{ entry.timestamp }}</span>
              <span class="message">{{ entry.message }}</span>
            </div>
          </div>
        </div>
        
        <div v-else class="no-logs">
          <p>📝 No debug logs yet. Click "Run WebView Diagnostics" to start logging.</p>
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

      // WebView debugging
      debugLog: [],
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
    },

    currentProtocol() {
      return typeof window !== 'undefined' ? window.location.protocol : 'unknown';
    },

    userAgentSlice() {
      return typeof navigator !== 'undefined' ? `${navigator.userAgent.slice(0, 100)}...` : 'Unknown';
    },

    androidInterfaceAvailable() {
      return typeof window !== 'undefined' && typeof window.Android !== 'undefined' ? '✅ Available' : '❌ Not Available';
    },

    currentScreenInfo() {
      return typeof screen !== 'undefined' ? `${screen.width}×${screen.height}` : 'Unknown';
    },

    currentPixelRatio() {
      return typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 'Unknown';
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
    // WebView Detection and Debugging
    isWebView() {
      const userAgent = navigator.userAgent || '';
      // Check for common WebView indicators
      return userAgent.includes('wv') || // Android WebView
             userAgent.includes('Version/') && userAgent.includes('Mobile Safari') && !userAgent.includes('CriOS') || // iOS WebView
             window.chrome && !window.chrome.app || // Chrome WebView
             typeof window.orientation !== 'undefined' && !window.MSStream; // Mobile device check
    },

    getChromeVersion() {
      const userAgent = navigator.userAgent;
      const match = userAgent.match(/Chrome\/(\d+)/);
      return match ? match[1] : 'Unknown';
    },

    addDebugLog(message, type = 'info') {
      const timestamp = new Date().toLocaleTimeString();
      this.debugLog.push({ timestamp, message, type });
      console.log(`[${timestamp}] ${message}`);
      
      // Keep only last 50 entries to prevent memory issues
      if (this.debugLog.length > 50) {
        this.debugLog = this.debugLog.slice(-50);
      }
    },

    getWebViewDebugInfo() {
      return {
        userAgent: navigator.userAgent,
        isWebView: this.isWebView(),
        protocol: window.location.protocol,
        origin: window.location.origin,
        chromeVersion: this.getChromeVersion(),
        androidInterface: typeof window.Android !== 'undefined',
        screen: {
          width: screen.width,
          height: screen.height,
          pixelRatio: window.devicePixelRatio
        },
        permissions: this.permissionStatus,
        mediaDevices: {
          available: !!navigator.mediaDevices,
          getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
          enumerateDevices: !!(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices)
        }
      };
    },

    logWebViewDebugInfo() {
      const debugInfo = this.getWebViewDebugInfo();
      this.addDebugLog('🎥 Starting camera...', 'info');
      this.addDebugLog(`📊 WebView Debug Info: ${JSON.stringify(debugInfo, null, 2)}`, 'info');
      
      if (debugInfo.isWebView) {
        this.addDebugLog('🤖 WebView detected - applying WebView-specific configurations', 'info');
        this.addDebugLog(`🔧 Android interface available: ${debugInfo.androidInterface}`, 'info');
        this.addDebugLog(`🏗️ Chrome version: ${debugInfo.chromeVersion}`, 'info');
        
        // WebView specific warnings
        if (debugInfo.protocol !== 'https:' && debugInfo.origin !== 'http://localhost' && !debugInfo.origin.includes('127.0.0.1')) {
          this.addDebugLog('⚠️ WebView camera access may require HTTPS for production', 'warning');
        }
        
        if (debugInfo.chromeVersion && parseInt(debugInfo.chromeVersion) < 70) {
          this.addDebugLog('⚠️ Old Chrome version detected. Camera support may be limited', 'warning');
        }
      }
    },

    async runWebViewDiagnostics() {
      this.addDebugLog('🔍 Running WebView diagnostics...', 'info');
      
      // Test basic WebView detection
      this.addDebugLog(`WebView detected: ${this.isWebView()}`, 'info');
      
      // Test Chrome version
      const chromeVersion = this.getChromeVersion();
      this.addDebugLog(`Chrome version: ${chromeVersion}`, 'info');
      
      // Test media device support
      this.addDebugLog(`MediaDevices available: ${!!navigator.mediaDevices}`, 'info');
      this.addDebugLog(`getUserMedia available: ${!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)}`, 'info');
      
      // Test Android bridge
      if (typeof window.Android !== 'undefined') {
        this.addDebugLog('Android bridge is available', 'success');
        try {
          // Test if Android bridge methods are callable
          if (typeof window.Android.showToast === 'function') {
            this.addDebugLog('Android.showToast method is available', 'success');
          }
        } catch (error) {
          this.addDebugLog(`Android bridge test failed: ${error.message}`, 'error');
        }
      } else {
        this.addDebugLog('Android bridge is not available', 'warning');
      }
      
      // Test camera enumeration
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const cameras = devices.filter(device => device.kind === 'videoinput');
          this.addDebugLog(`Found ${cameras.length} camera devices`, 'success');
          cameras.forEach((camera, index) => {
            this.addDebugLog(`Camera ${index + 1}: ${camera.label || 'No label'} (${camera.deviceId.slice(0, 8)}...)`, 'info');
          });
        }
      } catch (error) {
        this.addDebugLog(`Camera enumeration failed: ${error.message}`, 'error');
      }
      
      // Test permissions
      try {
        if ('permissions' in navigator) {
          const permission = await navigator.permissions.query({ name: 'camera' });
          this.addDebugLog(`Camera permission status: ${permission.state}`, 'info');
        }
      } catch (error) {
        this.addDebugLog(`Permission check failed: ${error.message}`, 'error');
      }
      
      this.addDebugLog('✅ WebView diagnostics complete', 'success');
    },

    testAndroidBridge() {
      if (typeof window.Android !== 'undefined') {
        try {
          if (typeof window.Android.showToast === 'function') {
            window.Android.showToast('Camera WebView Test - Android Bridge Working!');
            this.addDebugLog('✅ Android bridge test successful', 'success');
          } else {
            this.addDebugLog('❌ Android.showToast method not available', 'error');
          }
        } catch (error) {
          this.addDebugLog(`❌ Android bridge test failed: ${error.message}`, 'error');
        }
      } else {
        this.addDebugLog('❌ Android bridge not available', 'error');
      }
    },

    exportDebugLog() {
      const logData = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        debugInfo: this.getWebViewDebugInfo(),
        logs: this.debugLog
      };
      
      const dataStr = JSON.stringify(logData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `webview-camera-debug-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.addDebugLog('📋 Debug log exported successfully', 'success');
    },

    clearDebugLog() {
      this.debugLog = [];
      this.addDebugLog('🗑️ Debug log cleared', 'info');
    },

    getWebViewCompatibleConstraints() {
      const constraints = {
        video: {
          // WebView-specific optimizations
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 30, max: 30 }
        }
      };

      // Only add deviceId constraint if it's not 'default'
      if (this.selectedCameraId && this.selectedCameraId !== 'default') {
        // Use 'ideal' instead of 'exact' for better WebView compatibility
        constraints.video.deviceId = this.isWebView() 
          ? { ideal: this.selectedCameraId }
          : { exact: this.selectedCameraId };
      }

      // Apply resolution constraints with WebView fallbacks
      if (this.selectedResolution !== 'auto') {
        const resolutions = {
          '480p': { width: 640, height: 480 },
          '720p': { width: 1280, height: 720 },
          '1080p': { width: 1920, height: 1080 }
        };
        
        const resolution = resolutions[this.selectedResolution];
        if (resolution) {
          if (this.isWebView()) {
            // Use 'ideal' for WebView compatibility
            constraints.video.width = { ideal: resolution.width };
            constraints.video.height = { ideal: resolution.height };
          } else {
            constraints.video.width = { ideal: resolution.width };
            constraints.video.height = { ideal: resolution.height };
          }
        }
      }

      return constraints;
    },

    handleCameraErrorWithWebViewSupport(error) {
      this.addDebugLog(`❌ Camera error: ${error.name} - ${error.message}`, 'error');
      this.addDebugLog(`📋 Detailed error analysis: ${JSON.stringify({
        name: error.name,
        message: error.message,
        isWebView: this.isWebView(),
        debugInfo: this.getWebViewDebugInfo()
      }, null, 2)}`, 'error');

      switch (error.name) {
        case 'NotAllowedError':
          if (this.isWebView()) {
            this.error = 'Camera access denied. WebView may need camera permissions enabled in the app settings. Check Android app permissions.';
          } else {
            this.error = 'Camera access denied. Please grant permission and try again.';
          }
          break;
        case 'NotFoundError':
          this.error = 'No camera found on this device.';
          break;
        case 'NotSupportedError':
          if (this.isWebView()) {
            this.error = 'Camera not supported in this WebView. The app may need to update WebView settings or use a newer Android System WebView.';
          } else {
            this.error = 'Camera not supported by this browser.';
          }
          break;
        case 'OverconstrainedError':
          this.error = 'Camera constraints not supported. Try a different resolution or camera.';
          break;
        case 'SecurityError':
          this.error = 'Security error: Camera access blocked. Check HTTPS/localhost requirements.';
          break;
        default:
          if (error.message.includes('timeout')) {
            this.error = 'Camera startup timeout. This may be a WebView issue - try restarting the app.';
          } else {
            this.error = `Camera error: ${error.message}`;
          }
      }

      // Log WebView specific troubleshooting info
      if (this.isWebView()) {
        this.addDebugLog('🔧 WebView Troubleshooting Tips:', 'info');
        this.addDebugLog('1. Check Android app has CAMERA permission in manifest', 'info');
        this.addDebugLog('2. Ensure WebView has camera access enabled', 'info');
        this.addDebugLog('3. Update Android System WebView if possible', 'info');
        this.addDebugLog('4. Test with HTTPS URL for production', 'info');
        this.addDebugLog('5. Check if hardware acceleration is enabled', 'info');
      }
    },

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
      
      // Log WebView debug information
      this.logWebViewDebugInfo();
      
      try {
        // Double-check browser support before attempting to start camera
        if (!this.checkBrowserSupport()) {
          throw new Error('Camera API not available. Please use HTTPS and a modern browser.');
        }
        
        const constraints = this.getWebViewCompatibleConstraints();
        this.addDebugLog(`📋 Camera constraints: ${JSON.stringify(constraints, null, 2)}`, 'info');
        
        // Add timeout for WebView debugging with longer timeout
        const timeoutDuration = this.isWebView() ? 20000 : 10000; // 20s for WebView, 10s for browser
        const getUserMediaPromise = navigator.mediaDevices.getUserMedia(constraints);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`getUserMedia timeout after ${timeoutDuration/1000} seconds`)), timeoutDuration);
        });
        
        this.addDebugLog('⏳ Requesting camera access...', 'info');
        this.currentStream = await Promise.race([getUserMediaPromise, timeoutPromise]);
        this.addDebugLog('✅ Camera stream obtained', 'success');
        
        // Set up video element
        const video = this.$refs.videoElement;
        video.srcObject = this.currentStream;
        
        // Get track info
        this.currentTrack = this.currentStream.getVideoTracks()[0];
        this.addDebugLog(`📹 Video track: ${this.currentTrack.label || 'No label'}`, 'info');
        this.addDebugLog(`📊 Track settings: ${JSON.stringify(this.currentTrack.getSettings ? this.currentTrack.getSettings() : 'N/A', null, 2)}`, 'info');
        
        this.currentCameraLabel = this.getCurrentCameraLabel();
        
        // Get capabilities (with error handling)
        try {
          if (this.currentTrack.getCapabilities) {
            this.currentCapabilities = this.currentTrack.getCapabilities();
            this.addDebugLog(`🔧 Camera capabilities: ${JSON.stringify(this.currentCapabilities, null, 2)}`, 'info');
          }
        } catch (capError) {
          this.addDebugLog(`⚠️ Could not get camera capabilities: ${capError.message}`, 'warning');
          this.currentCapabilities = null;
        }
        
        // Wait for video to load with timeout
        this.addDebugLog('⏱️ Waiting for video metadata...', 'info');
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Video metadata timeout'));
          }, 10000);
          
          video.addEventListener('loadedmetadata', () => {
            clearTimeout(timeout);
            resolve();
          }, { once: true });
        });
        this.addDebugLog('📺 Video metadata loaded', 'success');
        
        // Update resolution info
        this.updateResolutionInfo();
        this.addDebugLog(`📐 Final resolution: ${this.currentResolution}`, 'info');
        
        // Start FPS monitoring
        this.startFpsMonitoring();
        
        this.isCameraActive = true;
        this.addDebugLog('🎉 Camera started successfully', 'success');
        
        // Re-enumerate devices to get updated labels (with error handling)
        try {
          await this.enumerateDevices();
        } catch (enumError) {
          this.addDebugLog(`⚠️ Could not re-enumerate devices: ${enumError.message}`, 'warning');
        }
        
      } catch (error) {
        this.addDebugLog(`❌ Error starting camera: ${error.message}`, 'error');
        this.handleCameraErrorWithWebViewSupport(error);
      } finally {
        this.isLoading = false;
      }
    },
    
    stopCamera() {
      if (this.currentStream) {
        this.currentStream.getTracks().forEach(track => track.stop());
        this.currentStream = null;
        this.addDebugLog('📴 Camera stopped', 'info');
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
      // This method is now replaced by getWebViewCompatibleConstraints()
      // Keep for backward compatibility
      return this.getWebViewCompatibleConstraints();
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
    
    isWebView() {
      const userAgent = navigator.userAgent || '';
      // Check for common WebView indicators
      return userAgent.includes('wv') || // Android WebView
             userAgent.includes('Version/') && userAgent.includes('Mobile Safari') && !userAgent.includes('CriOS') || // iOS WebView
             window.chrome && !window.chrome.app || // Chrome WebView
             typeof window.orientation !== 'undefined' && !window.MSStream; // Mobile device check
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

/* WebView Debug Panel Styles */
.webview-debug {
  grid-column: 1 / -1;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #e9ecef;
  margin-top: 20px;
}

.webview-debug h3 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 18px;
}

.webview-debug h4 {
  color: #34495e;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
}

.debug-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.btn-outline {
  background: transparent;
  color: #6c757d;
  border: 2px solid #6c757d;
}

.btn-outline:hover:not(:disabled) {
  background: #6c757d;
  color: white;
}

.webview-info {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #dee2e6;
}

.webview-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.debug-log {
  background: #2c3e50;
  border-radius: 8px;
  padding: 15px;
  color: white;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.debug-log h4 {
  color: #ecf0f1;
  margin-bottom: 10px;
  font-size: 14px;
}

.log-entries {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.log-entry {
  display: flex;
  gap: 10px;
  padding: 5px 8px;
  border-radius: 4px;
  line-height: 1.4;
}

.log-entry.info {
  background: rgba(52, 152, 219, 0.1);
  border-left: 3px solid #3498db;
}

.log-entry.success {
  background: rgba(46, 204, 113, 0.1);
  border-left: 3px solid #2ecc71;
}

.log-entry.warning {
  background: rgba(241, 196, 15, 0.1);
  border-left: 3px solid #f1c40f;
}

.log-entry.error {
  background: rgba(231, 76, 60, 0.1);
  border-left: 3px solid #e74c3c;
}

.log-entry .timestamp {
  color: #95a5a6;
  flex-shrink: 0;
  font-size: 11px;
  min-width: 70px;
}

.log-entry .message {
  flex: 1;
  word-break: break-word;
  white-space: pre-wrap;
}

.no-logs {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  color: #6c757d;
  border: 1px solid #dee2e6;
}

.no-logs p {
  margin: 0;
  font-style: italic;
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
  
  .debug-controls {
    flex-direction: column;
  }
  
  .webview-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
