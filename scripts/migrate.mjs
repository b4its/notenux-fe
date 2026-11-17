// One-time, reproducible migration of the original Notenux presentation and editor.
// Runtime and production builds do not depend on the Laravel repository.
import { readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const source = resolve(process.argv[2] || '../../notenux');
const put = (path, text) => {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, text.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n');
};
const routes = {
	landing: '/', studio: '/studio', login: '/login', register: '/register',
	logout: '/logout', 'categories.index': '/categories'
};

function expression(value) {
	let text = value.trim();
	if (text.startsWith('asset(')) return JSON.stringify('/' + text.match(/'([^']+)'/)[1]);
	if (text.startsWith('route(')) return JSON.stringify(routes[text.match(/'([^']+)'/)[1]]);
	if (text === "date('Y')") return 'new Date().getFullYear()';
	if (text === '$noteCount') return 'data.noteCount ?? 0';
	if (text === 'auth()->user()->name') return 'data.user?.name';
	if (text.startsWith('old(')) return `form?.values?.${text.match(/'([^']+)'/)[1]} ?? ''`;
	text = text.replace(/Str::limit\((.*?),\s*(\d+)(?:,\s*'')?\)/g, '($1).slice(0, $2)');
	text = text.replace(/strtoupper\((.*)\)/g, '($1).toUpperCase()');
	text = text.replace(/\$stats/g, 'stats').replace(/\$user->/g, 'data.user?.');
	text = text.replace(/\$activeNote->/g, 'activeNote?.').replace(/\$activeNote/g, 'activeNote');
	text = text.replace(/\$(category|folder)->/g, '$1.');
	text = text.replace(/\$error/g, 'message');
	text = text.replace(/isset\(activeNote\)/g, 'Boolean(activeNote)');
	return text;
}

for (const [name, route] of [['landing', ''], ['auth/login', 'login'], ['auth/register', 'register'], ['panel', 'studio']]) {
	const original = readFileSync(`${source}/resources/views/${name}.blade.php`, 'utf8');
	const styles = [...original.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((match) => match[1]).join('\n');
	if (styles) put(`src/lib/styles/${route || 'landing'}.css`, styles);
	let body = original.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
	const bodyClass = original.match(/<body class="([^"]*)"/)[1];
	const scripts = [...body.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
		.filter((match) => !match[0].includes('application/json')).map((match) => match[1]);
	body = body.replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/g, '');
	body = body.replace(/<!--(?![^>]*Tier [12]:)[\s\S]*?-->/g, '');
	// Encode literal braces before introducing Svelte syntax (e.g. Markdown demo text).
	body = body.replace(/\{\{([\s\S]*?)\}\}/g, (_, value) => `ZZOPEN${expression(value)}ZZCLOSE`);
	body = body.replace(/\{!![\s\S]*?!!\}/g, '');
	body = body.replace(/[{}]/g, (char) => char === '{' ? '&#123;' : '&#125;');
	body = body.replace(/ZZOPEN/g, '{').replace(/ZZCLOSE/g, '}');
	body = body.replace(/@csrf/g, '');
	body = body.replace(/@auth/g, '{#if data.user}').replace(/@guest/g, '{#if !data.user}');
	body = body.replace(/@end(auth|guest)/g, '{/if}');
	body = body.replace(/@if\s*\(isset\(\$(categories|folders)\) && \$\1->isNotEmpty\(\)\)/g, '{#if data.$1?.length}');
	body = body.replace(/@if\s*\(\$activeNote\)/g, '{#if activeNote}');
	body = body.replace(/@if\s*\(\$errors->any\(\)\)/g, '{#if form?.errors?.length}');
	body = body.replace(/@foreach\s*\(\$(categories|folders) as \$(category|folder)\)/g, '{#each data.$1 as $2}');
	body = body.replace(/@foreach\s*\(\$errors->all\(\) as \$error\)/g, '{#each form.errors as message}');
	body = body.replace(/@endforeach/g, '{/each}').replace(/@else/g, '{:else}').replace(/@endif/g, '{/if}');
	body = body.replace(/\{activeNote \? '' : 'readonly'\}/g, 'readonly={!activeNote}');
	body = body.replace(/\{Boolean\(activeNote\) && activeNote\?\.folder_id === folder.id \? 'selected' : ''\}/g, 'selected={activeNote?.folder_id === folder.id}');
	body = body.replace(/onclick="([^"]*)"/g, (_, code) => `onclick={() => { ${code} }}`);
	body = body.replace(/document.getElementById\('shortcuts-modal'\)\.classList/g, "document.getElementById('shortcuts-modal')?.classList");
	body = body.replace(/href="#"/g, 'href="#main-content"');
	body = body.replace(/<i(\s|>)/g, '<i aria-hidden="true"$1');
	body = body.replace(/\s+autofocus\b/g, '');
	body = body.replace(/\{#if activeNote\}\s*\{:else\}/g, '{#if !activeNote}');
	// Repair inherited accessibility issues without changing the original appearance.
	body = body.replace(/<label(?![^>]*\bfor=)([^>]*>[\s\S]*?<\/label>\s*<(?:input|select|textarea)[^>]*\bid="([^"]+)")/g, '<label for="$2"$1');
	body = body.replace('<label class="block font-bold mb-1"><i aria-hidden="true" class="fa-solid fa-file-arrow-up', '<label for="import-file-input" class="block font-bold mb-1"><i aria-hidden="true" class="fa-solid fa-file-arrow-up');
	body = body.replace(/<button((?:(?!<\/button>)[\s\S])*?)>(\s*<i[^>]*><\/i>\s*)<\/button>/g, (match, attributes, icon) =>
		/aria-label=|title=/.test(attributes) ? match : `<button aria-label="Tutup panel"${attributes}>${icon}</button>`);
	body = body.replace(/<form method="POST" action="\{("\/login"|"\/register")\}"/g, '<form method="POST" use:enhance');
	// A form's POST action intentionally remains local. Force full navigation for the
	// isolated rich-editor lifetime so document listeners cannot survive route changes.
	body = `<div class="${bodyClass}" data-sveltekit-reload>\n${body}\n</div>`;
	const isStudio = route === 'studio';
	const runtime = route || 'landing';
	if (!isStudio) {
		let code = scripts.join('\n');
		code = code.replace(/document\.addEventListener\('DOMContentLoaded',\s*(?:function\(\)|\(\) =>)\s*\{/g, 'export function start() {');
		code = code.replace(/\}\);\s*$/, '}');
		code = code.replace(/\{\{\s*(.*?)\s*\}\}/g, (_, value) => value.includes('route(') || value.includes('asset(') ? JSON.parse(expression(value)) : '');
		if (code.trim()) put(`src/lib/runtime/${runtime}.js`, code);
	}
	const imports = `${styles ? `import '#lib/styles/${runtime}.css';` : ''}
	${route ? "import { onMount } from 'svelte';" : ''}
	${['login', 'register'].includes(route) ? "import { enhance } from '$app/forms';" : ''}
	let { data${['login', 'register'].includes(route) ? ', form = null' : ''} } = $props();
	${isStudio ? 'let stats = $derived(data.stats || {}); let activeNote = $derived(data.notes?.[0] || null);' : ''}
	${route ? `onMount(() => {
		${isStudio ? '' : "import('#lib/runtime/chrome.js').then(m => m.start());"}
		import('#lib/runtime/${runtime}.js').then(m => m.start(${isStudio ? 'data' : ''}));
	});` : ''}`;
	const title = isStudio ? 'Notenux Studio - Editor Catatan & Markdown Gamifikasi'
		: route === 'login' ? 'Masuk ke Studio - Notenux' : route === 'register' ? 'Daftar Akun - Notenux'
		: 'Notenux - Aplikasi Catatan & Studio Tulis Gamifikasi Retro Modern';
	put(`src/routes/${route ? route + '/' : ''}+page.svelte`,
		`<script>\n${imports}\n</script>\n<svelte:head><title>${title}</title><meta name="description" content="Notenux: studio menulis retro modern, Markdown, gamifikasi RPG dan penyimpanan otomatis." />${!route ? '<script type="module" src="/landing.min.js"></script>' : ''}${isStudio ? '<meta name="robots" content="noindex,nofollow" />' : ''}</svelte:head>\n${body.trim()}\n`);
}

let engine = readFileSync(`${source}/resources/js/app.js`, 'utf8');
put('src/lib/runtime/audio.js', engine.slice(engine.indexOf('class RetroAudio'), engine.indexOf('/**\n * Top-Right')).replace('class RetroAudio', 'export class RetroAudio'));
engine = engine.replace(/document\.addEventListener\('DOMContentLoaded', \(\) => \{([\s\S]*?)\n\}\);/, `export function start(data) {
	initialData = data;$1
}`);
engine = 'let initialData;\n' + engine;
engine = engine.replace(/    loadNotesFromDOM\(\) \{[\s\S]*?        this\.syncFoldersDOM\(\);/, `    loadNotesFromDOM() {
        this.categories = initialData.categories || [];
        this.notes = initialData.notes || [];
        this.folders = initialData.folders || [];
        this.syncFoldersDOM();`);
// CSRF is injected exclusively by the same-origin server proxy.
engine = engine.replace(/        'X-CSRF-TOKEN': .*?\n/, '');
put('src/lib/runtime/studio.js', engine);
let css = readFileSync(`${source}/resources/css/app.css`, 'utf8');
css = css.replace(/@source .*?;\n/g, '');
put('src/lib/styles/app.css', css + '\n:focus-visible { outline: 2px solid #22d3ee; outline-offset: 3px; }\n@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; } }\n');
mkdirSync('static/assets', { recursive: true });
cpSync(`${source}/public/assets/logo`, 'static/assets/logo', { recursive: true });
function removeUnusedPng(path) {
	for (const entry of readdirSync(path, { withFileTypes: true })) {
		const file = `${path}/${entry.name}`;
		if (entry.isDirectory()) removeUnusedPng(file);
		else if (entry.name.endsWith('.png')) unlinkSync(file);
	}
}
removeUnusedPng('static/assets/logo');
let tests = readFileSync(`${source}/tests/studio.test.js`, 'utf8')
	.replace('../resources/js/app.js', '../src/lib/runtime/studio.js')
	.replace('../resources/views/panel.blade.php', '../src/routes/studio/+page.svelte')
	.replace('../resources/views/landing.blade.php', '../src/routes/+page.svelte')
	.replace("'utf8');", "'utf8').replace('export function start', 'function start');")
	.replace("assert.equal(calls[0].options.headers['X-CSRF-TOKEN'], 'csrf-test');", "assert.equal(calls[0].options.headers['X-CSRF-TOKEN'], undefined);");
tests = tests.replace('save requests are serialized and each carries its own snapshot and CSRF token', 'save requests serialize snapshots without exposing server-side CSRF tokens');
put('tests/studio.test.js', tests);
