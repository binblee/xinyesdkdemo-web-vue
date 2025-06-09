<template>
  <div class="vrm-viewer-container">
    <!-- Avatar -->
    <div ref="canvasContainer" class="canvas-area"></div>
      <div class="chinese-tts-container">
    <h2>Chinese Text-to-Speech</h2>

    <!-- TTS -->
    <div v-if="isLoadingVoices" class="loading-message">
      Loading voices... Please wait.
    </div>

    <div v-if="!isLoadingVoices && chineseVoices.length === 0" class="no-voices-message">
      No Chinese voices were found on this device/browser.
      Speech synthesis may not be available or supported for Chinese.
    </div>

    <div v-if="!isLoadingVoices && chineseVoices.length > 0" class="tts-controls">
      <div class="form-group">
        <label for="voiceSelect">Select Voice:</label>
        <select id="voiceSelect" v-model="selectedVoiceURI" @change="handleVoiceSelection">
          <option value="">-- Select a Chinese Voice --</option>
          <option v-for="voice in chineseVoices" :key="voice.voiceURI || voice.name" :value="voice.voiceURI || voice.name">
            {{ voice.name }} ({{ voice.lang }}) - [{{ voice.localService ? 'Local' : 'Network' }}]
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="textToSpeak">Text to Speak:</label>
        <textarea id="textToSpeak" v-model="textToSpeak" rows="4" placeholder="Enter Chinese text here..."></textarea>
      </div>

      <div class="form-group">
        <button @click="speak" :disabled="!selectedVoiceObject || !textToSpeak.trim() || isSpeaking">
          {{ isSpeaking ? 'Speaking...' : 'Speak' }}
        </button>
        <button @click="cancelSpeech" v-if="isSpeaking" class="cancel-button">
          Cancel
        </button>
      </div>

      <div v-if="speechError" class="error-message">
        Error: {{ speechError }}
      </div>
       <div v-if="speechStatus" class="status-message">
        Status: {{ speechStatus }}
      </div>
    </div>
    </div>
    <!-- Controls -->
    <div class="controls">
      <button @click="setExpression('happy')">Happy</button>
      <button @click="setExpression('angry')">Angry</button>
      <button @click="setExpression('sad')">Sad</button>
      <button @click="resetExpressions">Reset Expressions</button>
      <button @click="putArmsDown">Arms Down</button>
      <button @click="raiseLeftArmForward">Raise Left Arm</button>
      <button @click="raiseRightArmForward">Raise Right Arm</button>
      <button @click="resetArmPose">Reset Arms (T-Pose)</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils, VRMExpressionPresetName, VRMHumanBoneName } from '@pixiv/three-vrm'; // Added VRMHumanBoneName

const canvasContainer = ref(null);
let scene, camera, renderer, clock, currentVrm;

// Chinese TTS related variables
const allVoices = ref([]);
const chineseVoices = ref([]);
const selectedVoiceURI = ref(''); // Store URI or unique name
const selectedVoiceObject = ref(null);
const textToSpeak = ref('你好，请问我能帮你什么？'); // Default text in Chinese
const isLoadingVoices = ref(true);
const isSpeaking = ref(false);
const speechError = ref('');
const speechStatus = ref('');

const synth = window.speechSynthesis;

const populateVoiceList = () => {
  if (!synth) {
    isLoadingVoices.value = false;
    speechError.value = "Speech Synthesis API not supported by this browser.";
    console.error("Speech Synthesis API not supported.");
    return;
  }

  const voices = synth.getVoices();
  allVoices.value = voices;
  console.log(`All available voices (total ${voices.length}):`, voices);

  chineseVoices.value = voices.filter(voice =>
    voice.lang.toLowerCase().startsWith('zh')
  );
  console.log(`Found Chinese voices (total ${chineseVoices.value.length}):`, chineseVoices.value);

  isLoadingVoices.value = false;

  // Auto-select the first Chinese voice if available and none is selected
  if (chineseVoices.value.length > 0 && !selectedVoiceURI.value) {
    const firstLocalChineseVoice = chineseVoices.value.find(v => v.localService);
    if (firstLocalChineseVoice) {
        selectedVoiceURI.value = firstLocalChineseVoice.voiceURI || firstLocalChineseVoice.name;
    } else {
        selectedVoiceURI.value = chineseVoices.value[0].voiceURI || chineseVoices.value[0].name;
    }
  }
};

const handleVoiceSelection = () => {
  // This watcher will take care of updating selectedVoiceObject
  // No explicit action needed here if selectedVoiceURI is properly bound.
};

