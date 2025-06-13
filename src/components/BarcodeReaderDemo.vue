<template>
  <div class="barcode-reader-container">
    <!-- Header -->
    <div class="header">
      <h2>📱 扫码器测试</h2>
    </div>

    <!-- Main Scanner Area -->
    <div 
      class="scanner-area" 
      tabindex="0" 
      @keydown="handleKeyDown"
      @focus="onScannerFocus"
      @blur="onScannerBlur"
      ref="scannerArea"
    >
      <!-- Scan Status Display -->
      <div class="scan-display">
        <div v-if="lastScan" class="scan-result">
          <div class="scanned-code">{{ lastScan.data }}</div>
          <div class="scan-info">
            <span class="format-badge" :class="getFormatClass(lastScan.format)">{{ lastScan.format }}</span>
            <span class="confidence-badge" :class="getConfidenceClass(lastScan.confidence)">
              {{ lastScan.confidence }}% confidence
            </span>
            <span class="timestamp">{{ lastScan.timestamp }}</span>
          </div>
          <div class="scan-details">
            <small>Speed: {{ lastScan.speed }} chars/sec • Length: {{ lastScan.data.length }}</small>
          </div>
        </div>
        
        <div v-else class="waiting-indicator">
          <div class="pulse-icon" :class="{ active: isListening }">🔍</div>
          <p>{{ isListening ? 'Ready for barcode scan...' : 'Click here to activate scanner' }}</p>
          <small v-if="!isListening">Page must be focused to detect scanner input</small>
        </div>
      </div>

      <!-- Current Scan Buffer (for debugging) -->
      <div v-if="showDebug && currentBuffer" class="debug-buffer">
        <strong>Buffer:</strong> "{{ currentBuffer }}" ({{ bufferLength }} chars)
      </div>
    </div>

    <!-- Controls -->
    <div class="controls">
      <button @click="clearLastScan" :disabled="!lastScan">清除</button>
      <button @click="toggleDebug">{{ showDebug ? '隐藏' : '显示' }}调试信息</button>
      <button @click="focusScanner">聚焦扫描器</button>
    </div>

    <!-- Debug Panel -->
    <div v-if="showDebug" class="debug-panel">
      <h3>🔧 Scanner Detection Debug</h3>
      
      <div class="debug-stats">
        <div class="stat-item">
          <label>Detection Status:</label>
          <span :class="isListening ? 'status-active' : 'status-inactive'">
            {{ isListening ? 'ACTIVE' : 'INACTIVE' }}
          </span>
        </div>
        <div class="stat-item">
          <label>Total Scans:</label>
          <span>{{ scanHistory.length }}</span>
        </div>
        <div class="stat-item">
          <label>Valid Scans:</label>
          <span>{{ validScans }}</span>
        </div>
        <div class="stat-item">
          <label>Rejected:</label>
          <span>{{ rejectedScans }}</span>
        </div>
      </div>

      <div class="recent-events">
        <h4>Recent Events (Last 10):</h4>
        <div class="event-log">
          <div 
            v-for="event in recentEvents.slice(-10).reverse()" 
            :key="event.id"
            class="event-item"
            :class="event.type"
          >
            <span class="event-time">{{ event.time }}</span>
            <span class="event-type">{{ event.type.toUpperCase() }}</span>
            <span class="event-data">{{ event.data }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed, nextTick } from 'vue';

// Scanner Detection Class
class NoInputFieldScannerDetector {
  constructor() {
    this.buffer = '';
    this.startTime = 0;
    this.keyCount = 0;
    this.timeout = null;
    this.lastKeyTime = 0;
    this.keyIntervals = [];
    this.callbacks = {
      onScan: null,
      onReject: null,
      onDebug: null
    };
  }

  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  processKeyEvent(event) {
    const now = Date.now();
    
    // Prevent all default keyboard behavior on this page
    event.preventDefault();
    event.stopPropagation();

    // Handle termination characters
    if (event.key === 'Enter' || event.key === 'Tab') {
      return this.completeScan(now, 'terminator');
    }

    // Only accept printable characters
    if (event.key.length === 1 && /[\x20-\x7E]/.test(event.key)) {
      return this.addCharacter(event.key, now);
    }

    // Reject non-printable keys
    this.debugLog('reject', `Non-printable key: ${event.key}`);
    return null;
  }

