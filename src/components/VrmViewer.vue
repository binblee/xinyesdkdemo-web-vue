<template>
  <div class="vrm-viewer-container">
    <!-- Avatar -->
    <div ref="canvasContainer" class="canvas-area"></div>

    <!-- UI Panel for Avatar Controls -->
    <div class="ui-panel">
      <!-- Controls -->
      <div class="controls">
        <button @click="sayHello">Say Hello</button>
        <button @click="setExpression('happy')">Happy</button>
        <button @click="setExpression('angry')">Angry</button>
        <button @click="setExpression('sad')">Sad</button>
        <button @click="resetExpressions">Reset Expressions</button>
        <button @click="putArmsDown">Arms Down</button>
        <button @click="raiseLeftArmForward">Raise Left Arm</button>
        <button @click="raiseRightArmForward">Raise Right Arm</button>
        <button @click="resetArmPose">Reset Arms (T-Pose)</button>
        <button @click="forceResize" style="background-color: #ff6b6b;">🔄 Fix Display</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils, VRMExpressionPresetName, VRMHumanBoneName } from '@pixiv/three-vrm';

const canvasContainer = ref(null);
let scene, camera, renderer, clock, currentVrm;

onMounted(() => {
  initThree();
  loadDefaultVrmModel();
});

onBeforeUnmount(() => {
  // Clean up event listeners
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('orientationchange', handleOrientationChange);
  
  // Clear any pending timeouts
  clearTimeout(resizeTimeout);
  clearTimeout(orientationChangeTimeout);
  
  // Clean up Three.js resources
  if (renderer) {
    renderer.dispose();
  }
  if (currentVrm) {
    VRMUtils.deepDispose(currentVrm.scene);
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

  // Handle window resize with orientation change support
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleOrientationChange);
  
  // Initial resize
  setTimeout(() => {
    onWindowResize();
  }, 100);
}

let resizeTimeout;
let orientationChangeTimeout;

function handleResize() {
  // Debounce resize events to avoid excessive calls
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    onWindowResize();
  }, 100);
}

function handleOrientationChange() {
  console.log('Orientation change detected');
  
  // Clear any existing timeouts
  clearTimeout(orientationChangeTimeout);
  
  // Immediate response - try to prevent display corruption
  setTimeout(() => {
    attemptResize('immediate');
  }, 50);
  
  // Early attempt - after initial DOM adjustment
  setTimeout(() => {
    attemptResize('early');
  }, 300);
  
  // Main attempt - after viewport stabilizes
  orientationChangeTimeout = setTimeout(() => {
    attemptResize('main');
  }, 600);
  
  // Aggressive attempt - force complete recalculation
  setTimeout(() => {
    attemptResize('aggressive');
  }, 1000);
  
  // Final desperate attempt - nuclear option
  setTimeout(() => {
    attemptResize('nuclear');
  }, 1500);
}

function attemptResize(phase) {
  console.log(`VRM resize attempt: ${phase}`);
  
  if (!canvasContainer.value || !renderer || !camera) {
    console.warn(`VRM resize ${phase}: missing required components`);
    return;
  }
  
  const container = canvasContainer.value;
  
  // Different strategies based on phase
  if (phase === 'aggressive' || phase === 'nuclear') {
    // Force complete DOM and canvas reset
    forceDOMReset(phase);
  } else if (phase === 'main' || phase === 'early') {
    // Standard DOM refresh
    refreshDOMLayout();
  }
  
  // Wait for DOM to settle, then resize
  setTimeout(() => {
    performResize(phase);
  }, phase === 'nuclear' ? 100 : 50);
}

