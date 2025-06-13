<template>
  <div class="tts-container">
    <!-- Back Button -->
    <BackButton />
    
    <h2>讯飞语音合成演示</h2>
    
    <div class="input-area">
      <textarea v-model="inputText" placeholder="请输入要转换为语音的文本"></textarea>
    </div>
    
    <div class="controls">
      <div class="voice-selection">
        <label>
          选择发音人:
          <select v-model="selectedVoice" :disabled="isLoadingVoices">
            <option v-if="isLoadingVoices" value="">加载发音人中...</option>
            <option v-else v-for="voice in voices" :key="voice.value" :value="voice.value">
              {{ voice.label }}
            </option>
          </select>
        </label>
      </div>
      
      <div class="param-controls">
        <label>
          语速 (0-100):
          <input type="range" v-model="speed" min="0" max="100">
          {{ speed }}
        </label>
        <label>
          音量 (0-100):
          <input type="range" v-model="volume" min="0" max="100">
          {{ volume }}
        </label>
        <label>
          音高 (0-100):
          <input type="range" v-model="pitch" min="0" max="100">
          {{ pitch }}
        </label>
      </div>
      
      <button @click="synthesize" :disabled="isSynthesizing || !selectedVoice">
        {{ isSynthesizing ? '合成中...' : '开始合成' }}
      </button>
    </div>
    
    <div class="audio-player" v-if="audioSrc">
      <audio controls :src="audioSrc"></audio>
      <p>合成完成，点击播放按钮试听</p>
    </div>
    
    <div class="error" v-if="errorMessage">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script>
import { textToSpeech, getVoiceList } from '../services/XunfeiTTS'
import BackButton from './BackButton.vue'

export default {
  name: 'XunfeiTTS',
  components: {
    BackButton
  },
  data() {
    return {
      inputText: '你好',
      voices: [],
      selectedVoice: '',
      speed: 50,
      volume: 50,
      pitch: 50,
      audioSrc: '',
      isLoadingVoices: false,
      isSynthesizing: false,
      errorMessage: ''
    }
  },
  created() {
    this.loadVoices()
  },
  methods: {
    loadVoices() {
        const voices = getVoiceList()
        if (voices && voices.length > 0) {
          this.voices = voices
          this.selectedVoice = voices[0].value
        } else {
          this.errorMessage = '未能获取发音人列表'
        }
    },
    
    async synthesize() {
      if (!this.inputText.trim()) {
        this.errorMessage = '请输入要合成的文本'
        return
      }
      
      if (!this.selectedVoice) {
        this.errorMessage = '请选择发音人'
        return
      }
      
      this.errorMessage = ''
      this.isSynthesizing = true
      
      try {
        this.audioSrc = await textToSpeech(this.inputText, 
            {
            voiceName: this.selectedVoice,
            speed: this.speed,
            volume: this.volume,
            pitch: this.pitch
            }, 
            true // True to use the proxy
        )
      } catch (error) {
        console.error('语音合成失败:', error)
        this.errorMessage = `语音合成失败: ${error.message}`
      } finally {
        this.isSynthesizing = false
      }
    }
  }
}
</script>

<style scoped>
.tts-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.input-area textarea {
  width: 100%;
  height: 150px;
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}

.controls {
  margin-bottom: 20px;
}

.voice-selection {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.voice-selection select {
  min-width: 300px;
  padding: 5px;
  border-radius: 4px;
}

.param-controls {
  margin: 15px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.param-controls label {
  display: flex;
  align-items: center;
  gap: 10px;
}

.param-controls input[type="range"] {
  flex-grow: 1;
}

button {
  padding: 8px 15px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.audio-player {
  margin-top: 20px;
  text-align: center;
}

.error {
  color: red;
  margin-top: 15px;
}
</style>