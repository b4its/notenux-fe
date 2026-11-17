<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import type { SubmitFunction } from '$app/forms';
	import { focusDialog } from '#lib/dialog.js';
	let { data, form }: PageProps = $props();
	type Category = { id: number; name: string; slug: string; color: string; icon: string; description: string; notes_count: number; is_system: boolean };
	let editing = $state<Category | null>(null);
	let deleting = $state<Category | null>(null);
	let bulkDeleting = $state(false);
	let query = $state('');
	let selected = $state<number[]>([]);
	let color = $state('cyan');
	let icon = $state('fa-solid fa-flask');
	let busy = $state(false);
	const mutate: SubmitFunction = () => async ({ result, update }) => {
		if (result.type === 'redirect') {
			editing = null;
			deleting = null;
			bulkDeleting = false;
			selected = [];
			query = '';
		}
		await update();
	};
	const colors = ['cyan', 'blue', 'emerald', 'purple', 'rose', 'amber'];
	const icons = ['flask', 'scroll', 'book', 'code', 'list-check', 'lightbulb', 'star', 'gamepad', 'briefcase', 'heart', 'graduation-cap', 'music'];
	const categories = $derived((data.categories as Category[]).filter((category) =>
		`${category.name} ${category.slug} ${category.description || ''}`.toLowerCase().includes(query.toLowerCase())));
	onMount(() => { import('#lib/runtime/chrome.js').then((module) => module.start()); });
</script>
<svelte:window onkeydown={(event) => {
	if (event.key === 'Escape') { editing = null; deleting = null; bulkDeleting = false; }
}} />

