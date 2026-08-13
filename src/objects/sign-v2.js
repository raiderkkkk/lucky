/**
 * sign.js  (v2 — con mensajes en bitmap font)
 * ============================================================
 * Cambios respecto a v1:
 *
 *  1. makeTextTexture()  — dibuja texto sobre un canvas 2D y lo
 *     convierte en THREE.CanvasTexture para usarlo como material.
 *
 *  2. wrapText()         — corta líneas largas automáticamente
 *     para que el texto no se salga de la cara del cubo.
 *
 *  3. Las 4 caras laterales (+X -X +Z -Z) muestran el mensaje
 *     actual; techo y suelo conservan color sólido.
 *
 *  4. group.userData.update() ahora alterna mensajes cada
 *     MESSAGE_INTERVAL segundos llamando a refreshFaces().
 *
 * Dependencia de fuente:
 *  Añadir en index.html (dentro de <head>):
 *  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
 *
 * ¿Por qué CanvasTexture?
 *  WebGL no dibuja texto directamente. El flujo es:
 *    JS dibuja en <canvas> offscreen → Three.js sube el
 *    canvas a la GPU como textura → se aplica al material.
 *  Al marcar texture.needsUpdate = true Three.js re-sube
 *  el canvas en el siguiente render, aplicando los cambios.
 * ============================================================
 */

import * as THREE from 'three';

// ── Configuración de mensajes ─────────────────────────────────

/** Mensajes que rotan en las caras del cartel */
const MESSAGES = [
  'FONDO\nDEL\nMUNDO',
  'PRESS\nSTART',
  'INSERT\nCOIN',
  'RETRO\nPS1',
];

/** Segundos entre cada cambio de mensaje */
const MESSAGE_INTERVAL = 3;

/** Resolución del canvas de cada cara (potencia de 2, requerido por WebGL) */
const CANVAS_SIZE = 256;

// ── Colores de fondo por cara lateral ────────────────────────
// Orden Three.js para BoxGeometry: +X, -X, +Y, -Y, +Z, -Z
const FACE_BG_COLORS = [
  '#3b0764', // +X  morado oscuro
  '#1e1b4b', // -X  índigo oscuro
  null,       // +Y  techo  (color sólido, sin texto)
  null,       // -Y  suelo  (color sólido, sin texto)
  '#4a1d96', // +Z  violeta
  '#2e1065', // -Z  púrpura oscuro
];

// ── Utilidades de canvas ──────────────────────────────────────

/**
 * Rompe un string largo en líneas que caben en maxWidth píxeles.
 * Respeta los saltos de línea explícitos (\n) del mensaje.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string}  text
 * @param {number}  x           Centro horizontal del texto
 * @param {number}  startY      Y de la primera línea
 * @param {number}  maxWidth    Ancho máximo en píxeles
 * @param {number}  lineHeight  Altura de cada línea en píxeles
 */
function wrapText(ctx, text, x, startY, maxWidth, lineHeight) {
  // Separar primero por \n explícitos del mensaje
  const paragraphs = text.split('\n');
  const allLines   = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(' ');
    let   line  = '';

    for (const word of words) {
      const testLine  = line ? `${line} ${word}` : word;
      const { width } = ctx.measureText(testLine);

      if (width > maxWidth && line) {
        allLines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    }
    allLines.push(line);
  }

  // Centrar verticalmente el bloque de texto
  const totalHeight = allLines.length * lineHeight;
  let   y           = startY - totalHeight / 2 + lineHeight / 2;

  for (const line of allLines) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
}

/**
 * Dibuja un mensaje sobre el canvas de una cara.
 * Llama a esto también para "refrescar" el mensaje:
 * borra el canvas y vuelve a dibujar.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} message    Texto a mostrar (acepta \n)
 * @param {string} bgColor    Color CSS del fondo
 */
function drawMessage(ctx, message, bgColor) {
  const size = ctx.canvas.width;

  // 1. Borrar canvas
  ctx.clearRect(0, 0, size, size);

  // 2. Fondo de la cara
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  // 3. Borde decorativo interior (estilo pantalla retro)
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth   = 6;
  ctx.strokeRect(10, 10, size - 20, size - 20);

  // Borde interior más fino
  ctx.strokeStyle = '#7c3aed';
  ctx.lineWidth   = 2;
  ctx.strokeRect(16, 16, size - 32, size - 32);

  // 4. Texto con fuente bitmap
  // "Press Start 2P" debe estar cargada (ver index.html)
  // Fallback: 'monospace' para desarrollo sin internet
  ctx.font         = `22px "Press Start 2P", monospace`;
  ctx.fillStyle    = '#FFD700';   // Dorado — contrasta con morados
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  // Sombra del texto para look retro
  ctx.shadowColor   = '#ff0000';
  ctx.shadowBlur    = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  wrapText(ctx, message, size / 2, size / 2, size - 48, 34);

  // Limpiar shadow para que no afecte otros draws
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur  = 0;
}