  addCharacter(char, timestamp) {
    // Initialize scan session
    if (this.keyCount === 0) {
      this.startTime = timestamp;
      this.keyIntervals = [];
    }

    // Record timing
    if (this.lastKeyTime > 0) {
      this.keyIntervals.push(timestamp - this.lastKeyTime);
    }
    this.lastKeyTime = timestamp;

    this.buffer += char;
    this.keyCount++;

    this.debugLog('char', `Added: "${char}" (total: ${this.keyCount})`);

    // Auto-complete timer
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.completeScan(Date.now(), 'timeout');
    }, 300); // 300ms silence = end of scan

    return null;
  }

  completeScan(endTime, reason) {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    if (this.buffer.length === 0) {
      this.reset();
      return null;
    }

    const result = this.validateScan(endTime, reason);
    this.debugLog(result.isScanner ? 'scan' : 'reject', 
      `${reason}: "${this.buffer}" → ${result.isScanner ? 'VALID' : 'INVALID'} (${result.confidence}%)`);
    
    const output = {
      ...result,
      reason,
      timestamp: new Date().toLocaleTimeString()
    };

    this.reset();

    // Trigger callbacks
    if (result.isScanner && this.callbacks.onScan) {
      this.callbacks.onScan(output);
    } else if (!result.isScanner && this.callbacks.onReject) {
      this.callbacks.onReject(output);
    }

    return output;
  }

  validateScan(endTime, reason) {
    const totalTime = endTime - this.startTime;
    const speed = this.keyCount > 0 ? (this.keyCount / totalTime) * 1000 : 0; // chars/sec
    const avgInterval = this.keyIntervals.length > 0 
      ? this.keyIntervals.reduce((a, b) => a + b, 0) / this.keyIntervals.length 
      : 0;

    // Scanner detection criteria
    const criteria = {
      minLength: this.buffer.length >= 4,
      maxLength: this.buffer.length <= 100,
      minSpeed: speed >= 10, // At least 10 chars/sec
      maxSpeed: speed <= 200, // Not impossibly fast
      maxTime: totalTime <= 3000, // Max 3 seconds total
      consistentTiming: avgInterval > 0 && avgInterval < 200, // Consistent key intervals
      validChars: /^[A-Z0-9\-\.\s\$\/\+\%\*]+$/i.test(this.buffer), // Valid barcode characters
      notCommonWords: !this.isCommonWord(this.buffer)
    };

    // Calculate confidence score
    let confidence = 0;
    const weights = {
      minLength: 15,
      maxLength: 10,
      minSpeed: 25,
      maxSpeed: 10,
      maxTime: 15,
      consistentTiming: 15,
      validChars: 20,
      notCommonWords: 10
    };

    for (const [criterion, passed] of Object.entries(criteria)) {
      if (passed) {
        confidence += weights[criterion] || 0;
      }
    }

    const isScanner = confidence >= 70; // 70% threshold

    return {
      isScanner,
      data: this.buffer,
      confidence: Math.min(confidence, 100),
      speed: Math.round(speed),
      totalTime,
      keyCount: this.keyCount,
      criteria,
      reason
    };
  }

  isCommonWord(text) {
    const commonWords = ['test', 'hello', 'world', 'admin', 'password', 'user', 'home'];
    return commonWords.includes(text.toLowerCase());
  }

  debugLog(type, message) {
    if (this.callbacks.onDebug) {
      this.callbacks.onDebug({ type, message, timestamp: Date.now() });
    }
  }

  reset() {
    this.buffer = '';
    this.startTime = 0;
    this.keyCount = 0;
    this.lastKeyTime = 0;
    this.keyIntervals = [];
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}

// Component state
const scannerArea = ref(null);
const detector = new NoInputFieldScannerDetector();
const lastScan = ref(null);
const scanHistory = reactive([]);
const recentEvents = reactive([]);
const isListening = ref(false);
const showDebug = ref(false);
const currentBuffer = ref('');
const bufferLength = ref(0);

// Computed values
const validScans = computed(() => scanHistory.filter(scan => scan.isScanner).length);
const rejectedScans = computed(() => scanHistory.filter(scan => !scan.isScanner).length);

