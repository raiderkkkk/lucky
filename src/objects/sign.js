/**
 * sign.js  (v4 — temas con apropiación estética completa)
 * ============================================================
 * Cada tema NO es solo un cambio de color: se apropia de una
 * estética concreta en todos los frentes:
 *
 *   1. TEXTURAS distintas  → drawBackground() por tema (madera,
 *      piedra, metal cepillado, orgánico alienígena, pergamino).
 *   2. FORMA distinta      → theme.shape (dimensiones del cartel,
 *      cúbicas para no distorsionar el texto) y decoración superior
 *      (buildTopper) por tema.
 *   3. ANIMACIÓN distinta  → theme.transition (corte, fundido,
 *      barrido de scan, parpadeo, glitch) al cambiar mensaje.
 *   4. POSICIÓN distinta   → theme.pos (el grupo se desliza).
 *
 * El cartel sigue teniendo 4 caras con mensaje que alternan cada
 * vuelta completa (ROT_PER_BATCH); y el TEMA completo alterna tras
 * ROT_PER_THEME vueltas (ver todos los lotes de mensajes). El ritmo
 * se deriva del ratio de giro de cada tema, no de un tiempo fijo.
 * ============================================================
 */

import * as THREE from 'three';

// ── Configuración ─────────────────────────────────────────────

/**
 * Sets de mensajes. Cada set es un array de 4 strings,
 * uno por cara: [+X, -X, +Z, -Z].
 * Al cambiar de set, las 4 caras se actualizan a la vez.
 * Tema: cartel de bienvenida a un pueblo pequeño (estilo Twin Peaks).
 */
/**
 * Mensajes que alternan en el cartel. Cada set tiene 4 strings
 * (uno por cara: +X, -X, +Z, -Z) y se rota cada vuelta completa.
 * Estilo: íntimo, reflexivo y afectuoso (13 meses juntos). Se
 * mezclan declaraciones de amor, preguntas que invitan a pensar y
 * agradecimiento/autocrítica. Sin emojis ni tono trivial.
 * Ortografía revisada: acentos en "qué"/"eligiéndote", espacio tras
 * punto en "bonita. Te adoro". Longitudes: mín 12, máx 51, prom ~38
 * caracteres → caben en ~3 líneas por cara (cara cuadrada 1024²).
 */
const MESSAGE_SETS = [
  [
    'Alguna vez has querido cambiar todo?',
    'crees que quieres estar a este mismo ritmo siempre?',
    'sientes que el amor es lo mejor que hay?',
    'qué esperas de la vida?',
  ],
  [
    '13 meses representan mucho en la vida de alguien',
    '13 meses contigo se sienten como un buen comienzo',
    '13 meses en los que he podido sentir mucho amor',
    'quiero seguir eligiéndote mañana otra vez',
  ],
  [
    'gracias por todo este tiempo juntos',
    'gracias por soportar todo lo que pasa',
    'perdón por todo lo malo',
    'perdón si a veces todo es difícil',
  ],
  [
    'te sientes diferente luego de todo este tiempo?',
    'siento que te decepciono muy seguido',
    'perdón si conmigo sientes que las cosas cuestan más',
    'te sientes cómoda con la forma en la que te amo?',
  ],
  [
    'te amo mucho',
    'siempre pensaré que eres muy bonita. Te adoro',
    'siento que eres una mujer muy bonita',
    'a veces el amor es quedarse aunque cueste',
  ],
  [
    'qué quieres en tu vida más adelante?',
    'te he hecho abandonar alguna cosa que deseas?',
    'se siente bien el ritmo de la relación?',
    'pienso en tu voz cuando el día se vuelve ruido',
  ],
  [
    'A veces parece que no doy todo de mí?',
    'He apreciado cada minuto en estos 13 meses',
    'Desearía tener todo el tiempo del mundo para tí',
    'No sé si me quieras esperar por siempre',
  ],
  [
    'Se sintió difícil en algún momento?',
    'Te amo a pesar de que me cueste expresar mis sentimientos',
    'A veces intentar cambiar no es suficiente para dejar de pensar en cosas malas',
    'Podrías perdonarme?',
  ]
];

