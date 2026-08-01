import { workspaceRoot } from '@nx/devkit';
import { nxE2EPreset } from '@nx/playwright/preset';
import { defineConfig, devices } from '@playwright/test';
// For CI, you may want to set BASE_URL to the deployed application.
const baseURL = `http://localhost:${process.env['FE_PORT'] || 4200}`;

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: `echo "Starting backend service on port: ${process.env['API_PORT'] || 3000}" && API_PORT=${process.env['API_PORT'] || 3000} DEBUG=* pnpm exec nx run backend:serve`,
      url: `http://localhost:${process.env['API_PORT'] || 3000}/api`,
      reuseExistingServer: !process.env['CI'],
      cwd: workspaceRoot,
      timeout: 60000, // Increased timeout for better debugging
    },
    {
      command: `echo "Starting frontend service on port: ${process.env['FE_PORT'] || 4200}, connecting to API on port: ${process.env['API_PORT'] || 3000}" && node apps/frontend/generate-proxy.js && FE_PORT=${process.env['FE_PORT'] || 4200} API_PORT=${process.env['API_PORT'] || 3000} DEBUG=* pnpm exec nx run frontend:serve --port=${process.env['FE_PORT'] || 4200} --verbose`,
      url: `http://localhost:${process.env['FE_PORT'] || 4200}`,
      reuseExistingServer: !process.env['CI'],
      cwd: workspaceRoot,
      timeout: 60000, // Increased timeout for better debugging
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Uncomment for mobile browsers support
    /* {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    }, */

    // Uncomment for branded browsers
    /* {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    } */
  ],
});
