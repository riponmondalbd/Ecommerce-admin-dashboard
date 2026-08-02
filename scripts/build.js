#!/usr/bin/env node
/**
 * Vercel build script — builds the Next.js frontend only.
 *
 * The backend (Express + Prisma + PostgreSQL) is deployed separately
 * on Railway, Render, or similar platform.
 *
 * NOTE: Set these environment variables in Vercel dashboard:
 *   - BACKEND_URL: https://your-backend-url.onrender.com
 *   - NEXT_PUBLIC_API_BASE_URL: /api (uses serverless proxy)
 */
const { execSync } = require('child_process');
const path = require('path');

const run = (cmd, cwd, desc) => {
  try {
    console.log(`\n>>> ${desc}`);
    execSync(cmd, { cwd, stdio: 'inherit', shell: true });
    console.log(`  ✓ ${desc} done`);
  } catch (e) {
    console.error(`\n  ✗ ${desc} FAILED`);
    process.exit(1);
  }
};

const root = __dirname;
const frontendDir = path.join(root, '..', 'frontend');

// 1. Install frontend dependencies
run('npm install', frontendDir, 'frontend install');

// 2. Build Next.js frontend
run('npm run build', frontendDir, 'frontend build');

console.log('\n✓ Frontend build completed successfully!\n');
