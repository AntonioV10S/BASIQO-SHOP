import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'; // ¡Esta línea es la que falta!

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
});