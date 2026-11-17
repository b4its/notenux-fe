import { RetroAudio } from './audio.js';

export function start() {
	const audio = new RetroAudio();
	window.notenux = { audio };
	// This runs after the DOM is parsed, including SSR-only public pages.
	document.getElementById('app-favicon')?.setAttribute('href',
		document.documentElement.classList.contains('dark') ? '/assets/logo/dark/icon_dark.webp' : '/assets/logo/light/icon_light.webp');
	const themeButton = document.getElementById('theme-toggle-btn');
	themeButton?.addEventListener('click', () => {
		const dark = !document.documentElement.classList.contains('dark');
		document.documentElement.classList.toggle('dark', dark);
		document.documentElement.dataset.theme = dark ? 'dark' : 'light';
		localStorage.setItem('notenux_theme', dark ? 'dark' : 'light');
		document.getElementById('app-favicon')?.setAttribute('href', `/assets/logo/${dark ? 'dark/icon_dark' : 'light/icon_light'}.webp`);
	});
	const crt = document.getElementById('crt-toggle-btn');
	document.body.classList.toggle('crt-mode', localStorage.getItem('notenux_crt') === 'true');
	crt?.addEventListener('click', () => {
		const enabled = document.body.classList.toggle('crt-mode');
		localStorage.setItem('notenux_crt', String(enabled));
		audio.playWarp();
	});
	const sound = document.getElementById('sound-toggle-btn');
	sound?.addEventListener('click', () => {
		const muted = !audio.toggle();
		sound.setAttribute('aria-pressed', String(!muted));
		sound.querySelector('i')?.classList.toggle('fa-volume-xmark', muted);
	});
}
