import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { Buffer } from 'node:buffer';

const TEST_PROJECT_REF = 'smlgvtplfifnryhkqspv';

function assertTestCredentials(env: Record<string, string>): void {
  if (env.VITE_PRINTBOT_TEST_MODE !== 'true') {
    throw new Error('Staging customer build requires VITE_PRINTBOT_TEST_MODE=true.');
  }
  const projectUrl = new URL(env.VITE_SUPABASE_URL || '');
  if (projectUrl.hostname !== `${TEST_PROJECT_REF}.supabase.co`) {
    throw new Error(`Staging customer build must target Supabase project ${TEST_PROJECT_REF}.`);
  }
  const keyParts = (env.VITE_SUPABASE_ANON_KEY || '').split('.');
  if (keyParts.length !== 3) throw new Error('Set the test project public anon JWT before building staging.');
  let claims: { ref?: string; role?: string };
  try {
    claims = JSON.parse(Buffer.from(keyParts[1], 'base64url').toString('utf8'));
  } catch {
    throw new Error('The staging public anon key is not a valid JWT.');
  }
  if (claims.ref !== TEST_PROJECT_REF || claims.role !== 'anon') {
    throw new Error(`The staging anon key must belong to test project ${TEST_PROJECT_REF}.`);
  }
  if ((env.VITE_PRINTBOT_TEST_SHOP_SLUG || 'test-print-shop') !== 'test-print-shop') {
    throw new Error('Staging customer build must use the dedicated test shop slug.');
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  assertTestCredentials(env);
  return {
    plugins: [react()],
    esbuild: { jsx: 'automatic' },
    base: '/',
    build: {
      outDir: 'dist-staging',
      emptyOutDir: true,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-icons': ['lucide-react'],
          },
        },
      },
    },
    server: { port: 5174, host: true },
    preview: { port: 4174, host: true },
  };
});
