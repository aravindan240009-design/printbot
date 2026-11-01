import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Strict Security Rule: Test/Dev default credentials MUST NEVER be compiled into a production release.
  // In production builds (mode === 'production' or VITE_BUILD_ENV === 'production'),
  // the credentials are empty strings and the fallback is completely disabled & tree-shaken.
  const isProduction =
    mode === 'production' ||
    env.VITE_BUILD_ENV === 'production' ||
    process.env.PRINTBOT_RELEASE === 'production';

  const enableDevOfflineAuth = !isProduction;

  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
    },
    clearScreen: false,
    define: {
      __DEV_OFFLINE_ADMIN_ENABLED__: JSON.stringify(enableDevOfflineAuth),
      __DEV_TEST_ADMIN_USER__: JSON.stringify(enableDevOfflineAuth ? 'admin' : ''),
      __DEV_TEST_ADMIN_PASS__: JSON.stringify(enableDevOfflineAuth ? 'admin@123' : ''),
    },
  };
});
