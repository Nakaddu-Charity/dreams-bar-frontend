import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        require('tailwindcss'), // Use require for CommonJS context in Vite config
        require('autoprefixer'), // Use require for CommonJS context in Vite config
      ],
    },
  },
});