import { mkdir, writeFile, readdir, unlink } from 'node:fs/promises';

await mkdir('static/vendor/webfonts', { recursive: true });
async function download(url, path) {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`Download failed: ${url}`);
	const bytes = new Uint8Array(await response.arrayBuffer());
	await writeFile(path, path.endsWith('.txt') ? new TextDecoder().decode(bytes).replace(/[ \t]+$/gm, '') : bytes);
}
const response = await fetch('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Instrument+Sans:wght@400;500;600;700&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300&family=Press+Start+2P&family=VT323&display=swap', {
	headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
});
let css = await response.text();
// Only Latin is used by the original Indonesian UI.
const blocks = css.match(/(?:\/\*[^*]*\*\/\s*)?@font-face\s*\{[^}]+\}/g) || [];
const latin = blocks.filter((block) => !block.includes('unicode-range:') || /\/\* latin \*\//.test(block));
css = latin.join('\n');
let index = 0;
for (const url of new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map((match) => match[1]))) {
	const file = `font-${index++}.woff2`;
	await download(url, `static/vendor/${file}`);
	css = css.replaceAll(url, `/vendor/${file}`);
}
await writeFile('static/vendor/fonts.css', css);
for (const file of await readdir('static/vendor')) {
	if (/^font-\d+\.woff2$/.test(file) && !css.includes(`/vendor/${file}`)) await unlink(`static/vendor/${file}`);
}
const icons = await fetch('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');
await writeFile('static/vendor/icons.css', (await icons.text()).replaceAll('../webfonts/', '/vendor/webfonts/'));
await Promise.all(['fa-solid-900.woff2', 'fa-regular-400.woff2', 'fa-brands-400.woff2'].map((file) =>
	download(`https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/${file}`, `static/vendor/webfonts/${file}`)));
// Retain upstream licenses with redistributed assets.
await download('https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/LICENSE.txt', 'static/vendor/FONT-AWESOME-LICENSE.txt');
await Promise.all(['firacode', 'instrumentsans', 'merriweather', 'pressstart2p', 'vt323'].map((name) =>
	download(`https://raw.githubusercontent.com/google/fonts/main/ofl/${name}/OFL.txt`, `static/vendor/${name}-LICENSE.txt`)));
