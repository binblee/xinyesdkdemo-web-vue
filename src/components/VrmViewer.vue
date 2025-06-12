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
  // Handle orientation changes with longer delay to ensure DOM is ready
  clearTimeout(orientationChangeTimeout);
  orientationChangeTimeout = setTimeout(() => {
    // Force a complete recalculation after orientation change
    if (canvasContainer.value) {
      // Temporarily force container to recalculate its size
      const container = canvasContainer.value;
      const currentDisplay = container.style.display;
      container.style.display = 'none';
      container.offsetHeight; // Trigger reflow
      container.style.display = currentDisplay;
      
      // Now resize with the new dimensions
      setTimeout(() => {
        onWindowResize();
      }, 50);
    }
  }, 500); // Longer delay for orientation changes
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
  setTimeout(() => {
    onWindowResize();
  }, 100);
}

// Expose forceResize for debugging purposes (can be called from browser console)
if (typeof window !== 'undefined') {
  window.vrmForceResize = forceResize;
}
</script>

<style scoped>
.vrm-viewer-container { /* MODIFIED: Was generic 'div' */
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh; /* Use full viewport height for better mobile support */
  max-height: 100vh;
  min-height: 400px; /* Minimum height fallback */
  position: relative;
}

.canvas-area { /* ADDED: Style for the canvas container */
  flex-grow: 1;
  width: 100%;
  min-height: 0; /* Important for flex children */
  position: relative; /* If canvas inside needs absolute positioning */
  overflow: hidden; /* ADDED: Prevent content from spilling out and overlapping siblings */
  transition: all 0.3s ease; /* Smooth transition during orientation changes */
}

.ui-panel { /* ADDED: New panel for all UI controls */
  flex-shrink: 0; /* Do not allow this panel to shrink */
  overflow-y: auto; /* Allow vertical scrolling if content is too tall */
  max-height: 200px; /* Fixed height for controls */
  min-height: 120px; /* Minimum height for controls */
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
    height: 100dvh; /* Use dynamic viewport height if supported */
  }
  
  .ui-panel {
    max-height: 150px;
    min-height: 100px;
    padding: 8px;
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

/* Landscape orientation optimizations */
@media (max-width: 768px) and (orientation: landscape) {
  .vrm-viewer-container {
    height: 100vh;
    height: 100dvh;
  }
  
  .ui-panel {
    max-height: 120px;
    min-height: 80px;
  }
  
  .controls {
    padding: 3px;
    gap: 4px;
  }
  
  .controls button {
    padding: 4px 8px;
    font-size: 11px;
    min-width: 70px;
    max-width: 100px;
  }
}

/* Portrait orientation optimizations */
@media (max-width: 768px) and (orientation: portrait) {
  .vrm-viewer-container {
    height: 100vh;
    height: 100dvh;
  }
  
  .canvas-area {
    /* Give more space to the 3D view in portrait mode */
    flex-grow: 2;
  }
  
  .ui-panel {
    max-height: 180px;
    min-height: 120px;
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