// New function for aggressive DOM reset
function forceDOMReset(phase) {
  console.log(`VRM DOM reset: ${phase}`);
  
  const container = canvasContainer.value;
  const parent = container.parentElement;
  const canvas = container.querySelector('canvas');
  
  if (phase === 'nuclear') {
    // Nuclear option: completely recreate the canvas
    if (canvas) {
      canvas.remove();
    }
    
    // Reset container styles completely
    container.style.cssText = '';
    container.className = 'canvas-area';
    
    // Force parent container reset
    if (parent) {
      parent.style.display = 'none';
      parent.offsetHeight; // Force reflow
      parent.style.display = '';
      parent.offsetHeight; // Force another reflow
    }
    
    // Force container reset
    container.style.display = 'none';
    container.offsetHeight; // Force reflow
    container.style.display = '';
    container.offsetHeight; // Force reflow
    
    // Re-append canvas to container
    if (renderer && renderer.domElement) {
      container.appendChild(renderer.domElement);
    }
  } else {
    // Less aggressive reset
    refreshDOMLayout();
  }
}

// New function for standard DOM refresh
function refreshDOMLayout() {
  const container = canvasContainer.value;
  const parent = container.parentElement;
  
  // Force parent recalculation
  if (parent) {
    const originalDisplay = parent.style.display;
    parent.style.display = 'none';
    parent.offsetHeight; // Trigger reflow
    parent.style.display = originalDisplay || '';
  }
  
  // Force container recalculation
  const originalDisplay = container.style.display;
  container.style.display = 'none';
  container.style.width = '';
  container.style.height = '';
  container.offsetHeight; // Trigger reflow
  container.style.display = originalDisplay || '';
}

// Enhanced performResize function
function performResize(phase) {
  if (!camera || !renderer || !canvasContainer.value) {
    console.warn(`VRM resize ${phase}: missing components during perform`);
    return;
  }
  
  const container = canvasContainer.value;
  let width = container.clientWidth;
  let height = container.clientHeight;
  
  console.log(`VRM resize ${phase}: initial container dimensions ${width}x${height}`);
  
  // Multiple fallback strategies for getting dimensions
  if (width <= 0 || height <= 0) {
    // Try getBoundingClientRect
    const rect = container.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    console.log(`VRM resize ${phase}: using getBoundingClientRect ${width}x${height}`);
  }
  
  if (width <= 0 || height <= 0) {
    // Try parent dimensions
    const parent = container.parentElement;
    if (parent) {
      width = parent.clientWidth;
      height = parent.clientHeight;
      console.log(`VRM resize ${phase}: using parent dimensions ${width}x${height}`);
    }
  }
  
  if (width <= 0 || height <= 0) {
    // Last resort: viewport dimensions
    width = window.innerWidth;
    height = window.innerHeight;
    console.log(`VRM resize ${phase}: using viewport fallback ${width}x${height}`);
  }
  
  // For mobile portrait, account for UI panel
  const isPortrait = height > width;
  if (isPortrait && window.innerWidth <= 768) {
    const uiPanel = document.querySelector('.ui-panel');
    if (uiPanel) {
      const uiHeight = uiPanel.getBoundingClientRect().height;
      height = Math.max(200, height - uiHeight - 20); // 20px buffer
      console.log(`VRM resize ${phase}: adjusted for mobile portrait UI, new height ${height}`);
    }
  }
  
  // Ensure minimum dimensions
  width = Math.max(200, width);
  height = Math.max(200, height);
  
  // Update camera
  const newAspect = width / height;
  camera.aspect = newAspect;
  camera.updateProjectionMatrix();
  
  // Update renderer with pixel ratio consideration
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2 for performance
  
  // Force canvas size
  const canvas = renderer.domElement;
  if (canvas) {
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.width = width * renderer.getPixelRatio();
    canvas.height = height * renderer.getPixelRatio();
  }
  
  // Force immediate render
  if (currentVrm && scene) {
    renderer.render(scene, camera);
  }
  
  console.log(`VRM resize ${phase}: completed ${width}x${height}, aspect ${newAspect.toFixed(3)}`);
}

