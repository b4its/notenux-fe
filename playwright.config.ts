import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

export default defineConfig({
	testDir: './tests/browser',
	fullyParallel: false,
	workers: 1,
	reporter: 'list',
	use: {
		baseURL: 'http://127.0.0.1:4173',
		launchOptions: {
			executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync('/opt/google/chrome/chrome') ? '/opt/google/chrome/chrome' : undefined),
			args: ['--no-sandbox']
		},
		trace: 'retain-on-failure'
	},
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] } },
		{ name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }
	],
	webServer: [
		{ command: 'node tests/mock-backend.mjs', url: 'http://127.0.0.1:4174/health' },
		{ command: 'node --env-file=.env build', url: 'http://127.0.0.1:4173', env: { API_BASE_URL: 'http://127.0.0.1:4174', PORT: '4173', ORIGIN: 'http://127.0.0.1:4173' } }
	]
});