/** Vuelta completa (rad). Una vuelta = cada cara pasa al frente una
 *  vez = los 4 mensajes se muestran en su totalidad. El ritmo de
 *  alternancia se deriva de AQUÍ, no de un tiempo fijo, para respetar
 *  el ratio de giro de cada tema. */
const TWO_PI = Math.PI * 2;

/** Nº de vueltas para cambiar de lote de mensajes.
 *  1 vuelta ⇒ se vieron las 4 caras ⇒ toca el siguiente lote. */
const ROT_PER_BATCH = 1;

/** Resolución del canvas offscreen por cara (potencia de 2). */
const CANVAS_SIZE = 1024;

/** Longitud del poste (moderada: no debe dominar ni ocultar el
 *  cartel, que es lo que importa leer). */
const POLE_HEIGHT = 9;

// ── Temas (apropiación estética completa) ────────────────────
// Carteles CÚBICOS Y GRANDES: la cara es cuadrada (textura 1024²
// sin distorsión) y de gran tamaño, con fuente mayor, para máxima
// legibilidad. Rotación lenta para no marear al lector.
const THEMES = [
  {
    id: 'futuristic', label: 'FUTURISTA',
    faceBg: '#0a1224', faceText: '#39e0ff', border: '#39e0ff', accent: '#39e0ff',
    pole: 'metal', bgStyle: 'metal',
    shape: [11.0, 11.0, 11.0],
    topper: 'antenna', transition: 'scan',
    pos: [0, 4, -10], rotSpeed: 0.25,
  },
  {
    id: 'ancient', label: 'ANTIGUO',
    faceBg: '#4a3a1e', faceText: '#ecd9a0', border: '#caa45a', accent: '#caa45a',
    pole: 'stone', bgStyle: 'stone',
    shape: [12.0, 12.0, 12.0],
    topper: 'obelisk', transition: 'fade',
    pos: [0, 1.5, -10], rotSpeed: 0.07,
  },
  {
    id: 'gothic', label: 'GÓTICO',
    faceBg: '#160f1c', faceText: '#c9a6d6', border: '#6a4a7a', accent: '#9a7ad6',
    pole: 'iron', bgStyle: 'stone',
    shape: [11.5, 11.5, 11.5],
    topper: 'spire', transition: 'flicker',
    pos: [-1, 2, -10], rotSpeed: 0.14,
  },
  {
    id: 'medieval', label: 'MEDIEVAL',
    faceBg: '#33240f', faceText: '#f0d9a8', border: '#c9a26b', accent: '#c9a26b',
    pole: 'wood', bgStyle: 'wood',
    shape: [13.0, 13.0, 13.0],
    topper: 'crown', transition: 'cut',
    pos: [0, 1.5, -10], rotSpeed: 0.18,
  },
  {
    id: 'alien', label: 'ALIENÍGENA',
    faceBg: '#0e2a1c', faceText: '#9bffce', border: '#5affc0', accent: '#5affc0',
    pole: 'alien', bgStyle: 'alien',
    shape: [12.0, 12.0, 12.0],
    topper: 'orb', transition: 'glitch',
    pos: [1, 3, -10], rotSpeed: 0.24,
  },
];

/** Nº de vueltas para cambiar de tema/cartel.
 *  Una vuelta por lote de mensajes ⇒ se muestran los
 *  MESSAGE_SETS.length lotes completos antes de cambiar el cartel. */
const ROT_PER_THEME = MESSAGE_SETS.length;

// Índices de las caras laterales (con texto) en el cubo.
// Orden BoxGeometry: +X, -X, +Y(techo), -Y(suelo), +Z, -Z
const LATERAL_FACE_INDICES = [0, 1, 4, 5];

// Índice del tema actual (se actualiza en applyTheme)
let currentThemeIndex = 0;

// ── Utilidades de color ──────────────────────────────────────
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbStr(r, g, b, a = 1) {
  return `rgba(${r | 0},${g | 0},${b | 0},${a})`;
}
// f > 0 aclara hacia blanco, f < 0 oscurece hacia negro
function shade(hex, f) {
  const [r, g, b] = hexToRgb(hex);
  const m = f >= 0 ? 255 : 0;
  const t = Math.abs(f);
  return rgbStr(r + (m - r) * t, g + (m - g) * t, b + (m - b) * t);
}

