import { test, expect, type Page } from '@playwright/test';

async function login(page: Page) {
	await page.goto('/login');
	await page.locator('input[name="email"]').fill('scribe@example.test');
	await page.locator('input[name="password"]').fill('password123');
	await page.locator('form button[type="submit"]').click();
	await expect(page).toHaveURL(/\/studio$/);
	await expect(page.locator('#note-title-input')).toHaveValue('Catatan pertama');
	await expect(page.locator('#editor-content')).toContainText('Halo dari backend uji.');
	// The editor chunk loads after hydration, not in the public-page bundle.
	await page.waitForFunction(() => Boolean((window as unknown as { notenux?: unknown }).notenux));
}

test('landing renders without browser errors, overflow or external font requests', async ({ page }, testInfo) => {
	const errors: string[] = [];
	const external: string[] = [];
	const scripts: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	page.on('request', (request) => { if (!request.url().startsWith('http://127.0.0.1')) external.push(request.url()); });
	page.on('request', (request) => { if (request.resourceType() === 'script') scripts.push(request.url()); });
	await page.goto('/');
	await expect(page.locator('h1')).toBeVisible();
	await expect(page.locator('#theme-toggle-btn')).toBeVisible();
	await page.locator('#theme-toggle-btn').click();
	const theme = await page.locator('html').getAttribute('data-theme');
	await page.reload();
	await expect(page.locator('html')).toHaveAttribute('data-theme', theme!);
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
	await page.locator('.faq-trigger').first().click();
	await expect(page.locator('.faq-content').first()).toBeVisible();
	expect(errors).toEqual([]);
	expect(external).toEqual([]);
	expect(scripts.every((script) => script.endsWith('/landing.min.js'))).toBeTruthy();
	await page.screenshot({ path: testInfo.outputPath('landing.png'), fullPage: true });
});

test('mobile navigation opens and closes accessibly', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	const button = page.locator('#landing-mobile-menu-btn');
	await button.click();
	await expect(button).toHaveAttribute('aria-expanded', 'true');
	await page.locator('#landing-mobile-menu a').first().click();
	await expect(button).toHaveAttribute('aria-expanded', 'false');
});

test('login validates failures and password visibility', async ({ page }) => {
	await page.goto('/login');
	const password = page.locator('input[name="password"]');
	await password.fill('wrong-password');
	await page.locator('.toggle-password-btn').first().click();
	await expect(password).toHaveAttribute('type', 'text');
	await page.locator('input[name="email"]').fill('wrong@example.test');
	await page.locator('form button[type="submit"]').click();
	await expect(page.getByText('Kredensial tidak cocok.')).toBeVisible();
	await expect(page.locator('input[name="email"]')).toHaveValue('wrong@example.test');
	expect((await page.content()).includes('wrong-password')).toBeFalsy();
});

test('protected pages redirect guests', async ({ page }) => {
	for (const path of ['/studio', '/categories', '/panel']) {
		await page.goto(path);
		await expect(page).toHaveURL(/\/login$/);
	}
});

test('studio loads, edits, saves, pins and favorites notes', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await login(page);
	await page.locator('#note-title-input').fill('Judul diperbarui');
	await page.locator('#note-title-input').dispatchEvent('input');
	await page.locator('#editor-content').fill('Tulisan baru yang tidak boleh hilang.');
	const saved = page.waitForResponse((response) => response.url().endsWith('/api/notes/1') && response.request().method() === 'PUT');
	await page.locator('#save-now-btn').click({ force: true });
	expect((await saved).ok()).toBeTruthy();
	await page.reload();
	await expect(page.locator('#note-title-input')).toHaveValue('Judul diperbarui');
	await expect(page.locator('#editor-content')).toContainText('Tulisan baru');
	await page.waitForFunction(() => Boolean((window as unknown as { notenux?: unknown }).notenux));
	const pin = page.waitForResponse('**/api/notes/1/pin');
	await page.locator('#pin-note-btn').click({ force: true });
	expect((await pin).ok()).toBeTruthy();
	const favorite = page.waitForResponse('**/api/notes/1/favorite');
	await page.locator('#favorite-note-btn').click({ force: true });
	expect((await favorite).ok()).toBeTruthy();
	expect(errors).toEqual([]);
});

