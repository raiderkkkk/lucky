// ============================================================
// FRAGMENT SHADER — Atmósfera Retro PS1
//
// Genera el patrón procedural combinando tres capas:
//   1. Espirales / ondas radiales
//   2. Worley Noise (celdas irregulares)
//   3. Dither granulado estilo PS1
//
// El color se mapea a través de un degradado cíclico de paleta
// (Crimson Violet · Deep Crimson · Princeton Orange · Autumn Leaf
// · Dark Teal) que va variando lentamente con u_time. La animación
// de las capas se mantiene exactamente igual; solo cambia el color.
//
// Uniforms:
//   u_time   — tiempo en segundos para animar el fondo
// ============================================================

varying vec2 vUv;
varying vec3 vPosition;

uniform float u_time;

// ── Paleta: Crimson Violet · Deep Crimson · Princeton Orange ·
//    Autumn Leaf · Dark Teal ──
// Colores base (RGB 0..1) convertidos del hex solicitado.
const vec3 pViolet = vec3(0.373, 0.059, 0.251); // #5f0f40 Crimson Violet
const vec3 pCrimson= vec3(0.604, 0.012, 0.118); // #9a031e Deep Crimson
const vec3 pOrange = vec3(0.984, 0.545, 0.141); // #fb8b24 Princeton Orange
const vec3 pLeaf   = vec3(0.890, 0.392, 0.078); // #e36414 Autumn Leaf
const vec3 pTeal   = vec3(0.059, 0.298, 0.361); // #0f4c5c Dark Teal

// Gradiente cíclico de 5 colores (envuelve teal → violet).
// t se desplaza lentamente con u_time para que el color "viaje"
// entre familias sin tocar la animación de las capas.
vec3 paletteGradient(float t) {
  t     = fract(t);
  float seg = t * 5.0;
  int   idx = int(floor(seg));
  float f   = fract(seg);

  vec3 a, b;
  if      (idx == 0) { a = pViolet; b = pCrimson; }
  else if (idx == 1) { a = pCrimson;b = pOrange;  }
  else if (idx == 2) { a = pOrange; b = pLeaf;    }
  else if (idx == 3) { a = pLeaf;   b = pTeal;    }
  else               { a = pTeal;   b = pViolet;  }
  return mix(a, b, f);
}

// ── Utilidades ───────────────────────────────────────────────

// Hash 2D sin trigonometría (rápido en GPU)
vec2 hash2(vec2 p) {
  p = vec2(
    dot(p, vec2(127.1, 311.7)),
    dot(p, vec2(269.5, 183.3))
  );
  return fract(sin(p) * 43758.5453123);
}

// Worley Noise — genera un patrón de celdas orgánicas
// similares a las "manchas" del fondo PS1.
float worley(vec2 uv, float scale) {
  uv *= scale;
  vec2 cell = floor(uv);
  vec2 frac = fract(uv);
  float minDist = 1.0;

  // Revisamos las 9 celdas vecinas
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 point    = hash2(cell + neighbor);
      // Animación suave: cada punto se mueve lentamente
      point = 0.5 + 0.5 * sin(u_time * 0.3 + 6.2831 * point);
      vec2  diff = neighbor + point - frac;
      float dist = length(diff);
      minDist = min(minDist, dist);
    }
  }
  return minDist;
}

// Espirales radiales — crea ondas que salen del centro
float radialSpiral(vec2 uv, float time) {
  // Convertimos UV a coordenadas polares centradas en (0.5, 0.5)
  vec2  centered = uv - 0.5;
  float radius   = length(centered);
  float angle    = atan(centered.y, centered.x);

  // Combinamos ángulo + radio para la espiral
  float spiral = sin(angle * 3.0 - radius * 12.0 + time * 0.4);
  // Ondas concéntricas adicionales
  float waves  = sin(radius * 20.0 - time * 0.6) * 0.5 + 0.5;

  return (spiral * 0.5 + 0.5) * waves;
}

// Dither granulado estilo PS1
// Simula el efecto de cuantización de color de la PS1
float dither(vec2 uv, float time) {
  // Posición en píxeles con resolución reducida (PS1 tenía ~320x240)
  vec2  pixelUV = floor(uv * 128.0) / 128.0;
  float noise   = fract(sin(dot(pixelUV, vec2(12.9898, 78.233)) + time * 0.1) * 43758.5453);
  return noise;
}

// ── Main ─────────────────────────────────────────────────────
void main() {
  // Coordenadas UV proyectadas en esfera (valor 0..1)
  vec2 uv = vUv;

  // 1. Capa de espirales/ondas radiales
  float spiral = radialSpiral(uv, u_time);

  // 2. Capa de Worley Noise (escala 4.0 = tamaño de manchas)
  float cells = worley(uv, 4.0);
  // Invertimos para que las "venas" sean oscuras
  cells = 1.0 - cells;

  // 3. Dither PS1
  float grain = dither(uv, u_time) * 0.08; // Intensidad baja para sutileza

  // ── Mezcla de capas ──────────────────────────────────────
  // spiral domina la estructura general
  // cells  añade las manchas irregulares
  // grain  es la capa final de granulado
  float pattern = mix(spiral, cells, 0.45) + grain;
  pattern       = clamp(pattern, 0.0, 1.0);

  // ── Mapeo de color con degradado de paleta ───────────────
  // El patrón (misma animación de siempre) define la variación
  // ESPACIAL, y u_time hace derivar lentamente la paleta para que
  // el color "viaje" entre violet → crimson → naranja → hoja → teal.
  // Mantenemos el patrón como modulador de luminancia para que la
  // estructura de espirales/worley siga siendo visible.
  float t     = pattern * 0.35 + u_time * 0.02;
  vec3  color = paletteGradient(t);

  // Realzar con el patrón: zonas altas más brillantes, bajas más
  // oscuras (preserva el relieve de las capas animadas).
  color *= mix(0.40, 1.20, pattern);

  // ── Oscurecer hacia el horizonte para profundidad ─────────
  // vPosition.y va de -1 (suelo) a +1 (cénit)
  float horizon = smoothstep(-0.2, 0.4, vPosition.y / 150.0);
  color        *= mix(0.4, 1.0, horizon);

  gl_FragColor = vec4(color, 1.0);
}
