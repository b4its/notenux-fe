import { afterEach, describe, expect, it, vi } from 'vitest';
import { backendUrl, csrfToken, isProxyPath, jsonData, proxy, storeCookies, upstream } from '../src/lib/server/backend';
import { authenticate } from '../src/lib/server/auth';
import type { RequestEvent } from '@sveltejs/kit';

function event(path = '/api/notes', method = 'GET', origin = 'http://localhost') {
	const jar = new Map<string, string>();
	const cookieOptions: unknown[] = [];
	return {
		url: new URL(path, 'http://localhost'),
		request: new Request(new URL(path, 'http://localhost'), { method, headers: { Origin: origin } }),
		cookies: {
			get: (name: string) => jar.get(name),
			set: (name: string, value: string, options: unknown) => { jar.set(name, value); cookieOptions.push(options); },
			delete: (name: string) => jar.delete(name)
		},
		jar, cookieOptions
	} as unknown as RequestEvent & { jar: Map<string, string>; cookieOptions: { httpOnly: boolean; sameSite: string }[] };
}
afterEach(() => vi.unstubAllGlobals());
describe('backend trust boundary', () => {
	it('cancels upstream work when the client disconnects', async () => {
		const request = event();
		const controller = new AbortController();
		request.request = new Request(request.url, { signal: controller.signal });
		const fetch = vi.fn().mockResolvedValue(Response.json({ data: [] }));
		vi.stubGlobal('fetch', fetch);
		await upstream(request, '/api/notes');
		const signal = fetch.mock.calls[0][1].signal as AbortSignal;
		expect(signal.aborted).toBe(false);
		controller.abort();
		expect(signal.aborted).toBe(true);
	});
	it.each(['/api/notes', '/api/notes/1', '/api/notes/1/chunks/verify', '/api/notes/1/chunks/2', '/api/notes/1/export/md', '/api/notes/bulk-delete', '/api/categories/1', '/api/folders', '/profile', '/logout'])('allows %s', (path) => expect(isProxyPath(path)).toBe(true));
	it.each(['/api/unknown', '//evil.test', '/api/notes/../../admin', '/api/notes/%2fadmin', '/api/notes/1/unknown', '/api/profile/1', '/api/notes/1/export/../../x'])('rejects %s', (path) => expect(isProxyPath(path)).toBe(false));
	it('uses the configured backend origin', () => expect(backendUrl('/api/notes').href).toBe('https://notenux.oryphem.com/api/notes'));
	it.each(['https://evil.test', '//evil.test', '/\\evil.test'])('rejects off-origin backend URLs (%s)', (path) => expect(() => backendUrl(path)).toThrow('Invalid backend path'));
	it('expires a stale CSRF cookie so a subsequent mutation can recover', async () => {
		const request = event();
		request.jar.set('notenux_csrf', 'expired');
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 419 })));
		await upstream(request, '/api/notes');
		expect(request.jar.has('notenux_csrf')).toBe(false);
	});
	it('keeps session and CSRF cookies HttpOnly and ignores arbitrary upstream cookies', () => {
		const request = event();
		storeCookies(request, new Response(null, { headers: { 'Set-Cookie': 'notenux-session=a%3Db; Path=/; Domain=other.test; Secure; Max-Age=7200' } }));
		storeCookies(request, new Response(null, { headers: { 'Set-Cookie': 'untrusted=secret; Path=/' } }));
		expect(request.jar.get('notenux-session')).toBe('a=b');
		expect(request.jar.has('untrusted')).toBe(false);
		expect(request.cookieOptions[0].httpOnly).toBe(true);
	});
	it('forwards only backend session cookies, not application cookies', async () => {
		const request = event();
		request.jar.set('notenux-session', 'session');
		request.jar.set('notenux_csrf', 'secret');
		const fetch = vi.fn().mockResolvedValue(Response.json({ data: [] }));
		vi.stubGlobal('fetch', fetch);
		await upstream(request, '/api/notes');
		const headers = fetch.mock.calls[0][1].headers as Headers;
		expect(headers.get('cookie')).toBe('notenux-session=session');
		expect(fetch.mock.calls[0][1].redirect).toBe('manual');
	});
	it('blocks cross-origin mutations before contacting backend', async () => {
		const fetch = vi.fn();
		vi.stubGlobal('fetch', fetch);
		expect((await proxy(event('/api/notes', 'POST', 'https://evil.test'))).status).toBe(403);
		expect(fetch).not.toHaveBeenCalled();
	});
	it('rejects unsupported methods', async () => expect((await proxy(event('/api/notes', 'PATCH'))).status).toBe(405));
	it('bootstraps CSRF once per session', async () => {
		const request = event();
		const fetch = vi.fn().mockResolvedValue(new Response('<meta name="csrf-token" content="csrf-value">'));
		vi.stubGlobal('fetch', fetch);
		expect(await csrfToken(request)).toBe('csrf-value');
		expect(await csrfToken(request)).toBe('csrf-value');
		expect(fetch).toHaveBeenCalledTimes(1);
		expect(request.cookieOptions[0].httpOnly).toBe(true);
	});
	it('fails safely if upstream CSRF metadata is absent', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>bad gateway</html>')));
		await expect(csrfToken(event())).rejects.toMatchObject({ status: 502 });
	});
	it('maps network failures to a safe 502', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('secret internal IP')));
		await expect(upstream(event(), '/')).rejects.toMatchObject({ status: 502 });
	});
	it.each([401, 419, 302])('rejects expired authentication (%s)', async (status) => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status })));
		await expect(jsonData(event(), '/api/notes')).rejects.toMatchObject({ status: 401 });
	});
	it('streams exports and strips private upstream headers', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Markdown', { headers: { 'content-disposition': 'attachment; filename=note.md', 'set-cookie': 'notenux-session=private; Path=/' } })));
		const response = await proxy(event('/api/notes/1/export/md'));
		expect(await response.text()).toBe('Markdown');
		expect(response.headers.get('content-disposition')).toContain('note.md');
		expect(response.headers.has('set-cookie')).toBe(false);
		expect(response.headers.get('cache-control')).toBe('private, no-store');
	});
	it('does not follow backend redirects to arbitrary URLs', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 302, headers: { Location: 'https://evil.test' } })));
		expect((await proxy(event())).status).toBe(401);
	});
	it('never reflects submitted passwords in validation errors', async () => {
		const request = event('/login', 'POST');
		request.jar.set('notenux_csrf', 'csrf-value');
		request.request = new Request(request.url, { method: 'POST', body: new URLSearchParams({ email: 'x@test.dev', password: 'secret-password' }) });
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ errors: { email: ['Invalid credentials'] } }, { status: 422 })));
		const result = await authenticate(request, '/login');
		expect(result.status).toBe(422);
		expect(JSON.stringify(result)).not.toContain('secret-password');
	});
});
