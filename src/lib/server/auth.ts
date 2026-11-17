import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { csrfToken, upstream } from './backend.js';

export async function authenticate(event: RequestEvent, path: '/login' | '/register') {
	const form = await event.request.formData();
	const values = {
		name: String(form.get('name') || '').slice(0, 255),
		email: String(form.get('email') || '').slice(0, 255)
	};
	const token = await csrfToken(event);
	form.set('_token', token);
	const response = await upstream(event, path, {
		method: 'POST', body: form, headers: { 'X-CSRF-TOKEN': token }
	});
	if (response.status === 302 || response.status === 303) {
		event.cookies.delete('notenux_csrf', { path: '/' });
		redirect(303, '/studio');
	}
	if (response.status === 422) {
		const data = await response.json();
		return fail(422, { errors: Object.values(data.errors || {}).flat() as string[], values });
	}
	return fail(response.status >= 400 ? response.status : 502, {
		errors: [response.status === 429 ? 'Terlalu banyak percobaan. Silakan tunggu sebentar.' : 'Tidak dapat masuk. Muat ulang halaman lalu coba lagi.'],
		values
	});
}
