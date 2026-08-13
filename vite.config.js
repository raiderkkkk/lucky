/**
 * vite.config.js
 * ============================================================
 * Configuración de Vite para el proyecto PS1 World.
 *
 * Puntos clave:
 *  - base: './'  → URLs relativas para funcionar en GitHub Pages
 *    (sin esto, los assets buscan rutas absolutas y fallan
 *     cuando el repo no está en la raíz del dominio)
 *  - outDir: 'dist' → carpeta de salida del build
 *
 * Para GitHub Pages:
 *  1. `npm run build` genera la carpeta dist/
 *  2. Hacer commit de dist/ o configurar GitHub Actions
 *  3. En Settings → Pages → Source: seleccionar la rama/carpeta
 * ============================================================
 */

import { defineConfig } from 'vite';

export default defineConfig({
  // Ruta base para GitHub Pages
  // Si tu repo se llama "ps1-world", cambia a '/ps1-world/'
  base: './',

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
