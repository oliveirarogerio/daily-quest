<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';

const containerRef = ref<HTMLDivElement | null>(null);
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let particles: THREE.Points;
let animationFrameId: number;

const initThree = () => {
  if (!containerRef.value) return;

  // Scene setup
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  containerRef.value.appendChild(renderer.domElement);

  // Create particles
  const particlesGeometry = new THREE.BufferGeometry();
  const particleCount = 1000;
  const posArray = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 10;
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

  // Create material with custom color matching your theme
  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.005,
    color: 0x6a5acd, // Matches your theme color
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });

  particles = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particles);

  camera.position.z = 3;

  // Handle window resize
  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  window.addEventListener('resize', handleResize);

  // Animation loop
  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);

    particles.rotation.x += 0.0001;
    particles.rotation.y += 0.0002;

    // Add subtle wave motion
    const positions = particles.geometry.attributes.position.array;
    const time = Date.now() * 0.0001;

    for(let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      positions[i + 1] = Math.sin(x + time) * Math.cos(z + time) * 0.3;
    }

    particles.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  };

  animate();

  // Cleanup function
  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    if (containerRef.value) {
      containerRef.value.removeChild(renderer.domElement);
    }
    particlesGeometry.dispose();
    particlesMaterial.dispose();
    renderer.dispose();
  });
};

onMounted(() => {
  initThree();
});
</script>

<template>
  <div ref="containerRef" class="background-animation"></div>
</template>

<style scoped>
.background-animation {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}
</style>