/**
 * Crea canvas + contexto + CanvasTexture para una cara lateral.
 *
 * @param {string} message   Texto inicial
 * @param {string} bgColor   Color CSS del fondo
 * @returns {{ canvas, ctx, texture }}
 */
function createFaceCanvas(message, bgColor) {
  const canvas  = document.createElement('canvas');
  canvas.width  = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  const ctx     = canvas.getContext('2d');
  drawMessage(ctx, message, bgColor);

  // CanvasTexture: Three.js envuelve el canvas como textura WebGL.
  // needsUpdate = true le dice que re-suba el canvas a la GPU.
  const texture          = new THREE.CanvasTexture(canvas);
  texture.minFilter      = THREE.LinearFilter; // Evita artefactos de mipmap
  texture.generateMipmaps = false;

  return { canvas, ctx, texture, bgColor };
}

// ── Función principal ─────────────────────────────────────────

/**
 * Crea el grupo completo (poste + cartel con mensajes rotativos).
 * @returns {THREE.Group}
 */
export function createSign() {
  const group = new THREE.Group();

  // ── Poste ────────────────────────────────────────────────
  const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 6, 6);
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x333344 });
  const pole    = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = -1;
  group.add(pole);

  // ── Base del poste ───────────────────────────────────────
  const baseGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.2, 8);
  const baseMat = new THREE.MeshLambertMaterial({ color: 0x222233 });
  const base    = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = -4.1;
  group.add(base);

  // ── Crear canvas/textura para cada cara lateral ──────────
  // Índices 0,1,4,5 = caras laterales (+X -X +Z -Z)
  // Índices 2,3     = techo y suelo (color sólido)
  let currentMsgIndex = 0;

  // faceData[i] existe solo para las caras con texto (FACE_BG_COLORS[i] !== null)
  const faceData = FACE_BG_COLORS.map((bgColor) => {
    if (bgColor === null) return null;
    return createFaceCanvas(MESSAGES[currentMsgIndex], bgColor);
  });

  // ── Construir los 6 materiales del cubo ─────────────────
  const signMaterials = FACE_BG_COLORS.map((bgColor, i) => {
    if (faceData[i]) {
      // Cara con texto: usar la textura del canvas
      return new THREE.MeshLambertMaterial({
        map:              faceData[i].texture,
        emissiveMap:      faceData[i].texture,
        emissive:         new THREE.Color(0x220033),
        emissiveIntensity: 0.15,
      });
    } else {
      // Techo y suelo: color sólido (igual que v1)
      const color = i === 2 ? 0xfbbf24 : 0x78350f;
      return new THREE.MeshLambertMaterial({
        color,
        emissive:         new THREE.Color(color).multiplyScalar(0.2),
        emissiveIntensity: 0.3,
      });
    }
  });

  const signGeo = new THREE.BoxGeometry(2, 2, 2);
  const sign    = new THREE.Mesh(signGeo, signMaterials);
  sign.position.y = 2.5;
  group.add(sign);

  // ── Bordes del cartel ────────────────────────────────────
  const edgesGeo = new THREE.EdgesGeometry(signGeo);
  const edgesMat = new THREE.LineBasicMaterial({ color: 0x000000 });
  const edges    = new THREE.LineSegments(edgesGeo, edgesMat);
  edges.position.copy(sign.position);
  group.add(edges);

  group.position.set(0, 0, -8);

  // ── Función para refrescar todas las caras con texto ─────
  /**
   * Redibuja los canvas de todas las caras laterales con el
   * mensaje indicado y marca las texturas para re-upload.
   * @param {string} message
   */
  function refreshFaces(message) {
    faceData.forEach((face) => {
      if (!face) return;
      drawMessage(face.ctx, message, face.bgColor);
      face.texture.needsUpdate = true; // ← Clave: fuerza re-upload a GPU
    });
  }

  // ── Game loop ────────────────────────────────────────────
  let lastSwitch = 0;

  group.userData.update = (time) => {
    // Rotación y bob del cartel (igual que v1)
    sign.rotation.y  = time * 0.5;
    edges.rotation.y = sign.rotation.y;
    sign.position.y  = 2.5 + Math.sin(time * 0.8) * 0.15;
    edges.position.y = sign.position.y;

    // Alternar mensaje cada MESSAGE_INTERVAL segundos
    if (time - lastSwitch >= MESSAGE_INTERVAL) {
      lastSwitch      = time;
      currentMsgIndex = (currentMsgIndex + 1) % MESSAGES.length;
      refreshFaces(MESSAGES[currentMsgIndex]);
    }
  };

  return group;
}
