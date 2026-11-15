import { defineConfig, devices } from '@playwright/test';
const port = process.env.WOODSTOP_TEST_PORT ?? '5184';
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: './sample-e2e',
  use: { baseURL },
  projects: [{ name: 'desktop', use: devices['Desktop Chrome'] }, { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }],
  webServer: { command: `npm run preview -- --port ${port} --strictPort`, url: baseURL, reuseExistingServer: false }
});
