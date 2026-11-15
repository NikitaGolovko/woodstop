import { defineConfig, devices } from '@playwright/test';
const port = process.env.WOODSTOP_TEST_PORT ?? '5173';
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: './e2e',
  use: { baseURL },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }, { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }],
  // A fake browser key exercises provider integration against intercepted responses.
  webServer: { command: `npm run dev -- --port ${port} --strictPort`, url: baseURL, reuseExistingServer: false,
    env: { VITE_GEOAPIFY_API_KEY: 'woodstop-browser-test-key' } },
});
