<script lang="ts">
	import { page } from '$app/state';
</script>
<svelte:head><title>{page.status} — Notenux</title></svelte:head>
<main class="min-h-screen grid place-items-center p-6">
	<div class="arcade-card p-8 rounded-xl max-w-lg text-center space-y-5">
		<h1 class="font-pixel text-xl">{page.status}</h1>
		<p>{page.error?.message || 'Terjadi kesalahan.'}</p>
		<a href="/" class="arcade-btn inline-block bg-blue-600 text-white px-4 py-2 rounded">Kembali ke beranda</a>
	</div>
</main>
