import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/job_fe',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GLM_API': JSON.stringify(env.GLM_API),
        'process.env.API_KEY': JSON.stringify(env.API_KEY),
        'process.env.API_URL': JSON.stringify(env.API_URL),
      },
      build: {
        target: 'es2022',
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