// ── Utilidades de canvas ──────────────────────────────────────

/**
 * Divide el texto en líneas que caben en maxWidth, respetando \n.
 * @returns {string[]}
 */
function wrapLines(ctx, text, maxWidth) {
  const paragraphs = text.split('\n');
  const lines = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line); line = word;
      } else {
        line = test;
      }
    }
    lines.push(line);
  }

  return lines;
}

/**
 * Calcula un tamaño de fuente RESPONSIVE para que el mensaje quepa
 * dentro del margen interior de la cara (sin tocar los bordes), tanto
 * en ancho (línea más larga) como en alto (nº de líneas). Reduce el
 * tamaño hasta que cabe. Por cara (depende del mensaje que muestra).
 * @returns {{ fontSize:number, lines:string[], lineHeight:number, totalH:number }}
 */
function fitMessage(ctx, message, S, border) {
  // Margen interior: borde exterior + borde interior + holgura
  const inner = border * 2.5;
  const margin = inner + S * 0.05;
  const availW = S - margin * 2;
  const availH = S - margin * 2;

  let fontSize = Math.round(S * 0.12); // arranca grande (mensajes cortos)
  let lines, maxW, lineHeight, totalH;

  for (let i = 0; i < 16; i++) {
    ctx.font = `${fontSize}px "Press Start 2P", monospace`;
    lines = wrapLines(ctx, message, Math.max(availW, 1));
    maxW = 0;
    for (const l of lines) maxW = Math.max(maxW, ctx.measureText(l).width);
    lineHeight = fontSize * 1.6;
    totalH = lines.length * lineHeight;

    if (maxW <= availW && totalH <= availH) break;
    fontSize = Math.floor(fontSize * 0.92);
    if (fontSize < 12) { fontSize = 12; break; }
  }

  return { fontSize, lines, lineHeight, totalH };
}

/**
 * Dibuja el FONDO texturizado de una cara según el tema.
 * Cada bgStyle genera una textura procedural distinta.
 */