// Scanner detector callbacks
detector.setCallbacks({
  onScan: (result) => {
    lastScan.value = {
      data: result.data,
      format: detectBarcodeFormat(result.data),
      confidence: result.confidence,
      speed: result.speed,
      timestamp: result.timestamp
    };
    scanHistory.push(result);
    showNotification('Barcode scanned successfully!', 'success');
  },
  
  onReject: (result) => {
    scanHistory.push(result);
    if (showDebug.value) {
      showNotification(`Rejected: ${result.reason}`, 'warning');
    }
  },
  
  onDebug: (event) => {
    recentEvents.push({
      id: Date.now() + Math.random(),
      type: event.type,
      data: event.message,
      time: new Date(event.timestamp).toLocaleTimeString()
    });
    
    // Update current buffer display
    if (event.type === 'char') {
      currentBuffer.value = detector.buffer;
      bufferLength.value = detector.buffer.length;
    } else if (event.type === 'scan' || event.type === 'reject') {
      currentBuffer.value = '';
      bufferLength.value = 0;
    }
  }
});

// Event handlers
function handleKeyDown(event) {
  if (!isListening.value) return;
  
  const result = detector.processKeyEvent(event);
  // Result is handled by callbacks
}

function onScannerFocus() {
  isListening.value = true;
  showNotification('Scanner activated - ready for input', 'info');
}

function onScannerBlur() {
  isListening.value = false;
  detector.reset();
  currentBuffer.value = '';
  bufferLength.value = 0;
}

function focusScanner() {
  if (scannerArea.value) {
    scannerArea.value.focus();
  }
}

function clearLastScan() {
  lastScan.value = null;
}

function toggleDebug() {
  showDebug.value = !showDebug.value;
}

function getConfidenceClass(confidence) {
  if (confidence >= 80) return 'confidence-high';
  if (confidence >= 60) return 'confidence-medium';
  return 'confidence-low';
}

function getFormatClass(format) {
  if (format.toLowerCase().includes('url') || format.toLowerCase().includes('website') || format.toLowerCase().includes('email')) {
    return 'url';
  }
  if (format.toLowerCase().includes('wifi')) {
    return 'wifi';
  }
  if (format.toLowerCase().includes('phone') || format.toLowerCase().includes('sms') || format.toLowerCase().includes('email')) {
    return 'contact';
  }
  return ''; // Default format badge styling
}

function detectBarcodeFormat(data) {
  // URL format detection (QR codes often contain URLs)
  if (/^https?:\/\/.+/i.test(data)) return 'URL (HTTP/HTTPS)';
  if (/^ftp:\/\/.+/i.test(data)) return 'URL (FTP)';
  if (/^mailto:.+@.+\..+/i.test(data)) return 'URL (Email)';
  if (/^tel:\+?[\d\-\(\)\s]+/i.test(data)) return 'URL (Phone)';
  if (/^sms:\+?[\d\-\(\)\s]+/i.test(data)) return 'URL (SMS)';
  if (/^wifi:T:.+;S:.+;P:.+;H:.+;;/i.test(data)) return 'WiFi QR Code';
  if (/^geo:[\d\.\-]+,[\d\.\-]+/i.test(data)) return 'URL (Location)';
  if (/^market:\/\/details\?id=.+/i.test(data)) return 'URL (Play Store)';
  if (/^itms-apps:\/\/.+/i.test(data)) return 'URL (App Store)';
  
  // Traditional barcode formats
  if (/^\d{13}$/.test(data)) return 'EAN-13';
  if (/^\d{12}$/.test(data)) return 'UPC-A';
  if (/^\d{8}$/.test(data)) return 'EAN-8';
  if (/^\d{14}$/.test(data)) return 'GTIN-14';
  if (/^[0-9]{1,14}$/.test(data)) return 'Numeric Barcode';
  
  // Advanced patterns
  if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(data)) return 'IBAN';
  if (/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/.test(data)) return 'Credit Card';
  if (/^[A-Z0-9]{2,}[\-\.\s]*[A-Z0-9]*$/i.test(data) && data.length >= 4) {
    // Check for common Code 128 patterns
    if (/[A-Z]/.test(data) && /\d/.test(data)) return 'Code 128 (Alphanumeric)';
    return 'Code 128';
  }
  
  // Generic URL detection (catch-all for URLs not matching specific patterns)
  if (/^[a-z][a-z0-9+.-]*:\/\/.+/i.test(data)) return 'URL (Other Protocol)';
  if (/^www\..+\..+/i.test(data)) return 'URL (Website)';
  if (/^.+@.+\..+$/i.test(data)) return 'Email Address';
  
  return 'Unknown';
}

function showNotification(message, type) {
  // Simple notification system - could be replaced with a proper toast library
  console.log(`[${type.toUpperCase()}] ${message}`);
}

// Lifecycle
onMounted(() => {
  // Auto-focus the scanner area
  nextTick(() => {
    focusScanner();
  });
});

onBeforeUnmount(() => {
  detector.reset();
});
</script>

