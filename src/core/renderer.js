/**
 * renderer.js
 * ============================================================
 * Configura el WebGLRenderer de Three.js con la estética PS1:
 *
 *  - Sin antialiasing     → bordes pixelados característicos
 *  - Resolución reducida  → se renderiza a ~320x240 y se escala
 *  - Tone mapping plano   → sin corrección de color moderna
 *  - sRGB output          → color correcto en pantalla
 *
 * La baja resolución de render es EL truco principal para
 * conseguir el look PS1 sin shaders extra de post-proceso.
 * ============================================================
 */

import * as THREE from 'three';

// Factor de escala de píxel: 0.25 = render a 1/4 de resolución
// Aumenta para más calidad, baja para más estética retro.
const PS1_PIXEL_SCALE = 0.25;

/**
 * Crea y configura el renderer PS1.
 * @returns {THREE.WebGLRenderer}
 */
export function createRenderer() {
  const renderer = new THREE.WebGLRenderer({
    antialias: false,          // ← Sin suavizado de bordes (PS1 look)
    powerPreference: 'default',
  });

  // Resolución baja: renderiza a escala reducida
  // pixelRatio × CSS-size = resolución real de render
  renderer.setPixelRatio(window.devicePixelRatio * PS1_PIXEL_SCALE);
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Sin tone mapping moderno para preservar colores planos
  renderer.toneMapping     = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // El canvas llena toda la ventana
  renderer.domElement.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
  `;

  document.body.appendChild(renderer.domElement);

  // Redimensionar con la ventana manteniendo el pixel scale
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return renderer;
}
