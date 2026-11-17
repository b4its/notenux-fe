<script lang="ts">
	import '#lib/styles/app.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link id="app-favicon" rel="icon" href="/assets/logo/light/icon_light.webp" />
	<link rel="stylesheet" href="/vendor/fonts.css" />
	<link rel="stylesheet" href="/vendor/icons.css" />
	<meta name="theme-color" content="#050b18" />
</svelte:head>

{@render children()}