watch(selectedVoiceURI, (newVal) => {
  if (newVal) {
    selectedVoiceObject.value = allVoices.value.find(
      voice => (voice.voiceURI || voice.name) === newVal
    );
    console.log("Selected voice object:", selectedVoiceObject.value);
  } else {
    selectedVoiceObject.value = null;
  }
});

const speak = () => {
  if (!synth || !selectedVoiceObject.value || !textToSpeak.value.trim()) {
    speechError.value = "Cannot speak. Check if a voice is selected and text is provided.";
    console.error("Missing synth, selected voice, or text to speak.");
    return;
  }

  if (isSpeaking.value) {
    console.warn("Already speaking.");
    return;
  }

  // Cancel any previous speech before starting a new one
  if (synth.speaking || synth.pending) {
    synth.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(textToSpeak.value);
  utterance.voice = selectedVoiceObject.value;
  utterance.lang = selectedVoiceObject.value.lang; // Crucial for correct pronunciation
  utterance.pitch = 1;
  utterance.rate = 1;

  utterance.onstart = () => {
    isSpeaking.value = true;
    speechStatus.value = `Speaking with: ${selectedVoiceObject.value?.name}...`;
    speechError.value = '';
    console.log("Speech started.");
  };

  utterance.onend = () => {
    isSpeaking.value = false;
    speechStatus.value = "Speech finished.";
    console.log("Speech ended.");
  };

  utterance.onerror = (event) => {
    isSpeaking.value = false;
    speechError.value = `Speech error: ${event.error}`;
    speechStatus.value = "Speech error occurred.";
    console.error("Speech synthesis error:", event);
  };

  synth.speak(utterance);
};

const cancelSpeech = () => {
  if (synth && isSpeaking.value) {
    synth.cancel();
    isSpeaking.value = false; // Manually reset as onend might not fire immediately
    speechStatus.value = "Speech cancelled.";
    console.log("Speech cancelled by user.");
  }
};


onMounted(() => {
  initThree();
  loadDefaultVrmModel();
  if (synth) {
    // Attempt to load voices immediately
    populateVoiceList();

    // The 'voiceschanged' event is crucial because getVoices() might initially return an empty list
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = populateVoiceList;
    }
  } else {
     isLoadingVoices.value = false;
     speechError.value = "Speech Synthesis API not supported by this browser.";
     console.error("Speech Synthesis API not supported in onMounted.");
  }
});

onBeforeUnmount(() => {
  // Clean up Three.js resources
  if (renderer) {
    renderer.dispose();
  }
  if (currentVrm) {
    VRMUtils.deepDispose(currentVrm.scene);
  }
  // Clean up: remove the event listener and cancel any ongoing speech
  if (synth) {
    synth.onvoiceschanged = null; // Remove the listener
    if (synth.speaking) {
      synth.cancel(); // Cancel any speech if the component is destroyed
    }
  }
});

function initThree() {
  // Scene
  scene = new THREE.Scene();

  // Camera
  const aspect = canvasContainer.value ? canvasContainer.value.clientWidth / canvasContainer.value.clientHeight : window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(30.0, aspect, 0.1, 20.0);
  camera.position.set(0.0, 1.0, 5.0);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  if (canvasContainer.value && canvasContainer.value.clientWidth > 0 && canvasContainer.value.clientHeight > 0) {
    renderer.setSize(canvasContainer.value.clientWidth, canvasContainer.value.clientHeight);
  } else {
    renderer.setSize(window.innerWidth / 2, window.innerHeight / 2);
  }
  renderer.setPixelRatio(window.devicePixelRatio);
  if (canvasContainer.value) {
    canvasContainer.value.appendChild(renderer.domElement);
  }

  // Light
  const light = new THREE.DirectionalLight(0xffffff);
  light.position.set(1.0, 1.0, 1.0).normalize();
  scene.add(light);

  // Clock
  clock = new THREE.Clock();

  // Animation loop - MODIFIED
  const animate = () => {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (currentVrm) {
      currentVrm.update(delta); 
    }
    renderer.render(scene, camera);
  };
  animate();

  // Handle window resize
  window.addEventListener('resize', onWindowResize);
  onWindowResize();
}

function onWindowResize() {
  if (camera && renderer && canvasContainer.value && canvasContainer.value.clientWidth > 0 && canvasContainer.value.clientHeight > 0) {
    camera.aspect = canvasContainer.value.clientWidth / canvasContainer.value.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvasContainer.value.clientWidth, canvasContainer.value.clientHeight);
  }
}

