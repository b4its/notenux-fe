import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
	resolve: {
		alias: { '$app/env/private': fileURLToPath(new URL('./tests/env-stub.ts', import.meta.url)) }
	},
	test: { include: ['tests/**/*.unit.test.ts'], coverage: { include: ['src/lib/server/**'] } }
});
