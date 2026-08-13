/**
 * main.js  (v2 — zoom automático al cartel)
 * ============================================================
 * Cambios respecto a v1:
 *
 *  1. Pasa el renderer a createSign() para configurar
 *     anisotropía máxima en las texturas del cartel.
 *
 *  2. ZOOM GRADUABLE (CONTINUO)
 *     En vez de un zoom binario (cerca/lejos), la cámara se
 *     acerca de forma continua mediante un factor zoomFactor
 *     (0 = posición normal, 1 = zoom máximo). Se ajusta con:
 *       - Rueda del mouse (escritorio)
 *       - La tecla F / botón "ZOOM" como atajo de toggle
 *       - (en pasos siguientes: pinch táctil y slider UI)
 *
 *     La lógica usa THREE.Vector3.lerp() para interpolar la
 *     posición objetivo cada frame del game loop.
 * ============================================================
 */

import * as THREE         from 'three';
import { createRenderer } from './core/renderer.js';
import { createScene }    from './core/scene.js';
import { setupLighting }  from './core/lighting.js';
import { setupControls }  from './core/controls.js';
import { createSkydome }  from './objects/skydome.js';
import { createSign }     from './objects/sign.js';

// ── 1. Inicialización ────────────────────────────────────────
const renderer          = createRenderer();
const { scene, camera } = createScene();

setupLighting(scene);

// ── 2. Skydome ───────────────────────────────────────────────
const { mesh: skyMesh, uniforms: skyUniforms } = createSkydome();
camera.add(skyMesh);
scene.add(camera);

// ── 3. Cartel ────────────────────────────────────────────────
// <style> que estiliza el slider de zoom según el tema del cartel.
// Se actualiza en cada cambio de tema (applyZoomTheme).
const zoomThemeStyle = document.createElement('style');
zoomThemeStyle.id    = 'zoom-theme-style';
document.head.appendChild(zoomThemeStyle);

/**
 * Aplica el color de acento del tema al slider de zoom.
 * Tanto el track como el thumb usan el color del tema para que la
 * UI "alterne" junto con la apariencia del cartel.
 * @param {{accent:string}} theme
 */
function applyZoomTheme(theme) {
  const a = theme.accent;
  zoomThemeStyle.textContent = `
    #zoom-slider {
      background: ${a}55;
      border: 1px solid ${a};
    }
    #zoom-slider::-webkit-slider-thumb {
      -webkit-appearance: none; appearance: none;
      width: 28px; height: 28px; border-radius: 50%;
      background: ${a}; border: 2px solid #000; cursor: pointer;
    }
    #zoom-slider::-moz-range-thumb {
      width: 28px; height: 28px; border-radius: 50%;
      background: ${a}; border: 2px solid #000; cursor: pointer;
    }
  `;
}

// Pasamos renderer (anisotropía) y onThemeChange para estilizar el zoom
const sign = createSign(renderer, applyZoomTheme);
scene.add(sign);

// ── 4. Controles ─────────────────────────────────────────────
// Pasamos el callback de pinch para que el zoom graduable también
// responda al pellizco en pantallas táctiles.
setupControls(camera, renderer.domElement, (delta) => {
  setZoomTarget(zoomFactorTarget + delta);
});

// ── 5. Sistema de zoom graduable ────────────────────────────
// Posición "normal" de la cámara: más retirada para apreciar la
// atmósfera general y dejar recorrido al slider de zoom (de aquí
// al acercamiento se lee el cartel).
const POS_NORMAL = new THREE.Vector3(0, 4, 13);

// Posición de zoom máximo: frente al cartel (ahora más grande),
// a una distancia cómoda para leer los mensajes con nitidez
const POS_ZOOM   = new THREE.Vector3(0, 1.5, 2.5);

// Velocidad de interpolación: 0.08 = suave, 0.2 = rápido
const LERP_SPEED = 0.08;

// Factor continuo de zoom:
//   0   = posición normal (lejos del cartel)
//   1   = acercamiento máximo
//   0..1 = cualquier punto intermedio (zoom graduable)
let zoomFactor       = 0;
let zoomFactorTarget = 0;
let isZoomed         = false;
let zoomSlider       = null; // Referencia al slider UI (se crea en §6)

/** Define el objetivo de zoom (0..1) y sincroniza el estado/UI */
function setZoomTarget(value) {
  zoomFactorTarget = Math.max(0, Math.min(1, value));
  isZoomed = zoomFactorTarget > 0.5;
  updateZoomBtn();
  // Reflejar el cambio en el slider (por si viene de rueda/pinch/F)
  if (zoomSlider) zoomSlider.value = String(Math.round(zoomFactorTarget * 100));
}

/** Alterna entre sin zoom y zoom máximo (atajo F / botón) */
function toggleZoom() {
  setZoomTarget(isZoomed ? 0 : 1);
}

function updateZoomBtn() {
  const btn = document.getElementById('zoom-btn');
  if (btn) btn.textContent = isZoomed ? '🔍 SALIR' : '🔍 ZOOM';
}

// Tecla F para zoom (toggle rápido)
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyF') toggleZoom();
});

// Rueda del mouse: zoom graduable continuo (escritorio)
window.addEventListener('wheel', (e) => {
  setZoomTarget(zoomFactorTarget - e.deltaY * 0.0008);
}, { passive: true });

// ── 6. UI de zoom ────────────────────────────────────────────
// Solo slider graduable (centrado). El botón de toggle se removió
// para evitar confusión con el slider. La tecla F sigue como atajo.
const zoomUI = document.createElement('div');
zoomUI.style.cssText = `
  position: fixed;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
`;

// Slider de zoom graduable (funciona en móvil y escritorio)
const zoomSliderEl = document.createElement('input');
zoomSliderEl.type    = 'range';
zoomSliderEl.id      = 'zoom-slider';
zoomSliderEl.min     = '0';
zoomSliderEl.max     = '100';
zoomSliderEl.value   = '0';
zoomSliderEl.style.cssText = `
  -webkit-appearance: none;
  appearance: none;
  width: 340px;
  height: 10px;
  border-radius: 5px;
  outline: none;
  cursor: pointer;
`;
zoomSliderEl.addEventListener('input', (e) => {
  setZoomTarget(Number(e.target.value) / 100);
});

zoomUI.appendChild(zoomSliderEl);
document.body.appendChild(zoomUI);

// Guardamos la referencia para que setZoomTarget sincronice el slider
zoomSlider = zoomSliderEl;

// ── 7. Reloj ─────────────────────────────────────────────────
const clock = new THREE.Clock();

// ── 8. Game Loop ─────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();

  // Animar fondo
  skyUniforms.u_time.value = elapsed;

  // Actualizar cartel
  if (sign.userData.update) sign.userData.update(elapsed);

  // Interpolar el factor de zoom hacia su objetivo (suavizado)
  zoomFactor += (zoomFactorTarget - zoomFactor) * LERP_SPEED;

  // Posición objetivo continua: interpola entre normal y zoom máximo
  // según el factor actual. lerp() avanza el factor de la distancia.
  const zoomTarget = new THREE.Vector3().copy(POS_NORMAL)
    .lerp(POS_ZOOM, zoomFactor);

  // Mover la cámara hacia el target. La rotación (yaw/pitch) sigue
  // funcionando con independencia del nivel de zoom.
  camera.position.lerp(zoomTarget, LERP_SPEED);

  renderer.render(scene, camera);
}

animate();
