import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/lakiza-demo/',
  plugins: [react()],
});