async function loadVrm(vrmUrl) {
  const loader = new GLTFLoader();
  loader.register((parser) => {
    return new VRMLoaderPlugin(parser, { autoUpdateHumanBones: true }); 
  });

  try {
    const gltf = await loader.loadAsync(vrmUrl);
    const vrm = gltf.userData.vrm;

    // Remove previous model
    if (currentVrm) {
      scene.remove(currentVrm.scene);
      VRMUtils.deepDispose(currentVrm.scene);
    }

    // Add new model
    currentVrm = vrm;
    scene.add(currentVrm.scene);
    VRMUtils.rotateVRM0(currentVrm);

    console.log('VRM model loaded, currentVrm:', currentVrm); // Log currentVrm

    // Defer the initial reset and expression logging
    requestAnimationFrame(() => {
      if (currentVrm && currentVrm.expressionManager) {
        console.log('Attempting to reset expressions initially...');
        // Iterate over all expressions in the map and set their value to 0
        for (const expressionName in currentVrm.expressionManager.expressionMap) {
          currentVrm.expressionManager.setValue(expressionName, 0);
        }
        console.log('Initial expressions reset by iterating and setting values to 0.');
        console.log(
          'Available expressions (after defer and manual reset):',
          Object.keys(currentVrm.expressionManager.expressionMap)
        );
      } else {
        console.warn('Deferred: VRM model loaded, but expressionManager is not available for initial reset.');
        if (currentVrm) {
          console.log('Deferred currentVrm.expressionManager:', currentVrm.expressionManager);
        } else {
          console.log('Deferred currentVrm is null');
        }
      }
    });

    console.log('VRM model processing complete.', vrm);
  } catch (error) {
    console.error('Error loading VRM model:', error);
  }
}

async function loadDefaultVrmModel() {
  // Files in the public directory are served at the root path.
  const defaultVrmPath = 'https://taient.oss-cn-beijing.aliyuncs.com/vroid/AvatarZ.vrm';
  await loadVrm(defaultVrmPath);
}

function setExpression(presetName, intensity = 1.0) {
  if (currentVrm && currentVrm.expressionManager) {
    // currentVrm.expressionManager.reset(); // Optional: uncomment to make expressions exclusive
    currentVrm.expressionManager.setValue(presetName, intensity);
  } else {
    console.warn('VRM model or expression manager not available for setExpression.');
  }
}

function resetExpressions() {
  if (currentVrm && currentVrm.expressionManager && currentVrm.expressionManager.expressionMap) {
    console.log('Resetting expressions by iterating through expressionMap...');
    for (const expressionName in currentVrm.expressionManager.expressionMap) {
      currentVrm.expressionManager.setValue(expressionName, 0);
    }
    console.log('All expressions set to 0.');
  } else {
    console.warn('VRM model, expression manager, or expressionMap not available for resetExpressions.');
  }
}

// --- Arm Control Functions ---

function getBone(boneName) {
  if (!currentVrm || !currentVrm.humanoid) {
    console.warn('VRM model or humanoid structure not available.');
    return null;
  }
  const boneNode = currentVrm.humanoid.getNormalizedBoneNode(boneName);
  if (!boneNode) {
    console.warn(`Bone not found: ${boneName}`);
  }
  return boneNode;
}

function resetArmPose() {
  if (!currentVrm || !currentVrm.humanoid) {
    console.warn('VRM model or humanoid structure not available for resetArmPose.');
    return;
  }

  console.log('Attempting to reset arm pose...');

  // Step 1: Call the official VRM humanoid reset for normalized pose.
  currentVrm.humanoid.resetNormalizedPose();
  console.log('Called currentVrm.humanoid.resetNormalizedPose().');

  // Step 2: Explicitly set arm bone rotations to (0,0,0) for a clear T-Pose.
  const armSegmentsToReset = [
    VRMHumanBoneName.LeftUpperArm,
    VRMHumanBoneName.RightUpperArm,
    VRMHumanBoneName.LeftLowerArm,
    VRMHumanBoneName.RightLowerArm,
    VRMHumanBoneName.LeftHand,
    VRMHumanBoneName.RightHand
  ];

  console.log('Explicitly setting key arm segment rotations to (0,0,0).');
  armSegmentsToReset.forEach(boneName => {
    const bone = getBone(boneName);
    if (bone) {
      bone.rotation.set(0, 0, 0);
      // console.log(\`Rotation of \${boneName}\ set to (0,0,0).\`);
    } else {
      // console.warn(\`Could not get bone \${boneName}\ for explicit reset.\`);
    }
  });

  console.log('Arm pose reset process completed.');
}

