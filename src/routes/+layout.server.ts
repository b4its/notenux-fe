import { hasSession, upstream } from '#lib/server/backend.js';

export const load: import('./$types').LayoutServerLoad = async (event) => {
	if (!hasSession(event)) return { user: null, noteCount: 0 };
	const response = await upstream(event, '/api/profile');
	if (response.status === 401 || response.status === 302) return { user: null };
	if (!response.ok) return { user: null };
	return { user: (await response.json()).data };
};
