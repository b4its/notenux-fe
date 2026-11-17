import { redirect } from '@sveltejs/kit';
import { jsonData } from '#lib/server/backend.js';

export const load: import('./$types').PageServerLoad = async (event) => {
	const { user } = await event.parent();
	if (!user) redirect(303, '/login');
	const [notes, categories, folders, stats] = await Promise.all([
		jsonData(event, '/api/notes'), jsonData(event, '/api/categories'),
		jsonData(event, '/api/folders'), jsonData(event, '/api/player-stats')
	]);
	if (notes.length) notes[0] = await jsonData(event, `/api/notes/${notes[0].id}`);
	return { notes, categories, folders, stats };
};
