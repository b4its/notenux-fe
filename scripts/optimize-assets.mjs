import sharp from 'sharp';
import { readdir, readFile, writeFile } from 'node:fs/promises';

async function optimize(path) {
	for (const entry of await readdir(path, { withFileTypes: true })) {
		const file = `${path}/${entry.name}`;
		if (entry.isDirectory()) await optimize(file);
		else if (file.endsWith('.webp')) {
			const width = entry.name.includes('horizontal') ? 480 : entry.name.includes('vertical') ? 320 : 160;
			const input = await readFile(file);
			await writeFile(file, await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality: 85, effort: 6 }).toBuffer());
		}
	}
}
await optimize('static/assets/logo');