function drawBackground(ctx, S, theme) {
  const base = theme.faceBg;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);

  const style = theme.bgStyle;

  if (style === 'wood') {
    const cols = 4, pw = S / cols;
    for (let i = 0; i < cols; i++) {
      ctx.fillStyle = shade(base, i % 2 ? -0.08 : 0.06);
      ctx.fillRect(i * pw, 0, pw, S);
      ctx.strokeStyle = shade(base, -0.28); ctx.lineWidth = 2;
      ctx.strokeRect(i * pw, 0, pw, S);
    }
    ctx.strokeStyle = shade(base, -0.15); ctx.lineWidth = 1;
    for (let i = 0; i < 70; i++) {
      const gx = Math.random() * S;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx + (Math.random() * 14 - 7), S);
      ctx.stroke();
    }
  } else if (style === 'stone') {
    const rows = 6, bh = S / rows;
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * S / 8;
      for (let c = -1; c < 9; c++) {
        const bx = c * (S / 4) + off, bw = S / 4;
        ctx.fillStyle = shade(base, Math.random() * 0.12 - 0.06);
        ctx.fillRect(bx, r * bh, bw, bh);
        ctx.strokeStyle = shade(base, -0.3); ctx.lineWidth = 2;
        ctx.strokeRect(bx, r * bh, bw, bh);
      }
    }
  } else if (style === 'metal') {
    ctx.strokeStyle = shade(base, 0.14); ctx.lineWidth = 1;
    for (let i = 0; i < S; i += 4) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(S, i); ctx.stroke();
    }
    ctx.strokeStyle = shade(base, -0.3);
    for (let gx = S / 6; gx < S; gx += S / 6) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, S); ctx.stroke();
    }
    ctx.fillStyle = shade(base, 0.3);
    for (let gx = S / 6; gx < S; gx += S / 6) {
      for (let gy = S / 8; gy < S; gy += S / 8) {
        ctx.beginPath(); ctx.arc(gx, gy, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else if (style === 'alien') {
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = shade(base, Math.random() * 0.3);
      ctx.beginPath();
      ctx.arc(Math.random() * S, Math.random() * S, 10 + Math.random() * 30, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = shade(theme.faceText, 0.15);
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * S, Math.random() * S, 2 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (style === 'parchment') {
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = shade(base, Math.random() * 0.12 - 0.04);
      ctx.beginPath();
      ctx.arc(Math.random() * S, Math.random() * S, 4 + Math.random() * 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Marco exterior + interior de la cara, según el tema. */
function drawBorder(ctx, S, theme) {
  const border = Math.round(S * 0.022);
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = border * 2;
  ctx.strokeRect(border, border, S - border * 2, S - border * 2);

  ctx.strokeStyle = theme.faceText;
  ctx.lineWidth = border * 0.6;
  const inner = border * 2.5;
  ctx.strokeRect(inner, inner, S - inner * 2, S - inner * 2);
}

/**
 * Renderiza una cara completa (fondo + borde + texto).
 * opts permite efectos de transición:
 *   alpha  → opacidad del texto
 *   dx/dy  → desplazamiento del texto (glitch)
 *   reveal → 0..1 porción superior visible (scan)
 */
function renderFace(face, theme, message, opts) {
  opts = opts || {};
  const ctx = face.ctx;
  const S = ctx.canvas.width;

  ctx.imageSmoothingEnabled = false;
  drawBackground(ctx, S, theme);
  drawBorder(ctx, S, theme);

  const alpha = opts.alpha != null ? opts.alpha : 1;
  const dx = opts.dx || 0;
  const dy = opts.dy || 0;
  const reveal = opts.reveal != null ? opts.reveal : 1;

  // Fuente responsiva: se ajusta al mensaje para no tocar los bordes
  const border = Math.round(S * 0.022);
  const fit = fitMessage(ctx, message, S, border);

  ctx.save();
  ctx.globalAlpha = alpha;
  if (reveal < 1) {
    ctx.beginPath();
    ctx.rect(0, 0, S, S * reveal);
    ctx.clip();
  }

  ctx.font = `${fit.fontSize}px "Press Start 2P", monospace`;
  ctx.fillStyle = theme.faceText;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.translate(dx, dy);

  // Centra verticalmente el bloque de líneas dentro de la cara
  let y = S / 2 - fit.totalH / 2 + fit.lineHeight / 2;
  for (const line of fit.lines) {
    ctx.fillText(line, S / 2, y);
    y += fit.lineHeight;
  }
  ctx.restore();

  face.texture.needsUpdate = true;
}

/**
 * Crea canvas + ctx + CanvasTexture para una cara lateral.
 * @param {string} message
 * @returns {{ canvas, ctx, texture, msg }}
 */
function createFaceCanvas(message) {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);

  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;

  return { canvas, ctx, texture, msg: message };
}

/**
 * Genera la textura del poste según el estilo del tema:
 *   wood   → madera rústica (grano vertical)
 *   metal  → paneles metálicos con remaches
 *   iron   → hierro oscuro forjado
 *   stone  → piedra desgastada
 *   alien  → superficie orgánica verdosa con manchas
 * @param {string} poleType
 * @returns {THREE.CanvasTexture}
 */
function makePoleTexture(poleType) {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 256;
  const x = c.getContext('2d');

  if (poleType === 'wood') {
    x.fillStyle = '#6b4423';
    x.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 48; i++) {
      const gx = Math.random() * c.width;
      const w = 1 + Math.random() * 2;
      const r = 30 + (Math.random() * 40 | 0);
      const g = 16 + (Math.random() * 26 | 0);
      const b = 6 + (Math.random() * 14 | 0);
      x.strokeStyle = `rgba(${r},${g},${b},0.45)`;
      x.lineWidth = w;
      x.beginPath();
      x.moveTo(gx, 0);
      x.lineTo(gx + (Math.random() * 10 - 5), c.height);
      x.stroke();
    }
  } else if (poleType === 'metal' || poleType === 'iron') {
    x.fillStyle = poleType === 'metal' ? '#3a4252' : '#23202a';
    x.fillRect(0, 0, c.width, c.height);
    x.strokeStyle = poleType === 'metal' ? '#586077' : '#3a3543';
    x.lineWidth = 2;
    for (let gx = 8; gx < c.width; gx += 16) {
      x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, c.height); x.stroke();
    }
    x.fillStyle = poleType === 'metal' ? '#9aa6c0' : '#5a5468';
    for (let gx = 8; gx < c.width; gx += 16) {
      for (let gy = 16; gy < c.height; gy += 32) {
        x.beginPath(); x.arc(gx, gy, 2, 0, Math.PI * 2); x.fill();
      }
    }
  } else if (poleType === 'stone') {
    x.fillStyle = '#7a7066';
    x.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 220; i++) {
      const v = 90 + (Math.random() * 60 | 0);
      x.fillStyle = `rgba(${v},${v - 8},${v - 16},0.4)`;
      x.beginPath();
      x.arc(Math.random() * c.width, Math.random() * c.height, 1 + Math.random() * 2, 0, Math.PI * 2);
      x.fill();
    }
  } else if (poleType === 'alien') {
    x.fillStyle = '#10261c';
    x.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 60; i++) {
      x.fillStyle = `rgba(${20 + Math.random() * 60 | 0},${200 + Math.random() * 55 | 0},${140 + Math.random() * 60 | 0},0.35)`;
      x.beginPath();
      x.arc(Math.random() * c.width, Math.random() * c.height, 2 + Math.random() * 4, 0, Math.PI * 2);
      x.fill();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 3);
  return tex;
}

/**
 * Construye la decoración superior del cartel según el tema.
 * @param {object} theme
 * @returns {THREE.Object3D}
 */
function buildTopper(theme) {
  const t = new THREE.Group();
  const topY = theme.shape[1] / 2 + 0.1;

  if (theme.topper === 'antenna') {
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1.6, 8),
      new THREE.MeshLambertMaterial({ color: 0x8888aa })
    );
    rod.position.y = topY + 0.8;
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x39e0ff })
    );
    t.add(rod, ball);
  } else if (theme.topper === 'obelisk') {
    const ob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0, 1.2, 2.0, 4),
      new THREE.MeshLambertMaterial({ color: 0x8a7a5a })
    );
    ob.position.y = topY + 1.0;
    t.add(ob);
  } else if (theme.topper === 'spire') {
    const sp = new THREE.Mesh(
      new THREE.ConeGeometry(0.9, 2.4, 8),
      new THREE.MeshLambertMaterial({
        color: 0x1a1320, emissive: 0x2a1040, emissiveIntensity: 0.4,
      })
    );
    sp.position.y = topY + 1.2;
    t.add(sp);
  } else if (theme.topper === 'crown') {
    const mat = new THREE.MeshLambertMaterial({
      color: 0xd4af37, emissive: 0x4a3a00, emissiveIntensity: 0.3,
    });
    const cy = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.4, 12), mat);
    cy.position.y = topY + 0.2;
    const co = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.8, 12), mat);
    co.position.y = topY + 0.6;
    t.add(cy, co);
  } else if (theme.topper === 'orb') {
    const o = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x5affc0 })
    );
    o.position.y = topY + 1.2;
    t.add(o);
  }

  return t;
}