<style scoped>
.barcode-reader-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #333;
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

.subtitle {
  margin: 0;
  opacity: 0.9;
  font-size: 1rem;
}

.scanner-area {
  flex: none;
  height: 180px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  outline: none;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.scanner-area:focus {
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3), 0 8px 32px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.scan-display {
  text-align: center;
}

.waiting-indicator {
  color: #666;
}

.pulse-icon {
  font-size: 3rem;
  margin-bottom: 15px;
  opacity: 0.5;
  transition: all 0.3s ease;
}

.pulse-icon.active {
  opacity: 1;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.scan-result {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #28a745;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.scanned-code {
  font-size: 1.5rem;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  margin-bottom: 10px;
  word-break: break-all;
  overflow-wrap: break-word;
  hyphens: auto;
  max-width: 100%;
  line-height: 1.3;
  color: #2c3e50;
}

.scan-info {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-bottom: 10px;
}

.format-badge, .confidence-badge, .timestamp {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.format-badge {
  background: #e3f2fd;
  color: #1976d2;
}

/* URL format badges */
.format-badge.url {
  background: #e8f5e8;
  color: #2e7d32;
}

.format-badge.wifi {
  background: #fff3e0;
  color: #ef6c00;
}

.format-badge.contact {
  background: #f3e5f5;
  color: #7b1fa2;
}

.confidence-badge {
  color: white;
}

.confidence-high { background: #4caf50; }
.confidence-medium { background: #ff9800; }
.confidence-low { background: #f44336; }

.timestamp {
  background: #f5f5f5;
  color: #666;
}

.scan-details {
  color: #666;
  font-size: 0.9rem;
}

.debug-buffer {
  margin-top: 15px;
  padding: 10px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.controls {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
}

.controls button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: white;
  color: #667eea;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.controls button:hover:not(:disabled) {
  background: #f0f0f0;
  transform: translateY(-1px);
}

.controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.debug-panel {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.debug-panel h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.2rem;
}

.debug-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.stat-item label {
  font-weight: 500;
  color: #666;
}

.status-active {
  color: #28a745;
  font-weight: bold;
}

.status-inactive {
  color: #dc3545;
  font-weight: bold;
}

.recent-events h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.event-log {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.9rem;
}

.event-item:last-child {
  border-bottom: none;
}

.event-item.scan {
  background: #d4edda;
  border-left: 3px solid #28a745;
}

.event-item.reject {
  background: #f8d7da;
  border-left: 3px solid #dc3545;
}

.event-item.char {
  background: #e2e3e5;
  border-left: 3px solid #6c757d;
}

.event-time {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  color: #666;
  min-width: 80px;
}

.event-type {
  font-weight: bold;
  min-width: 60px;
  font-size: 0.8rem;
}

.event-data {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .barcode-reader-container {
    padding: 15px;
  }
  
  .scanner-area {
    height: 120px;
    padding: 15px;
  }
  
  .scan-result {
    padding: 15px;
    margin: 0;
  }
  
  .scanned-code {
    font-size: 1.1rem;
    line-height: 1.4;
    word-break: break-all;
    overflow-wrap: anywhere;
    max-width: 100%;
    padding: 0;
    margin-bottom: 8px;
  }
  
  .scan-info {
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  
  .format-badge, .confidence-badge, .timestamp {
    font-size: 0.75rem;
    padding: 3px 6px;
  }
  
  .scan-details {
    font-size: 0.8rem;
    margin-top: 8px;
  }
  
  .controls {
    flex-direction: column;
  }
  
  .controls button {
    width: 100%;
  }
  
  .debug-stats {
    grid-template-columns: 1fr;
  }
  
  .debug-buffer {
    font-size: 0.8rem;
    padding: 8px;
    word-break: break-all;
    overflow-wrap: anywhere;
  }
}

/* Extra small devices */
@media (max-width: 480px) {
  .barcode-reader-container {
    padding: 10px;
  }
  
  .header h2 {
    font-size: 1.4rem;
  }
  
  .scanner-area {
    height: 100px;
    padding: 10px;
  }
  
  .scanned-code {
    font-size: 0.9rem;
    line-height: 1.3;
  }
  
  .format-badge, .confidence-badge, .timestamp {
    font-size: 0.7rem;
    padding: 2px 4px;
  }
  
  .scan-details {
    font-size: 0.75rem;
  }
  
  .controls button {
    padding: 8px 15px;
    font-size: 0.9rem;
  }
}
</style>
