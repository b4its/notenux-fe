import { test, expect } from '@playwright/test';

test('large manuscripts switch without building hidden editor views', async ({ page }, testInfo) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	const selectNote = async (id: number) => {
		if ((page.viewportSize()?.width || 0) < 1024) {
			await page.locator('#mobile-explorer-toggle-btn').click();
		}
		await page.locator(`.note-list-card[data-note-id="${id}"]`).click();
	};
	await page.goto('/login');
	await page.locator('input[name="email"]').fill('scribe@example.test');
	await page.locator('input[name="password"]').fill('password123');
	await page.locator('form button[type="submit"]').click();
	await expect(page.locator('#editor-content')).toContainText('Halo dari backend uji.');
	const id = await page.evaluate(async () => {
		const content = Array.from({ length: 4000 }, (_, index) =>
			`<p>Paragraf ${index}: ${'Naskah panjang tetap utuh dan responsif. '.repeat(3)}</p>`).join('')
			+ '<script>globalThis.__noteXss = true</script><img src="javascript:unsafe()" onerror="globalThis.__noteXss = true">';
		const response = await fetch('/api/notes', {
			method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: 'Naskah panjang', content, category: 'catatan' })
		});
		if (!response.ok) throw new Error(`Large manuscript rejected: ${response.status}`);
		return (await response.json()).data.id;
	});
	await page.reload();
	await expect(page.locator('#editor-content')).toContainText('Halo dari backend uji.');
	// Measure only the editor commit, excluding backend/network latency.
	await page.evaluate(() => {
		const panel = (window as any).notenux;
		const original = panel.loadNoteIntoEditor;
		panel.loadTimings = [];
		panel.plainConversions = 0;
		const plain = panel.htmlToPlainText;
		panel.htmlToPlainText = function (html: string) {
			this.plainConversions++;
			return plain.call(this, html);
		};
		panel.loadNoteIntoEditor = function (note: unknown) {
			const start = performance.now();
			original.call(this, note);
			this.loadTimings.push(performance.now() - start);
		};
	});
	for (let index = 0; index < 2; index++) {
		await selectNote(id);
		await expect(page.locator('#note-title-input')).toHaveValue('Naskah panjang');
		await expect(page.locator('#editor-content p')).toHaveCount(4000);
		await expect(page.locator('#editor-content p').last()).toContainText('Paragraf 3999');
		await expect(page.locator('#editor-content script, #editor-content [onerror], #editor-content [src^="javascript:"]')).toHaveCount(0);
		expect(await page.evaluate(() => Boolean((window as any).__noteXss))).toBe(false);
		await expect(page.locator('#markdown-raw-editor')).toHaveValue('');
		await expect(page.locator('#plain-text-editor')).toHaveValue('');
		await selectNote(1);
		await expect(page.locator('#note-title-input')).toHaveValue('Catatan pertama');
		await expect(page.locator('#editor-content')).toContainText('Halo dari backend uji.');
	}
	const timings = await page.evaluate(() => (window as any).notenux.loadTimings);
	console.log(`${testInfo.project.name} editor commit times (ms): ${JSON.stringify(timings)}`);
	await testInfo.attach('editor-commit-times', { body: JSON.stringify(timings), contentType: 'application/json' });
	expect(await page.evaluate(() => (window as any).notenux.plainConversions)).toBe(0);
	// A generous guard against returning to the measured 473–531 ms synchronous path.
	expect(Math.max(...timings)).toBeLessThan(400);

	// Visible modes still initialize on demand, including when switching notes
	// with that mode already selected. Round-tripping must retain all paragraphs.
	await page.keyboard.press('Control+m');
	await expect(page.locator('#markdown-raw-editor')).toHaveValue(/Halo dari backend uji/);
	await selectNote(id);
	await expect(page.locator('#markdown-raw-editor')).toHaveValue(/Paragraf 3999/);
	await page.keyboard.press('Control+m');
	await expect(page.locator('#editor-content p')).toHaveCount(4000);
	await page.keyboard.press('Alt+n');
	await expect(page.locator('#plain-text-editor')).toHaveValue(/Paragraf 3999/);
	await selectNote(1);
	await expect(page.locator('#plain-text-editor')).toHaveValue(/Halo dari backend uji/);
	await page.keyboard.press('Alt+n');
	await selectNote(id);
	await expect(page.locator('#editor-content p')).toHaveCount(4000);
	const saved = page.waitForResponse((response) =>
		response.url().endsWith(`/api/notes/${id}`) && response.request().method() === 'PUT');
	await page.keyboard.press('Control+s');
	const saveResponse = await saved;
	expect(saveResponse.ok()).toBeTruthy();
	const savedContent = (await saveResponse.json()).data.content as string;
	expect(savedContent.match(/<p>/g)).toHaveLength(4000);
	expect(savedContent).toContain('Paragraf 3999');

	// The first manuscript on a fresh page must not be embedded in SSR HTML, then
	// downloaded a second time. Only summaries belong in the Studio shell.
	await page.evaluate(async () => {
		const response = await fetch('/api/notes/1', { method: 'DELETE' });
		if (!response.ok) throw new Error('Fixture cleanup failed');
	});
	let detailRequests = 0;
	page.on('request', (request) => {
		if (request.url().endsWith(`/api/notes/${id}`) && request.method() === 'GET') detailRequests++;
	});
	const response = await page.reload();
	expect(await response!.text()).not.toContain('Paragraf 3999');
	await expect(page.locator('#editor-content p')).toHaveCount(4000);
	await expect(page.locator('#editor-content p').last()).toContainText('Paragraf 3999');
	expect(detailRequests).toBe(1);
	expect(errors).toEqual([]);
});

