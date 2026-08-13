// ============================================================
// VERTEX SHADER — Skydome PS1
// Transforma cada vértice de la esfera invertida al espacio
// de clip y pasa las coordenadas UV al fragment shader.
// ============================================================

varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;

  // Posicionamos la esfera siempre centrada en la cámara
  // para que el fondo parezca infinito.
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
