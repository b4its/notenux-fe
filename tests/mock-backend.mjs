import http from 'node:http';

const user = { id: 1, name: 'Test Scribe', email: 'scribe@example.test', notes_count: 1 };
const stats = { level: 2, rank_title: 'Novice Scribe', total_xp: 120, progress_percent: 20, total_notes: 1, total_words: 10, mana: '50/100 MP', rank_badge: 'fa-award' };
let notes, categories, folders, sequence;
function reset() {
	sequence = 10;
	categories = [{ id: 1, name: 'Catatan', slug: 'catatan', icon: 'fa-solid fa-note-sticky', color: 'blue', description: 'Catatan harian', notes_count: 1, is_system: false }];
	folders = [];
	notes = [{ id: 1, title: 'Catatan pertama', content: '<p>Halo dari backend uji.</p>', category: 'catatan', folder_id: null, font_family: 'sans', font_size: '16px', theme_color: 'blue', is_pinned: false, is_favorite: false, level: 1, xp: 10, word_count: 5, char_count: 22, chunks_count: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }];
}
reset();
http.createServer(async (request, response) => {
	const url = new URL(request.url, 'http://localhost');
	const path = url.pathname;
	const send = (status, data) => {
		response.writeHead(status, { 'Content-Type': 'application/json' });
		response.end(JSON.stringify(data));
	};
	const success = (data) => send(200, { status: 'success', data });
	if (path === '/health') return success({});
	if (request.method === 'GET' && path === '/') {
		const session = request.headers.cookie?.includes('notenux-session=test-session') ? 'test-session' : 'guest-session';
		response.writeHead(200, { 'Content-Type': 'text/html', 'Set-Cookie': [`notenux-session=${session}; Path=/; HttpOnly; SameSite=Lax`, 'XSRF-TOKEN=csrf-mock; Path=/'] });
		return response.end('<meta name="csrf-token" content="csrf-mock">');
	}
	let raw = '';
	for await (const chunk of request) raw += chunk;
	let body = {};
	if (request.headers['content-type']?.includes('application/json')) body = JSON.parse(raw || '{}');
	else if (request.headers['content-type']?.includes('multipart/form-data')) {
		const parts = [...raw.matchAll(/name="([^"]+)"\r\n\r\n([\s\S]*?)\r\n--/g)];
		body = Object.fromEntries(parts.map((match) => [match[1], match[2]]));
	} else body = Object.fromEntries(new URLSearchParams(raw));
	if (request.method !== 'GET' && request.headers['x-csrf-token'] !== 'csrf-mock') return send(419, { message: 'CSRF mismatch' });
	if (['/login', '/register'].includes(path) && request.method === 'POST') {
		if (body.email !== 'scribe@example.test' || body.password !== 'password123') {
			return send(422, { errors: { email: ['Kredensial tidak cocok.'] } });
		}
		reset();
		response.writeHead(302, { Location: '/studio', 'Set-Cookie': 'notenux-session=test-session; Path=/; HttpOnly' });
		return response.end();
	}
	if (!request.headers.cookie?.includes('notenux-session=test-session')) return send(401, { message: 'Unauthenticated.' });
	if (path === '/logout') {
		response.writeHead(302, { Location: '/', 'Set-Cookie': 'notenux-session=; Max-Age=0; Path=/' });
		return response.end();
	}
	if (path === '/api/profile' || path === '/profile') return success(request.method === 'GET' ? user : { ...user, ...body });
	if (path === '/api/player-stats') return success(stats);
	if (path === '/api/notes' && request.method === 'GET') {
		return success(notes.filter((note) => !url.searchParams.get('q') || note.title.toLowerCase().includes(url.searchParams.get('q').toLowerCase())).map(({ content, ...note }) => note));
	}
	if (path === '/api/notes' && request.method === 'POST') {
		const note = { ...notes[0], ...body, id: ++sequence, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
		notes.push(note); return success(note);
	}
	const noteRoute = path.match(/^\/api\/notes\/(\d+)(?:\/(.+))?$/);
	if (noteRoute) {
		const note = notes.find((item) => item.id === Number(noteRoute[1]));
		if (!note) return send(404, { message: 'Not found' });
		const action = noteRoute[2];
		if (action?.startsWith('export')) {
			response.writeHead(200, { 'Content-Type': 'text/plain', 'Content-Disposition': 'attachment; filename="note.md"' });
			return response.end(note.content);
		}
		if (action === 'chunks') return success([{ id: 1, chunk_uid: 'test-shard', content: note.content, checksum: 'abc', position: 0, byte_length: 22 }]);
		if (action === 'chunks/verify') return success({ total_chunks: 1, corrupted_chunks: 0, is_valid: true, all_valid: true });
		if (action === 'pin') note.is_pinned = !note.is_pinned;
		if (action === 'favorite') note.is_favorite = !note.is_favorite;
		if (action === 'duplicate') { const clone = { ...note, id: ++sequence, title: `${note.title} (Copy)` }; notes.push(clone); return success(clone); }
		if (request.method === 'PUT') Object.assign(note, body);
		if (request.method === 'DELETE') notes = notes.filter((item) => item.id !== note.id);
		return success(note);
	}
	for (const [prefix, list] of [['categories', categories], ['folders', folders]]) {
		if (path === `/api/${prefix}` && request.method === 'GET') return success(list);
		if (path === `/api/${prefix}` && request.method === 'POST') {
			const item = { id: ++sequence, ...body, slug: body.slug || body.name.toLowerCase().replaceAll(' ', '-'), notes_count: 0 };
			list.push(item); return success(item);
		}
		if (path === `/api/${prefix}/bulk-delete`) {
			for (const id of body.ids) { const index = list.findIndex((item) => item.id === id); if (index >= 0) list.splice(index, 1); }
			return success({});
		}
		if (path.startsWith(`/api/${prefix}/`)) {
			const index = list.findIndex((item) => item.id === Number(path.split('/').at(-1)));
			if (index < 0) return send(404, { message: 'Not found' });
			if (request.method === 'DELETE') list.splice(index, 1);
			else Object.assign(list[index], body, { id: Number(path.split('/').at(-1)) });
			return success(list[index] || {});
		}
	}
	send(404, { message: 'Mock route not found' });
}).listen(4174, '127.0.0.1');
