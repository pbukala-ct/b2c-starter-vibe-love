import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 180_000,   // 3 min — allows for Netlify serverless cold starts
  // Run tests serially (1 worker) because Tests 1 & 3 both sign in as the
  // same Jennifer account and share a CT customer cart.  Running in parallel
  // causes version-conflict errors on the shared cart object.
  workers: 1,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL || 'https://b2c-starter.netlify.app',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
