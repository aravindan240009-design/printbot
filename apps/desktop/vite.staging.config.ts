import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { Buffer } from 'node:buffer';

const TEST_PROJECT_REF = 'smlgvtplfifnryhkqspv';

function assertTestCredentials(env: Record<string, string>): void {
  if (env.VITE_PRINTBOT_TEST_MODE !== 'true') {
    throw new Error('Test workstation build requires VITE_PRINTBOT_TEST_MODE=true.');
  }
  const projectUrl = new URL(env.VITE_SUPABASE_URL || '');
  if (projectUrl.hostname !== `${TEST_PROJECT_REF}.supabase.co`) {
    throw new Error(`Test workstation build must target Supabase project ${TEST_PROJECT_REF}.`);
  }
  const keyParts = (env.VITE_SUPABASE_ANON_KEY || '').split('.');
  if (keyParts.length !== 3) throw new Error('Set the test project public anon JWT before building the test workstation.');
  let claims: { ref?: string; role?: string };
  try {
    claims = JSON.parse(Buffer.from(keyParts[1], 'base64url').toString('utf8'));
  } catch {
    throw new Error('The test workstation anon key is not a valid JWT.');
  }
  if (claims.ref !== TEST_PROJECT_REF || claims.role !== 'anon') {
    throw new Error(`The test workstation anon key must belong to test project ${TEST_PROJECT_REF}.`);
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  assertTestCredentials(env);
  return {
    plugins: [react()],
    server: { port: 5174, strictPort: true },
    clearScreen: false,
    build: {
      outDir: 'dist-test',
      emptyOutDir: true,
    },
  };
});
