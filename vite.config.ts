import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Demo local de TERRACO. No hay backend: el estado vive en el navegador.
export default defineConfig({
  plugins: [react()],
  server: { port: 5180, strictPort: true, host: '127.0.0.1' },
  preview: { port: 4173, strictPort: true, host: '127.0.0.1' },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
} as any);
