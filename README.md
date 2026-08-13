# 🎮 PS1 World — Fondo del Mundo Retro

> Atmósfera 3D inmersiva con estética PlayStation 1, construida con Three.js y shaders GLSL procedurales.

![PS1 World Preview](./docs/preview.png)

---

## ¿Qué es este proyecto?

Una escena 3D interactiva que recrea el estilo visual de los juegos de PlayStation 1 (1994–2000):

- **Fondo procedural rojo** generado por shaders GLSL (sin texturas 2D)
- **Resolución baja de render** para efecto pixelado auténtico
- **Sin antialiasing** para bordes dentados característicos
- **Iluminación Lambert** (por vértice, sin PBR moderno)
- **Cartel de 4 caras** rotando en el centro de la escena

---

## Demo en vivo

👉 [Ver en GitHub Pages](https://tu-usuario.github.io/ps1-world)

*(reemplaza la URL con tu usuario de GitHub)*

---

## Tecnologías

| Herramienta | Versión | Propósito |
|---|---|---|
| [Three.js](https://threejs.org) | ^0.165 | Motor 3D WebGL |
| [GLSL](https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language) | ES 1.00 | Shaders procedurales |
| [Vite](https://vitejs.dev) | ^5.2 | Bundler y servidor de desarrollo |
| JavaScript | ES2020+ | Lógica de la aplicación |

---

## Estructura del proyecto

```
ps1-world/
│
├── index.html                 # HTML mínimo: el canvas se inyecta desde JS
├── vite.config.js             # Config de Vite (base './' para GitHub Pages)
├── package.json
│
└── src/
    ├── main.js                # 🎯 Punto de entrada — orquesta todo
    │
    ├── core/
    │   ├── renderer.js        # WebGLRenderer con configuración PS1
    │   ├── scene.js           # Escena y cámara perspectiva
    │   ├── lighting.js        # Iluminación mínima estilo PS1
    │   └── controls.js        # Control FPS con Pointer Lock API
    │
    ├── objects/
    │   ├── skydome.js         # Esfera invertida con shader procedural
    │   └── sign.js            # Cartel de 4 caras con poste
    │
    └── shaders/
        ├── sky.vert.glsl      # Vertex shader del skydome
        └── sky.frag.glsl      # Fragment shader — patrón rojo PS1
```

---

## Cómo funciona

### 1. El truco del PS1 Look

La estética PS1 no viene de filtros: viene de **renderizar a baja resolución**:

```js
// renderer.js
const PS1_PIXEL_SCALE = 0.25; // Render a 1/4 de resolución

renderer.setPixelRatio(window.devicePixelRatio * PS1_PIXEL_SCALE);
renderer.domElement.style.imageRendering = 'pixelated';
```

Al renderizar a 320×240 y escalar con `pixelated`, los píxeles se ven enormes, igual que en una PS1.

---

### 2. El Skydome (fondo infinito)

En vez de una imagen 2D de fondo, usamos una **esfera enorme vista desde adentro**:

```js
// skydome.js
const geometry = new THREE.SphereGeometry(150, 32, 32);
const material = new THREE.ShaderMaterial({
  side: THREE.BackSide, // ← Ver cara interna
  // ...
});
```

La esfera sigue a la cámara como hija suya, así siempre parece infinita.

---

### 3. El Shader Procedural (corazón del proyecto)

El patrón rojo se genera matemáticamente en la GPU combinando 3 capas:

```
Patrón final = Espirales Radiales + Worley Noise + Dither PS1
```

**Capa 1 — Espirales Radiales** (`sky.frag.glsl`):
```glsl
float radialSpiral(vec2 uv, float time) {
  vec2  centered = uv - 0.5;
  float radius   = length(centered);
  float angle    = atan(centered.y, centered.x);

  float spiral = sin(angle * 3.0 - radius * 12.0 + time * 0.4);
  float waves  = sin(radius * 20.0 - time * 0.6) * 0.5 + 0.5;
  return (spiral * 0.5 + 0.5) * waves;
}
```

Convierte UV a coordenadas polares y crea ondas que se expanden desde el centro.

**Capa 2 — Worley Noise** (celdas tipo Voronoi):
```glsl
float worley(vec2 uv, float scale) {
  // Divide el espacio en celdas y mide distancia al punto más cercano
  // → Genera manchas orgánicas irregulares
}
```

**Capa 3 — Dither granulado**:
```glsl
float dither(vec2 uv, float time) {
  vec2  pixelUV = floor(uv * 128.0) / 128.0; // Cuantizar a resolución PS1
  float noise   = fract(sin(dot(pixelUV, vec2(12.9898, 78.233))) * 43758.5453);
  return noise;
}
```

---

### 4. El Game Loop

```js
// main.js
function animate() {
  requestAnimationFrame(animate);         // ~60 fps

  const elapsed = clock.getElapsedTime();

  skyUniforms.u_time.value = elapsed;     // Animar shader
  sign.userData.update(elapsed);          // Animar cartel

  renderer.render(scene, camera);
}
```

`requestAnimationFrame` sincroniza el render con el monitor del usuario.

---

### 5. Controles de cámara (FPS)

Usa la [Pointer Lock API](https://developer.mozilla.org/es/docs/Web/API/Pointer_Lock_API) del navegador:

```js
// Bloquear cursor al hacer click
domElement.addEventListener('click', () => domElement.requestPointerLock());

// Rotar cámara con el mouse
document.addEventListener('mousemove', (e) => {
  yaw   -= e.movementX * MOUSE_SENSITIVITY;
  pitch -= e.movementY * MOUSE_SENSITIVITY;

  camera.rotation.order = 'YXZ'; // Orden correcto para FPS
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
});
```

---

## Instalación y uso local

### Requisitos
- [Node.js](https://nodejs.org) v18 o superior
- npm (incluido con Node.js)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/ps1-world.git
cd ps1-world

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
# → Abrir http://localhost:5173
```

### Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot reload |
| `npm run build` | Construir para producción en `/dist` |
| `npm run preview` | Vista previa del build de producción |

---

## Deploy en GitHub Pages

### Opción A — Manual (más simple)

```bash
# 1. Construir
npm run build

# 2. Crear rama gh-pages con el contenido de dist/
npx gh-pages -d dist

# 3. En GitHub → Settings → Pages → Source: gh-pages branch
```

### Opción B — GitHub Actions (automático)

Crea el archivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install & Build
        run: |
          npm install
          npm run build

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Con esto, cada `git push` a `main` despliega automáticamente.

> **Importante:** Si tu repo se llama `ps1-world` (no es tu página principal), cambia `base: './'` a `base: '/ps1-world/'` en `vite.config.js`.

---

## Personalización

### Cambiar la velocidad de animación del fondo

En `sky.frag.glsl`, modifica los multiplicadores de tiempo:

```glsl
float spiral = sin(angle * 3.0 - radius * 12.0 + time * 0.4); // 0.4 = velocidad
float waves  = sin(radius * 20.0 - time * 0.6);                // 0.6 = velocidad
```

### Cambiar la paleta de colores

En `sky.frag.glsl`, edita los valores hex convertidos a RGB (0–1):

```glsl
vec3 colorA = vec3(0.000, 0.000, 0.000); // #000000
vec3 colorD = vec3(0.710, 0.000, 0.000); // #B50000 ← cambiar aquí
```

### Cambiar la resolución PS1

En `renderer.js`:

```js
const PS1_PIXEL_SCALE = 0.25; // 0.1 = más pixelado, 1.0 = full res
```

### Agregar texturas al cartel

En `sign.js`, reemplaza los `MeshLambertMaterial` con texturas propias:

```js
const texture = new THREE.TextureLoader().load('/tu-textura.png');
const material = new THREE.MeshLambertMaterial({ map: texture });
```

---

## Paleta de colores PS1

| Nombre | Hex | Uso |
|---|---|---|
| Rojo Base | `#B50000` | Tono dominante del fondo |
| Rojo Medio | `#D11A1A` | Picos de luz |
| Rojo Oscuro | `#8C0000` | Sombras medias |
| Rojo Profundo | `#5A0000` | Sombras oscuras |
| Negro Rojizo | `#1A0000` | Transición al negro |
| Negro Puro | `#000000` | Zonas más oscuras |

---

## Conceptos GLSL para aprender más

| Concepto | Qué hace |
|---|---|
| `varying` | Pasa datos del vertex shader al fragment shader |
| `uniform` | Variable que se pasa desde JavaScript a los shaders |
| `fract()` | Parte fraccionaria — útil para patrones repetitivos |
| `smoothstep()` | Interpolación suave entre dos valores |
| `atan(y, x)` | Ángulo de un vector 2D (coordenadas polares) |
| `length()` | Longitud/magnitud de un vector |

---

## Recursos recomendados

- [Three.js Documentation](https://threejs.org/docs)
- [The Book of Shaders](https://thebookofshaders.com) — aprender GLSL desde cero
- [Shadertoy](https://www.shadertoy.com) — inspiración de shaders
- [Learn OpenGL ES](https://learnopengl.com) — conceptos de shaders

---

## Licencia

MIT — libre para usar, modificar y distribuir.

---

*Construido con Three.js · GLSL · Vite*
