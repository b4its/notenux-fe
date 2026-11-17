import { test, expect } from '@playwright/test';

// Synthetic requirements, not the confidential document supplied by a user.
for (const shape of ['paragraphs', 'single-block']) {
	test(`long requirements ${shape}: paint, input, switch and persistence`, async ({ page }, testInfo) => {
		test.setTimeout(90000);
		await page.goto('/login');
		await page.locator('input[name="email"]').fill('scribe@example.test');
		await page.locator('input[name="password"]').fill('password123');
		await page.locator('form button[type="submit"]').click();
		await expect(page.locator('#editor-content')).toContainText('Halo dari backend uji.');
		const fixture = await page.evaluate(async (shape) => {
			const rows = Array.from({ length: 1800 }, (_, i) =>
				`Bagian ${i}: ${'Persyaratan sintetis mencakup validasi, audit, hak akses dan kriteria penerimaan. '.repeat(8)}\nKode\tPeran\tHasil\nR-${i}\tPenguji\tBerhasil`);
			const content = shape === 'paragraphs'
				? rows.map(row => `<p>${row.replaceAll('\n', '<br>')}</p>`).join('')
				: `<div>${rows.join('<br>')}</div>`;
			const response = await fetch('/api/notes', {
				method: 'POST', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: `Requirements ${shape}`, category: 'catatan', content })
			});
			if (!response.ok) throw new Error(`Fixture rejected: ${response.status}`);
			return { id: (await response.json()).data.id, content };
		}, shape);
		await page.reload();
		await expect(page.locator('#editor-content')).toContainText('Halo dari backend uji.');
		const timings = await page.evaluate(async ({ id, content }) => {
			const panel = (window as any).notenux;
			const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
			const start = performance.now();
			await panel.selectNote({ id });
			if (panel.activeNote.id !== id) throw new Error('Target did not open');
			await frame();
			await frame();
			const painted = performance.now();
			const editor = document.querySelector('#editor-content') as HTMLElement;
			editor.focus();
			const selection = window.getSelection()!;
			selection.collapse(editor.firstChild!.firstChild!, 0);
			document.execCommand('insertText', false, 'EDITED ');
			await frame();
			await frame();
			const typed = performance.now();
			if (!editor.textContent?.startsWith('EDITED ')) throw new Error('Input lost');
			if (!panel.activeNote.content.includes('EDITED ')) {
				throw new Error('Active manuscript did not capture input');
			}
			panel.undo();
			if (editor.innerHTML !== content) throw new Error('Undo changed manuscript formatting');
			panel.redo();
			if (editor.innerHTML.replace('EDITED ', '') !== content) throw new Error('Redo lost manuscript content');
			const switching = performance.now();
			await panel.selectNote({ id: 1 });
			await frame();
			await frame();
			return { openToPaint: painted - start, inputToPaint: typed - painted, switchToPaint: performance.now() - switching };
		}, fixture);
		console.log(`${testInfo.project.name} ${shape} visible latency (ms): ${JSON.stringify(timings)}`);
		await testInfo.attach('visible-latency', { body: JSON.stringify(timings), contentType: 'application/json' });
		expect(timings.openToPaint).toBeLessThan(3000);
		expect(timings.inputToPaint).toBeLessThan(1500);
		const saved = await page.request.get(`/api/notes/${fixture.id}`);
		const note = (await saved.json()).data;
		expect(note.content).toContain('EDITED ');
		expect(note.content).toContain('R-1799');
		expect(note.content.replace('EDITED ', '') === fixture.content).toBe(true);
		await page.reload();
		await expect(page.locator('#editor-content')).toContainText('Halo dari backend uji.');
		await page.evaluate(async id => { await (window as any).notenux.selectNote({ id }); }, fixture.id);
		expect(await page.locator('#editor-content').evaluate(editor =>
			editor.innerHTML.replace('EDITED ', '')) === fixture.content).toBe(true);
	});
}
