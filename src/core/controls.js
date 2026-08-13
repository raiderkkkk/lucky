/**
 * controls.js
 * ============================================================
 * Control de cámara con el mouse (look-around).
 *
 * Implementación manual sin librerías extra:
 *  - Click para bloquear el puntero (Pointer Lock API)
 *  - Mover el mouse rota la cámara (yaw + pitch)
 *  - ESC desbloquea el puntero
 *
 * ¿Por qué no usar OrbitControls de Three.js?
 *  - OrbitControls orbita alrededor de un punto externo.
 *  - Queremos un control FPS (primera persona) donde la
 *    cámara rota sobre sí misma, como en un juego PS1.
 *
 * Límites de pitch: ±85° para no pasar el cénit/nadir.
 *
 * Soporte táctil (móvil):
 *  - Arrastre de 1 dedo  → mirar alrededor (yaw/pitch)
 *  - Pellizco de 2 dedos → zoom graduable (vía onPinchZoom)
 * ============================================================
 */

// Sensibilidad del mouse (ajustable)
const MOUSE_SENSITIVITY = 0.002;

// Factor extra para el arrastre táctil (más directo que el mouse)
const TOUCH_LOOK_SENSITIVITY = MOUSE_SENSITIVITY * 1.5;

// Límites verticales en radianes (±85°)
const PITCH_LIMIT = Math.PI / 2 - 0.1;

/**
 * Configura los controles de cámara FPS.
 * @param {THREE.Camera} camera
 * @param {HTMLElement}  domElement
 * @param {(delta:number)=>void} [onPinchZoom] Ajuste de zoom en pellizco
 */
export function setupControls(camera, domElement, onPinchZoom) {
  let yaw   = 0; // Rotación horizontal (izq/der)
  let pitch = 0; // Rotación vertical (arriba/abajo)

  // ── Pointer Lock ─────────────────────────────────────────
  // Al hacer click en el canvas, bloqueamos el cursor
  domElement.addEventListener('click', () => {
    domElement.requestPointerLock();
  });

  // ── Movimiento del mouse ──────────────────────────────────
  document.addEventListener('mousemove', (e) => {
    // Solo procesar si el puntero está bloqueado
    if (document.pointerLockElement !== domElement) return;

    yaw   -= e.movementX * MOUSE_SENSITIVITY;
    pitch -= e.movementY * MOUSE_SENSITIVITY;

    // Limitar pitch para no girar completamente
    pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));

    // Aplicar rotaciones a la cámara
    // Orden: primero yaw (Y), luego pitch (X) — estándar FPS
    camera.rotation.order = 'YXZ';
    camera.rotation.y     = yaw;
    camera.rotation.x     = pitch;
  });

  // ── Soporte táctil (móvil) ─────────────────────────────────
  // En móvil no hay Pointer Lock ni teclado: usamos eventos touch
  // para mirar (drag de 1 dedo) y para zoom (pinch de 2 dedos).
  let touchMode     = null;  // 'drag' | 'pinch' | null
  let lastTouchX    = 0;
  let lastTouchY    = 0;
  let lastPinchDist = 0;

  const getPinchDist = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  domElement.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchMode  = 'drag';
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      touchMode      = 'pinch';
      lastPinchDist  = getPinchDist(e.touches);
    }
    e.preventDefault(); // Evita scroll/zoom nativo de la página
  }, { passive: false });

  domElement.addEventListener('touchmove', (e) => {
    if (touchMode === 'drag' && e.touches.length === 1) {
      // Mirar alrededor arrastrando (igual que el mouse)
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      yaw   -= (x - lastTouchX) * TOUCH_LOOK_SENSITIVITY;
      pitch -= (y - lastTouchY) * TOUCH_LOOK_SENSITIVITY;
      pitch  = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));
      lastTouchX = x;
      lastTouchY = y;

      camera.rotation.order = 'YXZ';
      camera.rotation.y     = yaw;
      camera.rotation.x     = pitch;
    } else if (touchMode === 'pinch' && e.touches.length === 2) {
      // Pellizcar: distancia menor = acercar (zoom +)
      const dist  = getPinchDist(e.touches);
      const delta = (lastPinchDist - dist) * 0.003;
      lastPinchDist = dist;
      if (onPinchZoom) onPinchZoom(delta);
    }
    e.preventDefault();
  }, { passive: false });

  domElement.addEventListener('touchend', (e) => {
    // Al soltar un dedo durante pinch, volvemos a drag con el restante
    if (e.touches.length === 0) {
      touchMode = null;
    } else if (e.touches.length === 1) {
      touchMode  = 'drag';
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
    }
  }, { passive: false });
}