test('switching overlaps a slow save and download without discarding the old manuscript', async ({ page }) => {
	await page.goto('/login');
	await page.locator('input[name="email"]').fill('scribe@example.test');
	await page.locator('input[name="password"]').fill('password123');
	await page.locator('form button[type="submit"]').click();
	await expect(page.locator('#editor-content')).toContainText('Halo dari backend uji.');
	const id = await page.evaluate(async () => {
		const makeContent = (label: string) => Array.from({ length: 2000 }, (_, index) =>
			`<p>${label} ${index}: ${'Naskah panjang harus tersimpan utuh. '.repeat(3)}</p>`).join('');
		const put = await fetch('/api/notes/1', {
			method: 'PUT', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content: makeContent('Sumber') })
		});
		if (!put.ok) throw new Error('Cannot prepare source manuscript');
		const post = await fetch('/api/notes', {
			method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: 'Tujuan panjang', category: 'catatan', content: makeContent('Tujuan') })
		});
		if (!post.ok) throw new Error('Cannot prepare target manuscript');
		return (await post.json()).data.id;
	});
	await page.reload();
	await expect(page.locator('#editor-content p')).toHaveCount(2000);
	await expect(page.locator('#editor-content p').last()).toContainText('Sumber 1999');
	let releaseSave!: () => void;
	const gate = new Promise<void>((resolve) => { releaseSave = resolve; });
	let observedSave!: () => void;
	const saving = new Promise<void>((resolve) => { observedSave = resolve; });
	await page.route('**/api/notes/1', async (route) => {
		if (route.request().method() === 'PUT') {
			observedSave();
			await gate;
		}
		await route.continue();
	});
	const downloading = page.waitForRequest((request) =>
		request.url().endsWith(`/api/notes/${id}`) && request.method() === 'GET');
	try {
		await page.locator('#note-title-input').fill('Perubahan belum tersimpan');
		if ((page.viewportSize()?.width || 0) < 1024) {
			await page.locator('#mobile-explorer-toggle-btn').click();
		}
		await page.locator(`.note-list-card[data-note-id="${id}"]`).click();
		await saving;
		// This request must start while the save is still deliberately blocked.
		await downloading;
		await expect(page.locator('#note-title-input')).toHaveValue('Perubahan belum tersimpan');
		await expect(page.locator('#editor-content p').last()).toContainText('Sumber 1999');
	} finally {
		releaseSave();
	}
	await expect(page.locator('#note-title-input')).toHaveValue('Tujuan panjang');
	await expect(page.locator('#editor-content p')).toHaveCount(2000);
	await expect(page.locator('#editor-content p').last()).toContainText('Tujuan 1999');
	const source = await page.request.get('/api/notes/1');
	const note = (await source.json()).data;
	expect(note.title).toBe('Perubahan belum tersimpan');
	expect(note.content.match(/<p>/g)).toHaveLength(2000);
	expect(note.content).toContain('Sumber 1999');
});
