/**
 * scene.js
 * ============================================================
 * Crea la escena Three.js y la cámara perspectiva.
 *
 * Cámara:
 *  - FOV 75°  → campo de visión amplio, sensación inmersiva
 *  - Near 0.1 → puede ver objetos muy cercanos
 *  - Far 2000 → cubre el radio del skydome (150 unidades)
 *    con margen para objetos lejanos
 *
 * La escena no tiene fog ni background color propio:
 * el skydome cubre todo el fondo visualmente.
 * ============================================================
 */

import * as THREE from 'three';

/**
 * @returns {{ scene: THREE.Scene, camera: THREE.PerspectiveCamera }}
 */
export function createScene() {
  const scene = new THREE.Scene();

  // Fondo negro puro como fallback si el skydome falla
  scene.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(
    75,                                    // FOV en grados
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1,                                   // Near clipping plane
    2000                                   // Far clipping plane
  );

  // Cámara elevada y retirada para admirar la atmósfera general al
  // entrar a la página (el slider de zoom acerca para leer el cartel)
  camera.position.set(0, 4, 13);

  // Actualizar aspect ratio al redimensionar
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  return { scene, camera };
}
