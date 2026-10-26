import { defineConfig, devices } from '@playwright/test';

// End-to-end journeys through the real UI. Run with `npm run test:e2e`, which starts the throwaway
// database, the PHP API and the Vite dev server and passes E2E_BASE_URL. Desktop Edge plus a mobile
// viewport by default; add `--project firefox` where Firefox can run (`npx playwright install firefox`).
// On the team's Windows machine, application control blocks Playwright's downloaded Firefox build.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['junit', { outputFile: 'docs/testing/evidence/junit-e2e.xml' }],
    ['html', { outputFolder: 'docs/testing/evidence/e2e-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL,
    screenshot: 'on',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'edge', use: { ...devices['Desktop Edge'], channel: 'msedge' } },
    { name: 'mobile-edge', use: { ...devices['Pixel 7'], channel: 'msedge' } },
    ...(process.env.E2E_FIREFOX ? [{ name: 'firefox', use: { ...devices['Desktop Firefox'] } }] : []),
  ],
});
