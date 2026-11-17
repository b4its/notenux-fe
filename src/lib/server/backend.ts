import * as env from '$app/env/private';
import { error, type RequestEvent } from '@sveltejs/kit';

export function backendUrl(path: string) {
	if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) throw new Error('Invalid backend path');
	const base = new URL(env.API_BASE_URL || 'https://notenux.oryphem.com');
	if (!['https:', 'http:'].includes(base.protocol)) throw new Error('Invalid API_BASE_URL');
	return new URL(path, base);
}

function sessionName() {
	return env.SESSION_COOKIE || 'notenux-session';
}

export function hasSession(event: RequestEvent) {
	return Boolean(event.cookies.get(sessionName()));
}

export function storeCookies(event: RequestEvent, response: Response) {
	for (const value of response.headers.getSetCookie()) {
		const [pair, ...attributes] = value.split(';');
		const split = pair.indexOf('=');
		const name = pair.slice(0, split).trim();
		if (![sessionName(), 'XSRF-TOKEN'].includes(name)) continue;
		const maxAge = attributes.find((part) => /^\s*max-age=/i.test(part));
		event.cookies.set(name, decodeURIComponent(pair.slice(split + 1)), {
			path: '/',
			httpOnly: true,
			secure: event.url.protocol === 'https:',
			sameSite: 'lax',
			...(maxAge ? { maxAge: Number(maxAge.split('=')[1]) } : {})
		});
	}
}

export async function upstream(event: RequestEvent, path: string, init: RequestInit = {}) {
	const headers = new Headers(init.headers);
	headers.set('Accept', headers.get('Accept') || 'application/json');
	const cookie = [sessionName(), 'XSRF-TOKEN']
		.map((name) => {
			const value = event.cookies.get(name);
			return value ? `${name}=${encodeURIComponent(value)}` : '';
		})
		.filter(Boolean)
		.join('; ');
	if (cookie) headers.set('Cookie', cookie);
	headers.set('Origin', backendUrl('/').origin);
	headers.set('Referer', backendUrl('/').href);
	try {
		const response = await fetch(backendUrl(path), {
			...init,
			headers,
			redirect: 'manual',
			signal: AbortSignal.timeout(15_000)
		});
		storeCookies(event, response);
		if (response.status === 419) event.cookies.delete('notenux_csrf', { path: '/' });
		return response;
	} catch {
		error(502, 'Server Notenux tidak dapat dihubungi. Silakan coba lagi.');
	}
}

export async function csrfToken(event: RequestEvent, refresh = false) {
	let token = refresh ? undefined : event.cookies.get('notenux_csrf');
	if (!token) {
		const response = await upstream(event, '/', { headers: { Accept: 'text/html' } });
		if (!response.ok) error(502, 'Tidak dapat memulai sesi Notenux.');
		token = (await response.text()).match(/<meta\s+name="csrf-token"\s+content="([^"]+)"/)?.[1];
		if (!token) error(502, 'Token keamanan dari server tidak tersedia.');
		event.cookies.set('notenux_csrf', token, {
			path: '/', httpOnly: true, sameSite: 'strict', secure: event.url.protocol === 'https:'
		});
	}
	return token;
}

export async function jsonData(event: RequestEvent, path: string) {
	const response = await upstream(event, path);
	if (response.status === 401 || response.status === 419 || response.status === 302) {
		error(401, 'Silakan masuk kembali.');
	}
	if (!response.ok) error(response.status, 'Gagal memuat data Notenux.');
	return (await response.json()).data;
}

export function isProxyPath(path: string) {
	return /^\/api\/(?:notes(?:\/(?:\d+(?:\/(?:pin|favorite|duplicate|assistant|chunks(?:\/(?:verify|reorder|\d+))?|export(?:\/(?:md|markdown|txt|csv|html|json))?))?|import|bulk-delete|bulk-update))?|categories(?:\/(?:\d+|bulk-delete))?|folders(?:\/\d+)?|player-stats|profile)\/?$/.test(path)
		|| path === '/profile' || path === '/logout';
}

export async function proxy(event: RequestEvent) {
	if (!isProxyPath(event.url.pathname)) return Response.json({ message: 'Endpoint tidak ditemukan.' }, { status: 404 });
	const method = event.request.method;
	if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) return new Response(null, { status: 405 });
	if (method !== 'GET' && event.request.headers.get('origin') !== event.url.origin) {
		return Response.json({ message: 'Origin tidak diizinkan.' }, { status: 403 });
	}
	const headers = new Headers();
	for (const name of ['accept', 'content-type']) {
		const value = event.request.headers.get(name);
		if (value) headers.set(name, value);
	}
	if (method !== 'GET') headers.set('X-CSRF-TOKEN', await csrfToken(event));
	const response = await upstream(event, event.url.pathname + event.url.search, {
		method, headers, ...(method !== 'GET' ? { body: await event.request.arrayBuffer() } : {})
	});
	if (event.url.pathname === '/logout' && response.status < 400) {
		event.cookies.delete('notenux_csrf', { path: '/' });
		return new Response(null, { status: 303, headers: { Location: '/' } });
	}
	if (response.status >= 300 && response.status < 400) {
		return Response.json({ message: 'Silakan masuk kembali.' }, { status: 401 });
	}
	const outgoing = new Headers({ 'Cache-Control': 'private, no-store' });
	for (const name of ['content-type', 'content-disposition', 'retry-after']) {
		const value = response.headers.get(name);
		if (value) outgoing.set(name, value);
	}
	return new Response(response.body, { status: response.status, headers: outgoing });
}