<svelte:head><title>Grimoire Categories — Notenux</title><meta name="robots" content="noindex,nofollow" /></svelte:head>
<div class="retro-crt-screen min-h-screen font-sans antialiased" data-sveltekit-reload>
	<header class="sticky top-0 z-40 bg-surface border-b-2 border-black dark:border-blue-900 px-4 py-3 shadow-[0_4px_0_rgba(0,0,0,0.25)]">
		<div class="max-w-7xl mx-auto flex items-center justify-between gap-3">
			<a href="/studio" class="flex items-center gap-3" title="Kembali ke Studio">
				<i class="fa-solid fa-arrow-left"></i>
				<img src="/assets/logo/dark/icon_horizontal_dark.webp" class="h-8 w-auto hidden dark:block" alt="Notenux Studio" />
				<img src="/assets/logo/light/icon_horizontal_light.webp" class="h-8 w-auto dark:hidden" alt="Notenux Studio" />
			</a>
			<div class="flex gap-2 items-center font-mono text-xs">
				<button id="theme-toggle-btn" class="arcade-btn px-3 py-2 rounded bg-amber-300 dark:bg-blue-900" title="Toggle Light / Dark Mode"><i class="fa-solid fa-moon"></i> TEMA</button>
				<a href="/" class="arcade-btn px-3 py-2 rounded bg-surface">HOME</a>
				<form method="POST" action="/logout"><button class="arcade-btn bg-red-600 text-white px-3 py-2 rounded" title="Logout"><i class="fa-solid fa-right-from-bracket"></i></button></form>
			</div>
		</div>
	</header>
	<main id="main-content" class="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
		<section class="arcade-card p-4 rounded-xl flex flex-wrap justify-between gap-4 items-center">
			<div class="flex items-center gap-4">
				<div class="text-3xl text-cyan-500"><i class="fa-solid fa-user-ninja"></i></div>
				<div><p class="font-bold text-sm">{data.user.name} <span class="text-xs text-amber-500">LV.{data.stats.level} · {data.stats.rank_title}</span></p>
					<p class="text-xs font-mono text-muted">Active Scribe Matrix • {data.categories.length} Grimoire Categories Registered</p></div>
			</div>
			<a href="/studio" class="arcade-btn px-3 py-2 rounded text-xs font-mono bg-surface"><i class="fa-solid fa-terminal mr-2"></i>KEMBALI KE STUDIO</a>
		</section>
		{#if form?.error}<p role="alert" class="arcade-card border-rose-500 text-rose-600 dark:text-rose-300 p-4 rounded">{form.error}</p>{/if}
		<div class="grid lg:grid-cols-[360px_1fr] gap-6 items-start">
			<section class="arcade-card rounded-xl overflow-hidden">
				<h1 class="font-pixel text-xs bg-purple-100 dark:bg-purple-950 p-4 border-b-2 border-black dark:border-blue-800"><i class="fa-solid fa-flask mr-2"></i>FORGE NEW CATEGORY</h1>
				<form method="POST" use:enhance={() => { busy = true; return async ({ update }) => { await update(); busy = false; }; }} class="p-4 space-y-4 text-xs font-mono">
					<input type="hidden" name="mode" value="create" />
					<label class="block space-y-2"><span>Category Name *</span><input name="name" required maxlength="255" placeholder="e.g. Alchemy, Boss Tactics" class="field" /></label>
					<label class="block space-y-2"><span>Slug / Identifier (Optional)</span><input name="slug" placeholder="Auto-generated if empty" class="field" /></label>
					<fieldset><legend class="mb-2">Color Palette</legend><div class="flex flex-wrap gap-2">
						{#each colors as value}<label class="arcade-btn p-2 rounded cursor-pointer text-xs" class:ring-2={color === value}><input type="radio" name="color" value={value} bind:group={color} class="sr-only" /><i class="fa-solid fa-circle mr-1" style:color={value === 'emerald' ? '#10b981' : value === 'amber' ? '#f59e0b' : value === 'rose' ? '#f43f5e' : value}></i>{value}</label>{/each}
					</div></fieldset>
					<label class="block space-y-2"><span>Icon (Font Awesome)</span><input name="icon" bind:value={icon} class="field" /></label>
					<div class="grid grid-cols-6 gap-2">{#each icons as value}<button type="button" title={value} onclick={() => icon = `fa-solid fa-${value}`} class="arcade-btn bg-surface p-2 rounded"><i class={`fa-solid fa-${value}`}></i></button>{/each}</div>
					<label class="block space-y-2"><span>Description (Optional)</span><textarea name="description" rows="3" class="field"></textarea></label>
					<button disabled={busy} aria-label="FORGE CATEGORY" class="arcade-btn w-full bg-emerald-600 text-white py-3 rounded font-bold"><i aria-hidden="true" class="fa-solid fa-plus mr-2"></i>{busy ? 'MENYIMPAN...' : 'FORGE CATEGORY'}</button>
				</form>
			</section>
			<section class="arcade-card p-4 rounded-xl space-y-4">
				<div class="flex flex-wrap justify-between gap-3"><h2 class="font-pixel text-xs leading-6">GRIMOIRE CATEGORIES</h2><span class="font-mono text-xs">{data.categories.length} Total</span></div>
				<label class="block"><span class="sr-only">Cari kategori</span><input bind:value={query} placeholder="Search category..." class="field" /></label>
				<form method="POST" use:enhance={mutate} class="space-y-4">
					<input type="hidden" name="mode" value="bulk" />
					<div class="flex flex-wrap gap-2 items-center font-mono text-xs">
						<button type="button" class="arcade-btn bg-surface px-3 py-2 rounded" onclick={() => selected = selected.length ? [] : categories.map((category) => category.id)}>Pilih / batalkan semua</button>
						<button type="button" onclick={() => bulkDeleting = true} disabled={!selected.length} class="arcade-btn bg-red-600 text-white px-3 py-2 rounded">Hapus terpilih ({selected.length})</button>
					</div>
					<div class="grid sm:grid-cols-2 gap-3">
						{#each categories as category (category.id)}
							<article class="category-card p-3 rounded-xl border-2 border-blue-400 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/50 shadow-[2px_2px_0px_#000] font-mono space-y-3">
								<div class="flex items-center gap-3">
									<input type="checkbox" name="ids" value={category.id} bind:group={selected} aria-label={`Pilih kategori ${category.name}`} />
									<i class={category.icon}></i><div class="min-w-0"><h3 class="font-bold text-xs truncate">{category.name}</h3><code class="text-[10px]">[{category.slug}]</code></div>
								</div>
								<p class="text-xs">{category.description || 'Belum ada deskripsi.'}</p>
								<div class="flex justify-between items-center text-xs"><span>{category.notes_count || 0} scrolls</span><div class="flex gap-2">
									<button type="button" onclick={() => editing = { ...category }} class="arcade-btn bg-blue-600 text-white p-2 rounded" aria-label={`Edit ${category.name}`}><i class="fa-solid fa-pen"></i></button>
									<button type="button" onclick={() => deleting = category} class="arcade-btn bg-red-600 text-white p-2 rounded" aria-label={`Hapus ${category.name}`}><i class="fa-solid fa-trash"></i></button>
								</div></div>
							</article>
						{:else}<p class="text-sm text-muted py-8">Tidak ada kategori yang cocok.</p>{/each}
					</div>
				</form>
			</section>
		</div>
	</main>
</div>
{#if editing}
	<div class="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4">
		<div use:focusDialog role="dialog" aria-modal="true" aria-labelledby="edit-title" tabindex="-1" class="arcade-card w-full max-w-lg rounded-xl p-5 space-y-4">
			<h2 id="edit-title" class="font-pixel text-xs">EDIT CATEGORY</h2>
			<form method="POST" use:enhance={mutate} class="space-y-3 text-xs font-mono">
				<input type="hidden" name="mode" value="update" /><input type="hidden" name="id" value={editing.id} />
				<label class="block">Nama<input name="name" required bind:value={editing.name} class="field mt-1" /></label>
				<label class="block">Slug<input name="slug" required bind:value={editing.slug} class="field mt-1" /></label>
				<label class="block">Warna<select name="color" bind:value={editing.color} class="field mt-1">{#each colors as value}<option>{value}</option>{/each}</select></label>
				<label class="block">Icon<input name="icon" required bind:value={editing.icon} class="field mt-1" /></label>
				<label class="block">Deskripsi<textarea name="description" bind:value={editing.description} class="field mt-1"></textarea></label>
				<div class="flex justify-end gap-3"><button type="button" onclick={() => editing = null} class="arcade-btn bg-surface px-3 py-2 rounded">Batal</button><button class="arcade-btn bg-blue-600 text-white px-3 py-2 rounded">Simpan</button></div>
			</form>
		</div>
	</div>
{/if}
{#if deleting}
	<div class="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4">
		<div use:focusDialog role="dialog" aria-modal="true" aria-labelledby="delete-title" tabindex="-1" class="arcade-card w-full max-w-md rounded-xl p-5 space-y-4">
			<h2 id="delete-title" class="font-pixel text-xs">HAPUS CATEGORY?</h2>
			<p class="text-sm">Hapus kategori “{deleting.name}” beserta {deleting.notes_count || 0} catatannya secara permanen? Tindakan ini tidak dapat dibatalkan.</p>
			<form method="POST" use:enhance={mutate} class="flex justify-end gap-3 font-mono text-xs">
				<input type="hidden" name="mode" value="delete" /><input type="hidden" name="id" value={deleting.id} />
				<button type="button" onclick={() => deleting = null} class="arcade-btn bg-surface px-3 py-2 rounded">Batal</button>
				<button class="arcade-btn bg-red-600 text-white px-3 py-2 rounded">Hapus</button>
			</form>
		</div>
	</div>
{/if}
{#if bulkDeleting}
	<div class="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4">
		<div use:focusDialog role="dialog" aria-modal="true" aria-labelledby="bulk-title" tabindex="-1" class="arcade-card w-full max-w-md rounded-xl p-5 space-y-4">
			<h2 id="bulk-title" class="font-pixel text-xs">HAPUS KATEGORI TERPILIH?</h2>
			<p class="text-sm">{selected.length} kategori beserta catatannya akan dihapus sesuai aturan server. Tindakan ini tidak dapat dibatalkan.</p>
			<form method="POST" use:enhance={mutate} class="flex justify-end gap-3 font-mono text-xs">
				<input type="hidden" name="mode" value="bulk" />
				{#each selected as id}<input type="hidden" name="ids" value={id} />{/each}
				<button type="button" onclick={() => bulkDeleting = false} class="arcade-btn bg-surface px-3 py-2 rounded">Batal</button>
				<button class="arcade-btn bg-red-600 text-white px-3 py-2 rounded">Hapus</button>
			</form>
		</div>
	</div>
{/if}
<style>
	.field { width: 100%; background: var(--bg-surface-alt); border: 2px solid var(--border-color); border-radius: 4px; padding: 0.6rem; font: inherit; }
	.field:focus { outline: 2px solid #22d3ee; outline-offset: 2px; }
	button:disabled { opacity: .5; cursor: not-allowed; }
</style>
