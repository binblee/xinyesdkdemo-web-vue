<template>
  <div class="microphone-test-demo">
    <!-- Back Button -->
    <BackButton />
    
    <div class="header">
      <h2>🎤 麦克风测试演示</h2>
      <p>测试麦克风访问、录音和音频质量</p>
    </div>

    <!-- Audio Visualization Area -->
    <div class="audio-visualization-container">
      <div class="vu-meter-wrapper">
        <label>音量表:</label>
        <progress ref="vuMeter" max="100" value="0"></progress>
        <span class="vu-value">{{ vuMeterLevel.toFixed(2) }}%</span>
      </div>
      <div class="waveform-wrapper">
        <label>波形:</label>
        <canvas ref="waveformCanvas" width="300" height="100"></canvas>
      </div>
    </div>

    <!-- Controls Panel -->
    <div class="controls-panel">
      <div class="basic-controls">
        <button @click="startMicrophone" :disabled="isLoading || isMicrophoneActive" class="btn btn-primary">
          {{ isLoading ? '启动中...' : '启动麦克风' }}
        </button>
        <button @click="stopMicrophone" :disabled="!isMicrophoneActive" class="btn btn-secondary">
          停止麦克风
        </button>
        <select v-model="selectedMicrophoneId" @change="switchMicrophone" :disabled="!availableMicrophones.length || isLoading || isMicrophoneActive" class="microphone-select">
          <option value="" disabled>选择麦克风</option>
          <option v-for="mic in availableMicrophones" :key="mic.deviceId" :value="mic.deviceId">
            {{ mic.label || `麦克风 ${mic.deviceId.slice(0, 8)}...` }}
          </option>
        </select>
      </div>

      <div class="recording-controls" v-if="isMicrophoneActive">
        <h4>🎙️ 录音</h4>
        <button @click="startRecording(5000)" :disabled="isRecording" class="btn btn-success">录制5秒</button>
        <button @click="startRecording(10000)" :disabled="isRecording" class="btn btn-success">录制10秒</button>
        <button @click="startRecording(30000)" :disabled="isRecording" class="btn btn-success">录制30秒</button>
        <button @click="stopRecording" :disabled="!isRecording" class="btn btn-warning">停止录音</button>
        <div v-if="recordedAudioUrl" class="playback-controls">
          <audio :src="recordedAudioUrl" controls></audio>
          <button @click="downloadRecording" class="btn btn-info">下载录音</button>
        </div>
        <p v-if="isRecording">正在录制 {{ (recordingDuration / 1000).toFixed(0) }}秒... 剩余 {{ (recordingTimeLeft / 1000).toFixed(1) }}秒</p>
      </div>
    </div>

    <!-- Status & Information Panel -->
    <div class="status-panel">
      <div class="device-info">
        <h3>📊 音频设备信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">可用麦克风:</span>
            <span class="value">{{ availableMicrophones.length }}</span>
          </div>
          <div class="info-item">
            <span class="label">浏览器支持:</span>
            <span class="value">{{ browserSupport ? '✅ 支持' : '❌ 不支持' }}</span>
          </div>
          <div class="info-item">
            <span class="label">权限状态:</span>
            <span class="value">{{ permissionStatus }}</span>
          </div>
          <div class="info-item">
            <span class="label">当前麦克风:</span>
            <span class="value">{{ currentMicrophoneLabel }}</span>
          </div>
          <div class="info-item">
            <span class="label">采样率:</span>
            <span class="value">{{ sampleRate ? sampleRate + ' Hz' : '不适用' }}</span>
          </div>
          <div class="info-item">
            <span class="label">位深度:</span>
            <span class="value">{{ bitDepth ? bitDepth + '-bit' : '不适用 (浏览器通常为16位或24位)' }}</span>
          </div>
        </div>
      </div>
      <div v-if="error" class="error-state">
        <p class="error-message">❌ {{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import BackButton from './BackButton.vue'

export default {
  name: 'MicrophoneTestDemo',
  components: {
    BackButton
  },
  data() {
    return {
      // Audio state
      isMicrophoneActive: false,
      isLoading: false,
      error: null,
      
      // Audio devices
      availableMicrophones: [],
      selectedMicrophoneId: '',
      currentMicrophoneLabel: '',
      
      // Audio stream & context
      currentStream: null,
      audioContext: null,
      analyserNode: null,
      microphoneStreamSource: null,
      
      // Visualization
      vuMeterLevel: 0,
      waveformCanvasCtx: null,
      animationFrameId: null,
      
      // Recording
      mediaRecorder: null,
      audioChunks: [],
      recordedAudioUrl: null,
      isRecording: false,
      recordingDuration: 0,
      recordingTimeLeft: 0,
      recordingTimer: null,

      // Info
      sampleRate: null,
      bitDepth: null, // Note: Bit depth is not directly exposed by Web Audio API for input.
      
      // Support & permissions
      browserSupport: false,
      permissionStatus: '未知',
    };
  },
  
  async mounted() {
    this.browserSupport = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    if (this.browserSupport) {
      await this.checkPermissions();
      await this.enumerateDevices();
      if (this.$refs.waveformCanvas) {
        this.waveformCanvasCtx = this.$refs.waveformCanvas.getContext('2d');
      }
    } else {
      this.error = '此浏览器不支持音频访问。请使用支持HTTPS的现代浏览器。';
    }
  },
  
  beforeUnmount() {
    this.stopMicrophone();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
    }
  },
  
  methods: {
    async checkPermissions() {
      try {
        if ('permissions' in navigator) {
          const permission = await navigator.permissions.query({ name: 'microphone' });
          this.permissionStatus = permission.state;
          permission.onchange = () => {
            this.permissionStatus = permission.state;
            if (permission.state === 'denied') {
              this.error = '麦克风权限被拒绝。';
              this.stopMicrophone();
            }
          };
        }
      } catch (e) {
        console.warn('Could not check microphone permissions:', e);
        this.permissionStatus = '权限检查错误';
      }
    },

    async enumerateDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        this.availableMicrophones = devices.filter(device => device.kind === 'audioinput');
        if (this.availableMicrophones.length > 0 && !this.selectedMicrophoneId) {
          this.selectedMicrophoneId = this.availableMicrophones[0].deviceId;
        } else if (this.availableMicrophones.length === 0) {
          this.error = '未找到麦克风。';
        }
      } catch (e) {
        this.handleAudioError(e, '枚举音频设备时出错');
      }
    },

    async startMicrophone() {
      if (this.isLoading || this.isMicrophoneActive) return;
      
      this.isLoading = true;
      this.error = null;
      this.vuMeterLevel = 0;
      if (this.$refs.vuMeter) this.$refs.vuMeter.value = 0;

      try {
        if (!this.browserSupport) {
          throw new Error('此浏览器不支持getUserMedia。');
        }
        if (this.permissionStatus === 'denied') {
          throw new Error('麦克风权限被拒绝。请在浏览器设置中授予权限。');
        }

        const constraints = {
          audio: {
            deviceId: this.selectedMicrophoneId ? { exact: this.selectedMicrophoneId } : undefined,
            // Common sample rates. Browsers usually handle resampling.
            // sampleRate: { ideal: 48000 }, 
            // echoCancellation: true, // Default is often true
            // noiseSuppression: true, // Default is often true
            // autoGainControl: true   // Default is often true
          }
        };
        
        this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        const selectedDevice = this.availableMicrophones.find(mic => mic.deviceId === this.selectedMicrophoneId);
        this.currentMicrophoneLabel = selectedDevice ? selectedDevice.label : '默认麦克风';

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sampleRate = this.audioContext.sampleRate;
        // Bit depth is not directly available. Assume 16 or 24 based on typical browser behavior.
        this.bitDepth = null; 

        this.microphoneStreamSource = this.audioContext.createMediaStreamSource(this.currentStream);
        this.analyserNode = this.audioContext.createAnalyser();
        this.analyserNode.fftSize = 2048; // For waveform and VU meter data
        
        this.microphoneStreamSource.connect(this.analyserNode);
        // Do not connect analyserNode to destination to avoid feedback loop if not intended for playback.
        
        this.isMicrophoneActive = true;
        this.visualizeAudio();

      } catch (e) {
        this.handleAudioError(e, '启动麦克风时出错');
      } finally {
        this.isLoading = false;
      }
    },

    stopMicrophone() {
      if (this.currentStream) {
        this.currentStream.getTracks().forEach(track => track.stop());
        this.currentStream = null;
      }
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close();
        this.audioContext = null;
      }
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      if (this.isRecording) {
        this.stopRecording();
      }
      this.isMicrophoneActive = false;
      this.isLoading = false;
      this.currentMicrophoneLabel = '';
      this.sampleRate = null;
      this.vuMeterLevel = 0;
      if (this.$refs.vuMeter) this.$refs.vuMeter.value = 0;
      if (this.waveformCanvasCtx) {
        this.waveformCanvasCtx.clearRect(0, 0, this.waveformCanvasCtx.canvas.width, this.waveformCanvasCtx.canvas.height);
      }
    },

    async switchMicrophone() {
      this.stopMicrophone();
      // Short delay to ensure resources are released before starting new device
      setTimeout(async () => {
        await this.startMicrophone();
      }, 100);
    },

    visualizeAudio() {
      if (!this.isMicrophoneActive || !this.analyserNode || !this.waveformCanvasCtx) return;

      const bufferLength = this.analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!this.isMicrophoneActive || !this.analyserNode) return; // Stop if microphone stopped

        this.analyserNode.getByteTimeDomainData(dataArray); // For waveform
        // Or use getByteFrequencyData(dataArray) for frequency spectrum

        // VU Meter (based on max amplitude in the current buffer)
        let sumSquares = 0.0;
        for (const amplitude of dataArray) {
          const normalizedAmplitude = (amplitude / 128.0) - 1.0; // Convert 0-255 to -1.0 to 1.0
          sumSquares += normalizedAmplitude * normalizedAmplitude;
        }
        const rms = Math.sqrt(sumSquares / bufferLength);
        this.vuMeterLevel = Math.min(100, Math.max(0, rms * 300)); // Scale factor for display
        if (this.$refs.vuMeter) this.$refs.vuMeter.value = this.vuMeterLevel;


        // Waveform
        this.waveformCanvasCtx.fillStyle = 'rgb(240, 240, 240)';
        this.waveformCanvasCtx.fillRect(0, 0, this.waveformCanvasCtx.canvas.width, this.waveformCanvasCtx.canvas.height);
        this.waveformCanvasCtx.lineWidth = 2;
        this.waveformCanvasCtx.strokeStyle = 'rgb(0, 123, 255)';
        this.waveformCanvasCtx.beginPath();

        const sliceWidth = this.waveformCanvasCtx.canvas.width * 1.0 / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0; // Normalize to 0-2 range
          const y = v * this.waveformCanvasCtx.canvas.height / 2;

          if (i === 0) {
            this.waveformCanvasCtx.moveTo(x, y);
          } else {
            this.waveformCanvasCtx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        this.waveformCanvasCtx.lineTo(this.waveformCanvasCtx.canvas.width, this.waveformCanvasCtx.canvas.height / 2);
        this.waveformCanvasCtx.stroke();
        
        this.animationFrameId = requestAnimationFrame(draw);
      };
      draw();
    },

    startRecording(duration) {
      if (!this.isMicrophoneActive || this.isRecording || !this.currentStream) {
        this.error = "麦克风未启动或已在录音中。";
        return;
      }
      this.isRecording = true;
      this.recordingDuration = duration;
      this.recordingTimeLeft = duration;
      this.audioChunks = [];
      this.recordedAudioUrl = null;

      try {
        // Determine a suitable MIME type
        let mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/ogg;codecs=opus';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/wav'; // Fallback, though less common for direct recording
             if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = ''; // Let the browser decide
             }
          }
        }
        
        this.mediaRecorder = new MediaRecorder(this.currentStream, { mimeType });
        
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType });
          this.recordedAudioUrl = URL.createObjectURL(audioBlob);
          this.isRecording = false;
          clearInterval(this.recordingTimer);
          this.recordingTimeLeft = 0;
        };

        this.mediaRecorder.start();
        
        this.recordingTimer = setInterval(() => {
          this.recordingTimeLeft -= 100;
          if (this.recordingTimeLeft <= 0) {
            this.stopRecording();
          }
        }, 100);

        setTimeout(() => {
          if (this.isRecording && this.mediaRecorder.state === "recording") {
            this.stopRecording();
          }
        }, duration);

      } catch (e) {
        this.handleAudioError(e, '启动录音时出错');
        this.isRecording = false;
      }
    },

    stopRecording() {
      if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
        this.mediaRecorder.stop();
      }
      clearInterval(this.recordingTimer);
      this.isRecording = false;
    },
    
    downloadRecording() {
      if (!this.recordedAudioUrl) return;
      const link = document.createElement('a');
      link.href = this.recordedAudioUrl;
      const fileExtension = (this.mediaRecorder?.mimeType?.includes('webm') ? 'webm' : (this.mediaRecorder?.mimeType?.includes('ogg') ? 'ogg' : 'wav'));
      link.download = `recording-${new Date().toISOString()}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(this.recordedAudioUrl); // Clean up blob URL after a delay
    },

    handleAudioError(e, contextMessage = '发生音频错误') {
      console.error(contextMessage, e);
      let displayError = `${contextMessage}: ${e.message}`;
      if (e.name) {
        displayError = `${contextMessage}: ${e.name} - ${e.message}`;
      }
      
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        this.error = '麦克风访问被拒绝。请在浏览器设置中授予权限。';
        this.permissionStatus = 'denied';
      } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        this.error = '未找到麦克风或所选麦克风不可用。';
      } else if (e.name === 'NotReadableError' || e.name === 'TrackStartError') {
        this.error = '麦克风正在被其他应用使用或发生硬件错误。';
      } else if (e.name === 'OverconstrainedError') {
        this.error = `所选麦克风不支持请求的设置（例如采样率）。详情: ${e.constraint}`;
      } else if (e.name === 'SecurityError') {
        this.error = '由于安全设置（例如非HTTPS）麦克风访问被拒绝。';
      } else {
        this.error = displayError;
      }
      this.stopMicrophone(); // Ensure cleanup on error
    },
  }
};
</script>

<style scoped>
.microphone-test-demo {
  max-width: 100%;
  margin: 0 auto;
  padding: 20px;
  background: #ffffff;
  min-height: 100vh;
  box-sizing: border-box;
  overflow-x: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f4f7f6;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.header {
  text-align: center;
  margin-bottom: 25px;
  color: #333;
}
.header h2 {
  margin: 0 0 5px 0;
  font-size: 1.8em;
}
.header p {
  margin: 0;
  font-size: 1em;
  color: #666;
}

.audio-visualization-container {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fff;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}
.vu-meter-wrapper, .waveform-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.vu-meter-wrapper label, .waveform-wrapper label {
  font-size: 0.9em;
  color: #555;
  margin-bottom: 5px;
}
.vu-meter-wrapper progress {
  width: 150px;
  height: 20px;
  border-radius: 10px;
  overflow: hidden;
}
.vu-meter-wrapper progress::-webkit-progress-bar {
  background-color: #eee;
}
.vu-meter-wrapper progress::-webkit-progress-value {
  background-color: #007bff;
}
.vu-meter-wrapper progress::-moz-progress-bar {
  background-color: #007bff;
}
.vu-value {
  font-size: 0.8em;
  color: #333;
  margin-top: 3px;
}
.waveform-wrapper canvas {
  border: 1px solid #ccc;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.controls-panel {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 6px;
  margin-bottom: 20px;
  box-shadow: 0 1px 5px rgba(0,0,0,0.05);
}
.basic-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.microphone-select {
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background-color: white;
  flex-grow: 1;
  min-width: 150px;
}

.recording-controls {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}
.recording-controls h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.1em;
  color: #333;
}
.recording-controls button {
  margin-right: 8px;
  margin-bottom: 8px;
}
.playback-controls {
  margin-top: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.playback-controls audio {
  flex-grow: 1;
}
.recording-controls p {
  font-size: 0.9em;
  color: #555;
  margin-top: 10px;
}

.status-panel {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 6px;
  box-shadow: 0 1px 5px rgba(0,0,0,0.05);
}
.device-info h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.2em;
  color: #333;
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 10px;
}
.info-item {
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #e7e7e7;
}
.info-item .label {
  font-weight: bold;
  color: #555;
  display: block;
  margin-bottom: 3px;
}
.info-item .value {
  color: #333;
  font-size: 0.95em;
}

.error-state {
  margin-top: 15px;
  padding: 10px;
  background-color: #ffebee;
  color: #c62828;
  border: 1px solid #ef9a9a;
  border-radius: 4px;
}
.error-message {
  margin: 0;
}

.btn {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95em;
  transition: background-color 0.2s ease;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-primary { background-color: #007bff; color: white; }
.btn-primary:hover:not(:disabled) { background-color: #0056b3; }
.btn-secondary { background-color: #6c757d; color: white; }
.btn-secondary:hover:not(:disabled) { background-color: #545b62; }
.btn-success { background-color: #28a745; color: white; }
.btn-success:hover:not(:disabled) { background-color: #1e7e34; }
.btn-warning { background-color: #ffc107; color: #212529; }
.btn-warning:hover:not(:disabled) { background-color: #d39e00; }
.btn-info { background-color: #17a2b8; color: white; }
.btn-info:hover:not(:disabled) { background-color: #117a8b; }

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .microphone-test-demo {
    padding: 10px;
    font-size: 14px;
    border-radius: 0;
    min-height: 100vh;
  }
  
  .header h2 {
    font-size: 1.5em;
    margin-bottom: 5px;
  }
  
  .header p {
    font-size: 0.9em;
  }
  
  .audio-visualization-container {
    flex-direction: column;
    gap: 15px;
    padding: 12px;
    margin-bottom: 15px;
  }
  
  .vu-meter-wrapper, .waveform-wrapper {
    width: 100%;
  }
  
  .vu-meter-wrapper progress {
    width: 100%;
    max-width: 280px;
    height: 24px;
  }
  
  .waveform-wrapper canvas {
    width: 100%;
    max-width: 280px;
    height: 80px;
  }
  
  .controls-panel {
    padding: 15px;
    margin-bottom: 15px;
  }
  
  .basic-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    margin-bottom: 15px;
  }
  
  .btn {
    width: 100%;
    padding: 14px 20px;
    font-size: 16px;
    touch-action: manipulation;
    margin-bottom: 0;
  }
  
  .microphone-select {
    width: 100%;
    padding: 14px 15px;
    font-size: 16px;
    min-width: unset;
    flex-grow: unset;
  }
  
  .recording-controls {
    margin-top: 15px;
    padding-top: 15px;
  }
  
  .recording-controls h4 {
    font-size: 1em;
    margin-bottom: 10px;
  }
  
  .recording-controls button {
    width: 100%;
    margin-right: 0;
    margin-bottom: 10px;
    padding: 12px 20px;
    font-size: 15px;
  }
  
  .playback-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .playback-controls audio {
    width: 100%;
    height: 40px;
  }
  
  .status-panel {
    padding: 15px;
  }
  
  .device-info h3 {
    font-size: 1.1em;
    margin-bottom: 12px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .info-item {
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .info-item .label {
    font-size: 12px;
    margin-bottom: 2px;
  }
  
  .info-item .value {
    font-size: 13px;
    word-break: break-all;
  }
  
  .error-state {
    padding: 12px;
    margin-top: 12px;
  }
  
  .error-message {
    font-size: 14px;
  }
  
  .recording-controls p {
    font-size: 14px;
    text-align: center;
    background: #e3f2fd;
    padding: 10px;
    border-radius: 4px;
    border: 1px solid #bbdefb;
  }
}

/* Additional mobile optimizations for very small screens */
@media (max-width: 480px) {
  .microphone-test-demo {
    padding: 8px;
  }
  
  .header {
    margin-bottom: 15px;
  }
  
  .header h2 {
    font-size: 1.3em;
  }
  
  .audio-visualization-container {
    padding: 10px;
    gap: 12px;
  }
  
  .vu-meter-wrapper progress {
    height: 20px;
  }
  
  .waveform-wrapper canvas {
    height: 60px;
  }
  
  .controls-panel {
    padding: 12px;
  }
  
  .btn {
    padding: 12px 16px;
    font-size: 15px;
  }
  
  .recording-controls button {
    padding: 10px 16px;
    font-size: 14px;
  }
  
  .status-panel {
    padding: 12px;
  }
  
  .info-item {
    padding: 10px;
  }
}

/* Landscape mode optimizations for mobile */
@media (max-width: 768px) and (orientation: landscape) {
  .audio-visualization-container {
    flex-direction: row;
    justify-content: space-around;
  }
  
  .vu-meter-wrapper, .waveform-wrapper {
    width: auto;
  }
  
  .vu-meter-wrapper progress {
    width: 150px;
  }
  
  .waveform-wrapper canvas {
    width: 200px;
    height: 60px;
  }
  
  .basic-controls {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .btn {
    flex: 1;
    min-width: 120px;
  }
  
  .microphone-select {
    flex: 2;
    min-width: 200px;
  }
}

/* WebView specific optimizations */
@media (max-width: 768px) {
  .controls-panel, .status-panel {
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }
  
  .btn {
    -webkit-appearance: none;
    border: 1px solid transparent;
  }
  
  .microphone-select {
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 16px;
    padding-right: 40px;
  }
}

</style>
