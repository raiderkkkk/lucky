/**
 * skydome.js
 * ============================================================
 * Crea el Skydome: una esfera grande vista desde adentro
 * (THREE.BackSide) con el shader procedural rojo PS1.
 *
 * ¿Por qué una esfera invertida?
 *  - Al renderizar BackSide, los triángulos apuntan hacia
 *    adentro → vemos la cara interna de la esfera.
 *  - La cámara siempre está en el centro → el fondo parece
 *    infinito en todas las direcciones.
 *
 * El ShaderMaterial usa los archivos GLSL importados como
 * strings (Vite los carga con ?raw).
 *
 * Uniforms:
 *  - u_time: tiempo en segundos, actualizado en el game loop
 * ============================================================
 */

import * as THREE from 'three';
import vertexShader   from '../shaders/sky.vert.glsl?raw';
import fragmentShader from '../shaders/sky.frag.glsl?raw';

/**
 * Crea y retorna el mesh del skydome.
 * @returns {{ mesh: THREE.Mesh, uniforms: object }}
 */
export function createSkydome() {
  // Radio 150 unidades — suficientemente grande para envolver
  // toda la escena sin que la cámara lo atraviese.
  // Segmentos bajos (32×32) para look poligonal PS1.
  const geometry = new THREE.SphereGeometry(150, 32, 32);

  // Uniforms: variables que pasamos desde JS a los shaders
  const uniforms = {
    u_time: { value: 0.0 },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    side: THREE.BackSide,      // ← Renderizar cara interna
    depthWrite: false,         // El fondo no escribe al depth buffer
  });

  const mesh = new THREE.Mesh(geometry, material);

  // El skydome se mueve con la cámara (se añade como hijo en main.js)
  return { mesh, uniforms };
}