function putArmsDown() {
  const leftUpperArm = getBone(VRMHumanBoneName.LeftUpperArm);
  const rightUpperArm = getBone(VRMHumanBoneName.RightUpperArm);

  if (leftUpperArm) {
    // Rotate left arm down: around its local Z-axis by -90 degrees
    leftUpperArm.rotation.set(0, 0, -Math.PI / 2);
  }
  if (rightUpperArm) {
    // Rotate right arm down: around its local Z-axis by +90 degrees
    rightUpperArm.rotation.set(0, 0, Math.PI / 2);
  }
}

function raiseLeftArmForward() {
  const leftUpperArm = getBone(VRMHumanBoneName.LeftUpperArm);
  if (leftUpperArm) {
    // Rotate left arm forward: around its local Y-axis by +90 degrees
    // Assuming T-pose is (0,0,0) for the bone, this makes its X-axis point forward.
    leftUpperArm.rotation.set(0, Math.PI / 2, 0);
  }
  // Optionally, ensure the other arm is in a neutral/down pose
  // const rightUpperArm = getBone(VRMHumanBoneName.RightUpperArm);
  // if (rightUpperArm) rightUpperArm.rotation.set(0, 0, Math.PI / 2); // Put right arm down
}

function raiseRightArmForward() {
  const rightUpperArm = getBone(VRMHumanBoneName.RightUpperArm);
  if (rightUpperArm) {
    // Rotate right arm forward: around its local Y-axis by -90 degrees
    rightUpperArm.rotation.set(0, -Math.PI / 2, 0);
  }
  // Optionally, ensure the other arm is in a neutral/down pose
  // const leftUpperArm = getBone(VRMHumanBoneName.LeftUpperArm);
  // if (leftUpperArm) leftUpperArm.rotation.set(0, 0, -Math.PI / 2); // Put left arm down
}
</script>

<style scoped>
.vrm-viewer-container { /* MODIFIED: Was generic 'div' */
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 500px; /* Adjust as needed, or e.g., 100vh */
  /* position: relative; Removed as it's not strictly needed for this layout */
}

.canvas-area { /* ADDED: Style for the canvas container */
  flex-grow: 1;
  width: 100%;
  min-height: 0; /* Important for flex children */
  position: relative; /* If canvas inside needs absolute positioning */
}

/* ADDED styles for controls - MODIFIED from previous */
.controls {
  background: #f8f9fa; /* Lighter, cleaner background */
  padding: 15px; /* Increased padding */
  border-radius: 8px; /* Slightly larger radius */
  display: flex;
  flex-wrap: wrap;
  gap: 10px; /* Increased gap for better spacing */
  justify-content: center; /* Center buttons if they don't fill the width */
  flex-shrink: 0; 
  border-top: 1px solid #dee2e6; /* Add a top border to separate from content above */
  box-shadow: 0 -2px 5px rgba(0,0,0,0.05); /* Subtle shadow to lift it a bit */
}

.controls button {
  padding: 8px 15px; /* More balanced padding */
  font-size: 14px;
  color: #fff;
  background-color: #007bff; /* Primary button color */
  border: none; /* Remove default border */
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1); /* Subtle shadow for buttons */
}

.controls button:hover {
  background-color: #0056b3; /* Darker on hover */
  box-shadow: 0 4px 8px rgba(0,0,0,0.15); /* Slightly larger shadow on hover */
}

.controls button:active {
  background-color: #004085; /* Even darker on active/click */
  box-shadow: 0 1px 2px rgba(0,0,0,0.1); /* Smaller shadow on active */
}

.chinese-tts-container {
  font-family: sans-serif;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  max-width: 500px;
  margin: 20px auto;
  background-color: #f9f9f9;
}

h2 {
  text-align: center;
  color: #333;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.form-group select,
.form-group textarea,
.form-group button {
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
  box-sizing: border-box; /* Ensures padding doesn't affect width */
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-group button {
  background-color: #007bff;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.form-group button:hover:not(:disabled) {
  background-color: #0056b3;
}

.form-group button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.cancel-button {
  background-color: #dc3545 !important; /* Important to override general button style */
  margin-top: 5px;
}
.cancel-button:hover:not(:disabled) {
  background-color: #c82333 !important;
}

.loading-message,
.no-voices-message,
.error-message,
.status-message {
  padding: 10px;
  margin-top: 10px;
  border-radius: 4px;
  text-align: center;
}

.loading-message {
  background-color: #e0e0e0;
  color: #333;
}

.no-voices-message {
  background-color: #ffe0b2; /* Light orange */
  color: #856404;
  border: 1px solid #ffc107;
}

.error-message {
  background-color: #f8d7da; /* Light red */
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-message {
  background-color: #d4edda; /* Light green */
  color: #155724;
  border: 1px solid #c3e6cb;
}

</style>