// ── Función principal ─────────────────────────────────────────

/**
 * Crea el grupo completo (poste + cartel) con theming.
 *
 * @param {THREE.WebGLRenderer} renderer
 *   Necesario para configurar anisotropía máxima en las texturas.
 * @param {(theme:object)=>void} [onThemeChange]
 *   Callback que se invoca al cambiar de tema (para estilizar la UI).
 * @returns {THREE.Group}
 */
export function createSign(renderer, onThemeChange) {
  const group = new THREE.Group();

  const maxAnisotropy = renderer
    ? renderer.capabilities.getMaxAnisotropy()
    : 1;

  let currentSetIndex = 0;
  let lastSwitchAngle = 0;   // ángulo acumulado del último cambio de lote
  let lastThemeAngle = 0;    // ángulo acumulado del último cambio de tema
  let signAngle = 0;         // rotación acumulada (respeta cambios de rotSpeed)
  let lastTime = 0;

  // Referencias reconstruibles por tema
  let signMesh, edges, topper, pole, poleMat, poleTex, base;
  let signPivot;
  let groupTargetPos = new THREE.Vector3();
  let transition = null; // { t, dur, type, from[], to[] }

  // ── Caras laterales (4) ──────────────────────────────────
  const faceData = [null, null, null, null, null, null];
  const theme0 = THEMES[currentThemeIndex];
  LATERAL_FACE_INDICES.forEach((faceIdx, msgIdx) => {
    const fd = createFaceCanvas(MESSAGE_SETS[0][msgIdx]);
    fd.texture.anisotropy = maxAnisotropy;
    faceData[faceIdx] = fd;
    renderFace(fd, theme0, fd.msg);
  });

  // ── Materiales del cubo (6) ──────────────────────────────
  function buildSignMaterials() {
    const mats = [];
    for (let i = 0; i < 6; i++) {
      if (faceData[i]) {
        mats[i] = new THREE.MeshLambertMaterial({
          map: faceData[i].texture,
          emissiveMap: faceData[i].texture,
          emissive: new THREE.Color(0x111111),
          emissiveIntensity: 0.4,
        });
      } else {
        const color = i === 2 ? 0x3d2b00 : 0x1a1a1a;
        mats[i] = new THREE.MeshLambertMaterial({ color });
      }
    }
    return mats;
  }

  // ── Construye la geometría del cartel según el tema ───────
  function buildSignBody(th) {
    const [w, h, d] = th.shape;

    signMesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      buildSignMaterials()
    );

    edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(signMesh.geometry),
      new THREE.LineBasicMaterial({ color: 0x000000 })
    );

    topper = buildTopper(th);
    signMesh.add(topper);

    signPivot = new THREE.Group();
    signPivot.add(signMesh, edges);
    group.add(signPivot);

    // Poste + base debajo del cartel
    poleTex = makePoleTexture(th.pole);
    poleMat = new THREE.MeshLambertMaterial({ map: poleTex });
    pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.9, POLE_HEIGHT, 10),
      poleMat
    );
    pole.position.y = -(h / 2 + POLE_HEIGHT / 2);
    group.add(pole);

    base = new THREE.Mesh(
      new THREE.CylinderGeometry(2.0, 2.3, 1.0, 10),
      new THREE.MeshLambertMaterial({ color: 0x55504a })
    );
    base.position.y = -(h / 2 + POLE_HEIGHT + 0.5);
    group.add(base);
  }

  buildSignBody(theme0);
  group.position.set(...theme0.pos);
  groupTargetPos.set(...theme0.pos);

  // ── Pinta/actualiza una cara (sin transición) ────────────
  function paintFace(faceIdx) {
    const face = faceData[faceIdx];
    if (!face) return;
    renderFace(face, THEMES[currentThemeIndex], face.msg);
  }

  // ── Cambia al siguiente set de mensajes (con transición) ──
  function advanceSet() {
    currentSetIndex = (currentSetIndex + 1) % MESSAGE_SETS.length;
    const set = MESSAGE_SETS[currentSetIndex];

    const fromMsgs = LATERAL_FACE_INDICES.map((faceIdx) => faceData[faceIdx].msg);
    const toMsgs = LATERAL_FACE_INDICES.map((faceIdx, msgIdx) => set[msgIdx]);

    LATERAL_FACE_INDICES.forEach((faceIdx, msgIdx) => {
      faceData[faceIdx].msg = toMsgs[msgIdx];
    });

    transition = {
      t: 0,
      dur: 0.8,
      type: THEMES[currentThemeIndex].transition,
      from: fromMsgs,
      to: toMsgs,
    };
  }

  // ── Aplica un tema completo ──────────────────────────────
  function applyTheme(index) {
    currentThemeIndex = index;
    const th = THEMES[index];

    // Caras (recolorean manteniendo el mensaje actual)
    LATERAL_FACE_INDICES.forEach(paintFace);

    // Geometría del cartel (forma distinta)
    const [w, h, d] = th.shape;
    signMesh.geometry.dispose();
    signMesh.geometry = new THREE.BoxGeometry(w, h, d);
    edges.geometry.dispose();
    edges.geometry = new THREE.EdgesGeometry(signMesh.geometry);

    // Poste
    poleTex.dispose();
    poleTex = makePoleTexture(th.pole);
    poleMat.map = poleTex;
    poleMat.needsUpdate = true;
    pole.position.y = -(h / 2 + POLE_HEIGHT / 2);
    base.position.y = -(h / 2 + POLE_HEIGHT + 0.5);

    // Decoración superior
    signMesh.remove(topper);
    topper = buildTopper(th);
    signMesh.add(topper);

    // Posición objetivo (el grupo se desliza en el game loop)
    groupTargetPos.set(th.pos[0], th.pos[1], th.pos[2]);

    if (onThemeChange) onThemeChange(th);
  }

  // Notifica el tema inicial a la UI
  if (onThemeChange) onThemeChange(theme0);

  // ── Game loop ────────────────────────────────────────────
  group.userData.update = (time) => {
    const dt = time - lastTime;
    lastTime = time;

    // Deslizar hacia la posición del tema
    group.position.lerp(groupTargetPos, 0.05);

    // Rotación propia del tema (acumulada para respetar cambios de
    // rotSpeed al cambiar de tema, y poder medir vueltas completas)
    const rot = THEMES[currentThemeIndex].rotSpeed;
    signAngle += dt * rot;
    signMesh.rotation.y = signAngle;
    edges.rotation.y = signAngle;

    // Bob suave
    signPivot.position.y = Math.sin(time * 0.7) * 0.18;

    // Cambiar de lote de mensajes tras UNA vuelta completa:
    // así las 4 caras pasan al frente y se ven los 4 mensajes.
    if (signAngle - lastSwitchAngle >= TWO_PI * ROT_PER_BATCH) {
      lastSwitchAngle = signAngle;
      advanceSet();
    }

    // Cambiar de tema/cartel tras ROT_PER_THEME vueltas:
    // se muestran todos los lotes de mensajes antes de cambiar.
    if (signAngle - lastThemeAngle >= TWO_PI * ROT_PER_THEME) {
      lastThemeAngle = signAngle;
      lastSwitchAngle = signAngle; // reinicia el ciclo de lotes del tema
      applyTheme((currentThemeIndex + 1) % THEMES.length);
    }

    // Animación de transición de mensaje (por tema)
    if (transition) {
      transition.t += dt;
      const p = Math.min(transition.t / transition.dur, 1);
      const type = transition.type;
      const th = THEMES[currentThemeIndex];

      LATERAL_FACE_INDICES.forEach((faceIdx, msgIdx) => {
        const face = faceData[faceIdx];
        if (!face) return;
        const to = transition.to[msgIdx];
        const from = transition.from[msgIdx];

        if (type === 'cut') {
          renderFace(face, th, to);
        } else if (type === 'fade') {
          if (p < 0.5) renderFace(face, th, from, { alpha: 1 - 2 * p });
          else renderFace(face, th, to, { alpha: 2 * p - 1 });
        } else if (type === 'scan') {
          renderFace(face, th, to, { reveal: p, alpha: 1 });
        } else if (type === 'flicker') {
          renderFace(face, th, to, { alpha: 0.3 + Math.random() * 0.7 });
        } else if (type === 'glitch') {
          renderFace(face, th, to, {
            alpha: 0.7 + Math.random() * 0.3,
            dx: (Math.random() - 0.5) * 40,
          });
        }
      });

      if (p >= 1) {
        const finalMsgs = transition.to;
        transition = null;
        LATERAL_FACE_INDICES.forEach((faceIdx, msgIdx) => {
          const face = faceData[faceIdx];
          if (face) renderFace(face, THEMES[currentThemeIndex], finalMsgs[msgIdx]);
        });
      }
    }
  };

  return group;
}
