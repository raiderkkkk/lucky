/**
 * lighting.js
 * ============================================================
 * Iluminación mínima estilo PS1.
 *
 * PS1 no tenía hardware de iluminación per-pixel:
 * calculaba la luz por vértice (vertex lighting).
 * Three.js hace lo mismo con MeshLambertMaterial.
 *
 * Setup:
 *  - AmbientLight suave → ilumina todo uniformemente (base)
 *  - DirectionalLight tenue → da algo de forma sin sombras
 *
 * Sin sombras (castShadow = false) para mantener la estética.
 * ============================================================
 */

import * as THREE from 'three';

/**
 * Añade las luces PS1 a la escena.
 * @param {THREE.Scene} scene
 */
export function setupLighting(scene) {
  // Luz ambiente neutra y suave: mantiene los colores reales del
  // cartel (verde bosque / crema) sin teñirlos de rojo.
  const ambient = new THREE.AmbientLight(
    0x404040, // Gris neutro suave
    1.4       // Intensidad
  );
  scene.add(ambient);

  // Luz direccional cálida desde arriba — da calidez de madera
  // y algo de forma al cartel y al poste.
  const dirLight = new THREE.DirectionalLight(0xffd9a0, 0.9);
  dirLight.position.set(5, 10, 5);
  dirLight.castShadow = false; // Sin sombras → estética PS1
  scene.add(dirLight);

  // Luz de relleno fría desde abajo para evitar negro total
  const fillLight = new THREE.DirectionalLight(0x2a3550, 0.35);
  fillLight.position.set(-5, -5, -5);
  scene.add(fillLight);
}
