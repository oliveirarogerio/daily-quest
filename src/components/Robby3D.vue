<script setup lang="ts">
/**
 * Robby3D.vue
 *
 * 3D model component for Robby the Robot using Three.js and GLB model.
 * Designed following ADHD-friendly principles with smooth animations
 * and minimal distractions.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three-stdlib'
import { computed, markRaw, onMounted, onUnmounted, ref, watch } from 'vue'

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'celebrating' | 'encouraging' | 'sleeping'
  animated?: boolean
  colorScheme?: 'default' | 'vibrant' | 'neon' | 'pastel'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'default',
  animated: true,
  colorScheme: 'vibrant',
})

const containerRef = ref<HTMLDivElement>()
const scene = ref<THREE.Scene | null>(null)
const renderer = ref<THREE.WebGLRenderer | null>(null)
const camera = ref<THREE.PerspectiveCamera | null>(null)
const robot = ref<THREE.Group | null>(null)
const mixer = ref<THREE.AnimationMixer | null>(null)
const clock = ref<THREE.Clock | null>(null)

const isAnimating = ref(false)
const isLoaded = ref(false)
const animationId = ref<number | null>(null)
const showSpeechBubble = ref(false)
const speechMessage = ref('')
const speechTimeout = ref<number | null>(null)

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64',
    xl: 'w-80 h-80',
  }
  return sizes[props.size]
})

const animationClasses = computed(() => {
  if (!props.animated) return ''

  const baseAnimation = 'transition-all duration-300 ease-in-out'

  switch (props.variant) {
    case 'celebrating':
      return `${baseAnimation} animate-celebration-dance`
    case 'encouraging':
      return `${baseAnimation} animate-encouraging-wiggle hover:scale-110`
    case 'sleeping':
      return `${baseAnimation} animate-sleeping-sway opacity-75`
    default:
      return `${baseAnimation} hover:scale-105`
  }
})

const initThreeJS = () => {
  if (!containerRef.value) return

  // Scene
  const newScene = new THREE.Scene()
  newScene.background = null // Remove background
  scene.value = markRaw(newScene)

  // Camera
  const newCamera = new THREE.PerspectiveCamera(
    75,
    containerRef.value.clientWidth / containerRef.value.clientHeight,
    0.1,
    1000,
  )
  newCamera.position.set(0, 0, 3) // Closer to the robot
  camera.value = markRaw(newCamera)

  // Renderer
  const newRenderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  })
  newRenderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  newRenderer.shadowMap.enabled = true
  newRenderer.shadowMap.type = THREE.PCFSoftShadowMap
  containerRef.value.appendChild(newRenderer.domElement)
  renderer.value = markRaw(newRenderer)

  // Enhanced Lighting for vibrant colors
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
  newScene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
  directionalLight.position.set(5, 5, 5)
  directionalLight.castShadow = true
  newScene.add(directionalLight)

  // Additional lights for more vibrant colors
  const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.4)
  fillLight.position.set(-5, 0, 5)
  newScene.add(fillLight)

  const rimLight = new THREE.DirectionalLight(0xff6b6b, 0.3)
  rimLight.position.set(0, 5, -5)
  newScene.add(rimLight)

  // Clock for animations
  clock.value = markRaw(new THREE.Clock())

  loadModel()
}

// Color schemes for different vibrant looks
const getColorScheme = (scheme: string) => {
  const schemes = {
    default: {
      primary: 0xadd8e6,
      secondary: 0xffffff,
      accent: 0x00bfff,
      dark: 0x333333,
    },
    vibrant: {
      primary: 0x00d4ff,
      secondary: 0xffffff,
      accent: 0xff6b6b,
      dark: 0x2c3e50,
    },
    neon: {
      primary: 0x00ff88,
      secondary: 0xffffff,
      accent: 0xff0080,
      dark: 0x1a1a2e,
    },
    pastel: {
      primary: 0xffb3d9,
      secondary: 0xfff0f5,
      accent: 0x87ceeb,
      dark: 0x696969,
    },
  }
  return schemes[scheme as keyof typeof schemes] || schemes.vibrant
}

// Function to modify materials for more vibrant colors
const enhanceMaterials = (object: THREE.Object3D) => {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const material = child.material as THREE.Material

      if (Array.isArray(material)) {
        material.forEach((mat) => {
          if (
            mat instanceof THREE.MeshStandardMaterial ||
            mat instanceof THREE.MeshLambertMaterial
          ) {
            // Enhance existing colors
            if (mat.color) {
              // Make colors more saturated and vibrant
              const hsl = { h: 0, s: 0, l: 0 }
              mat.color.getHSL(hsl)
              mat.color.setHSL(hsl.h, Math.min(hsl.s * 1.5, 1), Math.min(hsl.l * 1.2, 0.9))
            }

            // Add emissive properties for glow effect
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.emissive = new THREE.Color(0x000000)
              mat.emissiveIntensity = 0.1
            }

            // Increase metalness and roughness for more interesting reflections
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.metalness = 0.3
              mat.roughness = 0.4
            }
          }
        })
      } else if (
        material instanceof THREE.MeshStandardMaterial ||
        material instanceof THREE.MeshLambertMaterial
      ) {
        // Enhance single material
        if (material.color) {
          const hsl = { h: 0, s: 0, l: 0 }
          material.color.getHSL(hsl)
          material.color.setHSL(hsl.h, Math.min(hsl.s * 1.5, 1), Math.min(hsl.l * 1.2, 0.9))
        }

        if (material instanceof THREE.MeshStandardMaterial) {
          material.emissive = new THREE.Color(0x000000)
          material.emissiveIntensity = 0.1
          material.metalness = 0.3
          material.roughness = 0.4
        }
      }
    }
  })
}

const loadModel = async () => {
  if (!scene.value) return

  try {
    const loader = new GLTFLoader()

    loader.load(
      '/src/assets/cute+robot+3d+model.glb',
      (gltf) => {
        ;('GLB model loaded successfully')

        // Clean up previous model
        if (robot.value && scene.value) {
          scene.value.remove(robot.value)
        }

        // Get the model
        const model = gltf.scene

        // Enhance materials for more vibrant colors
        enhanceMaterials(model)

        // Scale the model to fit our view - made much bigger
        model.scale.setScalar(4)

        // Position the model and rotate to face the user
        model.position.set(0, -1, 0)
        model.rotation.y = -Math.PI / 2 // -90 degrees to face the user

        // Add the model to the scene
        robot.value = markRaw(model)
        if (scene.value) {
          scene.value.add(model)
        }

        // Setup animations if available
        if (gltf.animations && gltf.animations.length > 0) {
          mixer.value = markRaw(new THREE.AnimationMixer(model))

          // Play the first animation
          const action = mixer.value.clipAction(gltf.animations[0])
          action.play()
        }

        isLoaded.value = true
        animate()
      },
      (progress) => {
        ;('Loading progress:', (progress.loaded / progress.total) * 100 + '%')
      },
      (error) => {
        console.error('Failed to load GLB model:', error)
        // Fallback to placeholder
        createPlaceholderRobot()
        isLoaded.value = true
        animate()
      },
    )
  } catch (error) {
    console.error('Failed to load 3D model:', error)
    createPlaceholderRobot()
    isLoaded.value = true
    animate()
  }
}

const createPlaceholderRobot = () => {
  if (!scene.value) return

  const colors = getColorScheme(props.colorScheme)

  // Create a simple robot placeholder
  const group = new THREE.Group()
  group.scale.setScalar(2) // Make placeholder much bigger too
  group.rotation.y = -Math.PI / 2 // -90 degrees to face the user

  // Body - using vibrant colors
  const bodyGeometry = new THREE.BoxGeometry(1, 1.5, 0.8)
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: colors.primary,
    metalness: 0.3,
    roughness: 0.4,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0.1,
  })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.position.y = 0
  group.add(body)

  // Head
  const headGeometry = new THREE.SphereGeometry(0.6, 32, 32)
  const headMaterial = new THREE.MeshStandardMaterial({
    color: colors.secondary,
    metalness: 0.2,
    roughness: 0.3,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0.05,
  })
  const head = new THREE.Mesh(headGeometry, headMaterial)
  head.position.y = 1.2
  group.add(head)

  // Eyes - more vibrant
  const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16)
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: colors.accent,
    emissive: new THREE.Color(colors.accent),
    emissiveIntensity: 0.3,
    metalness: 0.8,
    roughness: 0.1,
  })

  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
  leftEye.position.set(-0.2, 1.3, 0.4)
  group.add(leftEye)

  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
  rightEye.position.set(0.2, 1.3, 0.4)
  group.add(rightEye)

  // Arms
  const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8)
  const armMaterial = new THREE.MeshStandardMaterial({
    color: colors.primary,
    metalness: 0.3,
    roughness: 0.4,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0.1,
  })

  const leftArm = new THREE.Mesh(armGeometry, armMaterial)
  leftArm.position.set(-0.8, 0.5, 0)
  leftArm.rotation.z = Math.PI / 4
  group.add(leftArm)

  const rightArm = new THREE.Mesh(armGeometry, armMaterial)
  rightArm.position.set(0.8, 0.5, 0)
  rightArm.rotation.z = -Math.PI / 4
  group.add(rightArm)

  // Legs
  const legGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1, 8)
  const legMaterial = new THREE.MeshStandardMaterial({
    color: colors.dark,
    metalness: 0.5,
    roughness: 0.6,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0.05,
  })

  const leftLeg = new THREE.Mesh(legGeometry, legMaterial)
  leftLeg.position.set(-0.3, -1.2, 0)
  group.add(leftLeg)

  const rightLeg = new THREE.Mesh(legGeometry, legMaterial)
  rightLeg.position.set(0.3, -1.2, 0)
  group.add(rightLeg)

  robot.value = markRaw(group)
  scene.value.add(group)

  // Setup animation mixer
  mixer.value = markRaw(new THREE.AnimationMixer(group))
}

const animate = () => {
  if (!renderer.value || !scene.value || !camera.value) return

  animationId.value = requestAnimationFrame(animate)

  if (mixer.value && clock.value) {
    mixer.value.update(clock.value.getDelta())
  }

  // Gentle floating animation
  if (robot.value && props.animated) {
    // Removed rotation - robot will stay in fixed orientation

    if (props.variant === 'celebrating' && isAnimating.value) {
      robot.value.position.y = Math.sin(Date.now() * 0.01) * 0.2
    } else if (props.variant === 'encouraging') {
      robot.value.position.y = Math.sin(Date.now() * 0.005) * 0.1
    }
  }

  renderer.value.render(scene.value, camera.value)
}

const triggerCelebration = () => {
  if (props.variant === 'celebrating') {
    isAnimating.value = true
    showSpeechMessage(getCelebrationMessage())
    setTimeout(() => {
      isAnimating.value = false
    }, 3000)
  }
}

const showSpeechMessage = (message: string) => {
  speechMessage.value = message
  showSpeechBubble.value = true

  // Clear existing timeout
  if (speechTimeout.value) {
    clearTimeout(speechTimeout.value)
  }

  // Hide speech bubble after 4 seconds
  speechTimeout.value = setTimeout(() => {
    showSpeechBubble.value = false
    speechMessage.value = ''
  }, 4000)
}

const getEncouragingMessage = () => {
  const messages = ['Cada tarefa te deixa mais forte!']
  return messages[Math.floor(Math.random() * messages.length)]
}

const getCelebrationMessage = () => {
  const messages = ['Você está ficando mais forte!']
  return messages[Math.floor(Math.random() * messages.length)]
}

const getSleepingMessage = () => {
  const messages = ['Hora de descansar para ficar mais forte!']
  return messages[Math.floor(Math.random() * messages.length)]
}

const handleResize = () => {
  if (!containerRef.value || !camera.value || !renderer.value) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  camera.value.aspect = width / height
  camera.value.updateProjectionMatrix()
  renderer.value.setSize(width, height)
}

watch(
  () => props.variant,
  (newVariant) => {
    if (newVariant === 'celebrating') {
      triggerCelebration()
    } else if (newVariant === 'encouraging') {
      showSpeechMessage(getEncouragingMessage())
    } else if (newVariant === 'sleeping') {
      showSpeechMessage(getSleepingMessage())
    }
  },
  { immediate: true },
)

// Watch for color scheme changes and update materials
watch(
  () => props.colorScheme,
  () => {
    if (robot.value) {
      enhanceMaterials(robot.value)
    }
  },
)

onMounted(() => {
  initThreeJS()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)

  // Clear speech timeout
  if (speechTimeout.value) {
    clearTimeout(speechTimeout.value)
  }

  // Cancel animation loop
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
  }

  // Clean up Three.js objects
  if (mixer.value) {
    mixer.value.stopAllAction()
  }

  if (renderer.value) {
    renderer.value.dispose()
  }

  if (scene.value) {
    scene.value.clear()
  }
})
</script>

<template>
  <div class="flex flex-col items-center space-y-2">
    <!-- Speech Bubble -->
    <div
      v-if="showSpeechBubble"
      class="absolute bottom-full mb-4 left-1/2 transform -translate-x-1/2 z-40 animate-fade-in"
    >
      <div class="bg-white rounded-2xl px-4 py-3 shadow-lg border-2 border-blue-200 max-w-64">
        <div class="text-center text-sm font-medium text-gray-800 leading-relaxed">
          {{ speechMessage }}
        </div>
        <!-- Speech bubble tail -->
        <div class="absolute top-full left-1/2 transform -translate-x-1/2">
          <div
            class="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"
          ></div>
        </div>
      </div>
    </div>

    <div
      :class="[
        sizeClasses,
        animationClasses,
        'relative flex items-center justify-center',
        isAnimating && 'animate-bounce',
      ]"
    >
      <div
        ref="containerRef"
        class="w-full h-full rounded-lg overflow-hidden"
        :class="{ 'opacity-0': !isLoaded }"
      />

      <!-- Celebration overlay with multiple effects -->
      <div
        v-if="variant === 'celebrating' && isAnimating"
        class="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div class="text-6xl animate-ping">🎉</div>
      </div>

      <!-- Encouraging sparkles -->
      <div
        v-if="variant === 'encouraging'"
        class="absolute inset-0 flex items-center justify-center pointer-events-none"
      ></div>

      <!-- Sleeping zzz -->
      <div
        v-if="variant === 'sleeping'"
        class="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div class="text-3xl animate-pulse opacity-60">😴</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

/* ADHD-friendly animations - subtle and calming */
.animate-bounce {
  animation: bounce 1s ease-in-out;
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

/* Speech bubble fade-in animation */
@keyframes fade-in {
  0% {
    opacity: 0;
    transform: translate(-50%, -10px) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

/* Celebration dance animation */
@keyframes celebration-dance {
  0%,
  100% {
    transform: rotate(0deg) scale(1);
  }
  25% {
    transform: rotate(-5deg) scale(1.05);
  }
  75% {
    transform: rotate(5deg) scale(1.05);
  }
}

.animate-celebration-dance {
  animation: celebration-dance 0.5s ease-in-out infinite;
}

/* Encouraging wiggle */
@keyframes encouraging-wiggle {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(2deg);
  }
  75% {
    transform: rotate(-2deg);
  }
}

.animate-encouraging-wiggle {
  animation: encouraging-wiggle 2s ease-in-out infinite;
}

/* Sleeping gentle sway */
@keyframes sleeping-sway {
  0%,
  100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(1deg);
  }
}

.animate-sleeping-sway {
  animation: sleeping-sway 3s ease-in-out infinite;
}
</style>
