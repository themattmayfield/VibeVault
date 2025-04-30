// app.config.ts

import { defineConfig } from '@tanstack/react-start/config';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
  server: {
    preset: 'aws-lambda',
    awsLambda: {
      streaming: true,
    },
    https: true,
  },
  vite: {
    plugins: [
      mkcert(),
      // this is the plugin that enables path aliases
      viteTsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
    ],
  },
});