function forceRendererResize(phase) {
  if (!camera || !renderer || !canvasContainer.value) {
    console.warn(`VRM resize ${phase}: missing components`);
    return;
  }
  
  const container = canvasContainer.value;
  let width = container.clientWidth;
  let height = container.clientHeight;
  
  console.log(`VRM resize ${phase}: container dimensions ${width}x${height}`);
  
  // If we still don't have valid dimensions, use viewport as fallback
  if (width <= 0 || height <= 0) {
    width = window.innerWidth;
    height = window.innerHeight;
    console.log(`VRM resize ${phase}: using viewport fallback ${width}x${height}`);
  }
  
  // For portrait mode, adjust for UI panel
  if (height > width && phase !== 'immediate') {
    // Estimate UI panel height and subtract from available height
    const uiPanel = container.parentElement?.querySelector('.ui-panel');
    const uiPanelHeight = uiPanel ? uiPanel.offsetHeight : 150;
    height = Math.max(200, height - uiPanelHeight);
    console.log(`VRM resize ${phase}: adjusted for UI panel, new height ${height}`);
  }
  
  // Update camera
  const newAspect = width / height;
  camera.aspect = newAspect;
  camera.updateProjectionMatrix();
  
  // Update renderer
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // Force immediate render
  if (currentVrm && scene) {
    renderer.render(scene, camera);
  }
  
  console.log(`VRM resize ${phase}: completed with aspect ${newAspect.toFixed(3)}`);
}

