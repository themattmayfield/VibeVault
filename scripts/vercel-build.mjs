#!/usr/bin/env node

/**
 * Vercel Build Script
 *
 * Handles Convex deployment as part of the Vercel build process.
 *
 * Production (VERCEL_ENV=production):
 *   - Deploys Convex functions to the production deployment
 *   - Uses CONVEX_DEPLOY_KEY (production key) set in Vercel env vars
 *   - `npx convex deploy` sets VITE_CONVEX_URL automatically
 *
 * Preview (VERCEL_ENV=preview):
 *   - Skips Convex deployment (uses the existing dev deployment)
 *   - VITE_CONVEX_URL is set via Vercel Preview env vars pointing to dev
 *
 * Local (no VERCEL_ENV):
 *   - Just runs the normal build
 */

import { execSync } from 'node:child_process';

const env = process.env.VERCEL_ENV; // 'production' | 'preview' | 'development' | undefined

function run(cmd) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { stdio: 'inherit', env: process.env });
}

if (env === 'production') {
  // Production: deploy Convex functions and build the app in one step.
  // `npx convex deploy --cmd` will:
  //   1. Push Convex functions to the production deployment
  //   2. Set VITE_CONVEX_URL to the production Convex URL
  //   3. Run the build command
  console.log('=== Production build: deploying Convex + building app ===');
  run("npx convex deploy --cmd 'npx vite build'");
} else if (env === 'preview') {
  // Preview: skip Convex deploy, just build the app.
  // The preview env vars (VITE_CONVEX_URL etc.) are set in Vercel
  // and point to the existing dev Convex deployment.
  console.log('=== Preview build: building app (Convex dev deployment) ===');
  run('npx vite build');
} else {
  // Local or CI outside Vercel: just build normally
  console.log('=== Local build ===');
  run('npx vite build');
}
