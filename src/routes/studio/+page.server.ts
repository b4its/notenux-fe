import { redirect } from '@sveltejs/kit';
import { jsonData } from '#lib/server/backend.js';

export const load: import('./$types').PageServerLoad = async (event) => {
	const { user } = await event.parent();
	if (!user) redirect(303, '/login');
	const [notes, categories, folders, stats] = await Promise.all([
		jsonData(event, '/api/notes'), jsonData(event, '/api/categories'),
		jsonData(event, '/api/folders'), jsonData(event, '/api/player-stats')
	]);
	// Only send lightweight summaries with the shell. The active manuscript is
	// fetched once in the browser instead of blocking SSR and duplicating it in HTML.
	return { notes, categories, folders, stats };
};