function onWindowResize() {
  if (!camera || !renderer || !canvasContainer.value) {
    return;
  }
  
  const container = canvasContainer.value;
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  // Ensure we have valid dimensions
  if (width <= 0 || height <= 0) {
    console.warn(`VRM resize: invalid dimensions ${width}x${height}, retrying...`);
    // Retry after a short delay if dimensions aren't ready
    setTimeout(() => {
      onWindowResize();
    }, 100);
    return;
  }
  
  // Update camera aspect ratio
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  // Update renderer size
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // Force a render to apply changes immediately
  if (currentVrm && scene) {
    renderer.render(scene, camera);
  }
  
  console.log(`VRM regular resize: ${width}x${height}, aspect: ${(width/height).toFixed(3)}`);
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

function sayHello() { // ADDED FUNCTION
  setExpression(VRMExpressionPresetName.Happy);
  raiseRightArmForward();
  // After a short delay, reset the arm to make it a brief wave
  setTimeout(() => {
    // Check if the arm is still raised before putting it down
    // This is a simple check; a more robust solution might involve state tracking
    const rightUpperArm = getBone(VRMHumanBoneName.RightUpperArm);
    if (rightUpperArm && rightUpperArm.rotation.y === -Math.PI / 2) { 
      putArmsDown(); // Or resetArmPose() if preferred
    }
    // Optionally reset expression too, or leave it as happy
    // resetExpressions(); 
  }, 1500); // Adjust delay as needed (1.5 seconds)
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

// Force a complete resize recalculation (useful for debugging orientation issues)
function forceResize() {
  console.log('VRM manual force resize triggered');
  
  // Use the nuclear option for manual resize
  attemptResize('nuclear');
  
  // Also try a follow-up resize after a brief delay
  setTimeout(() => {
    attemptResize('followup');
  }, 500);
}

// Expose forceResize for debugging purposes (can be called from browser console)
if (typeof window !== 'undefined') {
  window.vrmForceResize = forceResize;
}
</script>

<style scoped>
.vrm-viewer-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  max-height: 100vh;
  max-height: 100dvh;
  min-height: 400px;
  position: relative;
  overflow: hidden;
  /* Force hardware acceleration */
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
}

.canvas-area {
  flex-grow: 1;
  flex-shrink: 1;
  width: 100%;
  min-height: 0;
  position: relative;
  overflow: hidden;
  background: #f0f0f0;
  /* Ensure proper rendering during transitions */
  contain: layout style paint;
  /* Force hardware acceleration */
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
}

.canvas-area canvas {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  object-fit: contain;
  /* Prevent canvas from interfering with layout */
  position: absolute;
  top: 0;
  left: 0;
  /* Force hardware acceleration */
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
}

/* Critical: Handle orientation changes more aggressively */
@media (orientation: portrait) {
  .vrm-viewer-container {
    height: 100vh !important;
    height: 100dvh !important;
  }
  
  .canvas-area {
    /* Force recalculation on orientation change */
    width: 100vw;
    max-width: 100%;
  }
}

@media (orientation: landscape) {
  .vrm-viewer-container {
    height: 100vh !important;
    height: 100dvh !important;
  }
  
  .canvas-area {
    /* Force recalculation on orientation change */
    width: 100vw;
    max-width: 100%;
  }
}

.ui-panel {
  flex-shrink: 0;
  overflow-y: auto;
  max-height: 200px;
  min-height: 120px;
  padding: 10px; 
  box-sizing: border-box;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
}

.controls {
  background: transparent;
  padding: 10px;
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
}

/* Mobile and orientation-specific optimizations */
@media (max-width: 768px) {
  .vrm-viewer-container {
    height: 100vh;
    height: 100dvh;
    min-height: unset;
  }
  
  .canvas-area {
    flex-basis: 0;
    min-height: 200px;
  }
  
  .ui-panel {
    max-height: 150px;
    min-height: 100px;
    padding: 8px;
    flex-shrink: 0;
  }
  
  .controls {
    gap: 6px;
    padding: 5px;
  }
  
  .controls button {
    padding: 6px 12px;
    font-size: 12px;
    flex: 1;
    min-width: 80px;
    max-width: 120px;
  }
}

/* Enhanced mobile portrait */
@media (max-width: 768px) and (orientation: portrait) {
  .vrm-viewer-container {
    height: 100vh !important;
    height: 100dvh !important;
    max-height: 100vh !important;
    max-height: 100dvh !important;
  }
  
  .canvas-area {
    flex-grow: 1;
    flex-basis: calc(100vh - 160px);
    min-height: 300px;
    max-height: calc(100vh - 160px);
  }
  
  .ui-panel {
    height: 160px !important;
    max-height: 160px !important;
    min-height: 160px !important;
    flex-shrink: 0;
    flex-grow: 0;
  }
  
  .controls {
    padding: 5px;
    gap: 5px;
  }
  
  .controls button {
    padding: 8px 12px;
    font-size: 11px;
    min-width: 70px;
    max-width: 110px;
  }
}

/* Enhanced mobile landscape */
@media (max-width: 768px) and (orientation: landscape) {
  .vrm-viewer-container {
    height: 100vh !important;
    height: 100dvh !important;
    max-height: 100vh !important;
    max-height: 100dvh !important;
  }
  
  .canvas-area {
    flex-grow: 1;
    flex-basis: calc(100vh - 100px);
    min-height: 150px;
    max-height: calc(100vh - 100px);
  }
  
  .ui-panel {
    height: 100px !important;
    max-height: 100px !important;
    min-height: 100px !important;
    flex-shrink: 0;
    flex-grow: 0;
  }
  
  .controls {
    padding: 2px;
    gap: 3px;
  }
  
  .controls button {
    padding: 3px 6px;
    font-size: 10px;
    min-width: 60px;
    max-width: 90px;
  }
}

.controls button {
  padding: 8px 15px;
  font-size: 14px;
  color: #fff;
  background-color: #007bff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  -webkit-tap-highlight-color: transparent; /* Remove tap highlight on mobile */
  touch-action: manipulation; /* Improve touch responsiveness */
}

.controls button:hover {
  background-color: #0056b3;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.controls button:active {
  background-color: #004085;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  transform: translateY(1px); /* Subtle press effect */
}

</style>
