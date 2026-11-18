import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './inbox-e2e', workers: 1, timeout: 60000,
  use: { baseURL: 'http://127.0.0.1:8787', permissions: ['geolocation'], geolocation: { latitude: 43.68, longitude: -70.44 } },
  projects: [{ name: 'desktop', use: devices['Desktop Chrome'] }, { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }],
  webServer: { command: 'npm run dev:inbox', url: 'http://127.0.0.1:8787', reuseExistingServer: !process.env.CI, timeout: 120000 }
});
