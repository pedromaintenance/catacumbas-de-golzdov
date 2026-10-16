import { defineConfig } from 'vite';

// URLs relativas: o bundle será servido em /catacumbas-de-golzdov/phaser/.
// Somente P2B publicará a saída compilada; não mexer no index.html da raiz.
export default defineConfig({
  base: './',
  build: { outDir: 'dist', emptyOutDir: true, sourcemap: false },
  server: { fs: { allow: ['..'] } }
});