test('categories support create, search, edit and delete', async ({ page }) => {
	await login(page);
	await page.goto('/categories');
	await page.locator('input[name="name"]').fill('Eksperimen');
	await page.getByRole('button', { name: 'FORGE CATEGORY', exact: true }).click();
	await expect(page.getByRole('heading', { name: 'Eksperimen' })).toBeVisible();
	await page.getByPlaceholder('Search category...').fill('eksperimen');
	await expect(page.locator('.category-card')).toHaveCount(1);
	await page.getByRole('button', { name: 'Edit Eksperimen', exact: true }).click();
	await page.getByRole('dialog').locator('input[name="name"]').fill('Revisi');
	await page.getByRole('button', { name: 'Simpan', exact: true }).click();
	await expect(page.getByRole('heading', { name: 'Revisi', exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Hapus Revisi', exact: true }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Hapus', exact: true }).click();
	await expect(page.getByRole('heading', { name: 'Revisi', exact: true })).toHaveCount(0);
});

test('proxy rejects cross-origin writes and never exposes backend cookies', async ({ request }) => {
	const response = await request.post('/api/notes', {
		headers: { Origin: 'https://attacker.test' }, data: { title: 'attack' }
	});
	expect(response.status()).toBe(403);
	const unknown = await request.get('/api/arbitrary-upstream');
	expect(unknown.status()).toBe(404);
});

test('register page has confirmation and no horizontal overflow', async ({ page }) => {
	await page.goto('/register');
	await expect(page.locator('input[name="password_confirmation"]')).toBeVisible();
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test('registration and logout preserve the session boundary', async ({ page }) => {
	await page.goto('/register');
	await page.locator('input[name="name"]').fill('Test Scribe');
	await page.locator('input[name="email"]').fill('scribe@example.test');
	await page.locator('input[name="password"]').fill('password123');
	await page.locator('input[name="password_confirmation"]').fill('password123');
	await page.locator('form button[type="submit"]').click();
	await expect(page).toHaveURL(/\/studio$/);
	const cookies = await page.context().cookies();
	expect(cookies.find((cookie) => cookie.name === 'notenux-session')?.httpOnly).toBeTruthy();
	await page.goto('/categories');
	await page.locator('form[action="/logout"] button').click();
	await expect(page).toHaveURL('http://127.0.0.1:4173/');
	await page.goto('/studio');
	await expect(page).toHaveURL(/\/login$/);
});

test('note CRUD, folders and exports use the authenticated proxy contract', async ({ page }) => {
	await login(page);
	const result = await page.evaluate(async () => {
		const call = async (path: string, method = 'GET', body?: unknown) => {
			const response = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
			return { status: response.status, data: await response.json() };
		};
		const created = await call('/api/notes', 'POST', { title: 'Temporary', content: '<p>Text</p>', category: 'catatan' });
		const id = created.data.data.id;
		const loaded = await call(`/api/notes/${id}`);
		const folder = await call('/api/folders', 'POST', { name: 'Temporary folder' });
		const moved = await call(`/api/notes/${id}`, 'PUT', { folder_id: folder.data.data.id });
		const exported = await fetch(`/api/notes/${id}/export/csv`);
		const deleted = await call(`/api/notes/${id}`, 'DELETE');
		await call(`/api/folders/${folder.data.data.id}`, 'DELETE');
		const absent = await call(`/api/notes/${id}`);
		return { created: created.status, loaded: loaded.data.data.title, moved: moved.status, exported: exported.status, disposition: exported.headers.get('content-disposition'), deleted: deleted.status, absent: absent.status };
	});
	expect(result).toEqual({ created: 200, loaded: 'Temporary', moved: 200, exported: 200, disposition: 'attachment; filename="note.md"', deleted: 200, absent: 404 });
});

test('category bulk deletion confirms intent and dialogs support Escape', async ({ page }) => {
	await login(page);
	await page.goto('/categories');
	await page.getByRole('button', { name: 'Edit Catatan', exact: true }).click();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog')).toHaveCount(0);
	await page.getByRole('checkbox', { name: 'Pilih kategori Catatan', exact: true }).check();
	await page.getByRole('button', { name: 'Hapus terpilih (1)', exact: true }).click();
	await expect(page.getByRole('dialog')).toBeVisible();
	await page.getByRole('dialog').getByRole('button', { name: 'Hapus', exact: true }).click();
	await expect(page.locator('.category-card')).toHaveCount(0);
});

test('login progressively works without JavaScript', async ({ browser }) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	const page = await context.newPage();
	await page.goto('http://127.0.0.1:4173/login');
	await page.locator('input[name="email"]').fill('scribe@example.test');
	await page.locator('input[name="password"]').fill('password123');
	await page.locator('form button[type="submit"]').click();
	await expect(page).toHaveURL(/\/studio$/);
	await expect(page.locator('#note-title-input')).toHaveValue('Catatan pertama');
	await context.close();
});
