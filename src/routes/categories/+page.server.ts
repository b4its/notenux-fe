import { fail, redirect } from '@sveltejs/kit';
import { csrfToken, jsonData, upstream } from '#lib/server/backend.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { user } = await event.parent();
	if (!user) redirect(303, '/login');
	const [categories, stats] = await Promise.all([
		jsonData(event, '/api/categories'), jsonData(event, '/api/player-stats')
	]);
	return { categories, stats };
};

export const actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const mode = String(form.get('mode') || 'create');
		const id = Number(form.get('id'));
		if (!['create', 'update', 'delete', 'bulk'].includes(mode)) return fail(400, { error: 'Aksi tidak valid.' });
		if (['update', 'delete'].includes(mode) && (!Number.isSafeInteger(id) || id < 1)) {
			return fail(400, { error: 'Identitas kategori tidak valid.' });
		}
		const payload = mode === 'bulk' ? { ids: form.getAll('ids').map(Number) } : Object.fromEntries(form);
		const response = await upstream(event,
			`/api/categories${mode === 'bulk' ? '/bulk-delete' : mode === 'create' ? '' : `/${id}`}`, {
				method: mode === 'update' ? 'PUT' : mode === 'delete' ? 'DELETE' : 'POST',
				headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': await csrfToken(event) },
				body: JSON.stringify(payload)
			});
		if (!response.ok) {
			const data = await response.json().catch(() => ({}));
			return fail(response.status, {
				error: Object.values(data.errors || {}).flat().join(' ') || data.message || 'Kategori gagal disimpan.'
			});
		}
		redirect(303, '/categories');
	}
} satisfies Actions;
