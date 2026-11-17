import { defineEnvVars } from '@sveltejs/kit/env';
export const variables = defineEnvVars({
	API_BASE_URL: {
		schema: (value) => {
			const url = new URL(value || 'https://notenux.oryphem.com');
			if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid API_BASE_URL');
			return url.origin;
		}
	},
	SESSION_COOKIE: { schema: (value) => value || 'notenux-session' }
});
