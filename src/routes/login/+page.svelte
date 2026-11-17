<script>

	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	let { data, form = null } = $props();

	onMount(() => {
		import('#lib/runtime/chrome.js').then(m => m.start());
		import('#lib/runtime/login.js').then(m => m.start());
	});
</script>
<svelte:head><title>Masuk ke Studio - Notenux</title><meta name="description" content="Notenux: studio menulis retro modern, Markdown, gamifikasi RPG dan penyimpanan otomatis." /></svelte:head>
<div class="retro-crt-screen bg-[var(--bg-main)] text-[var(--text-main)] min-h-screen font-sans flex flex-col justify-between antialiased selection:bg-blue-600 selection:text-white transition-colors duration-200" data-sveltekit-reload>

    <header class="w-full bg-[var(--bg-surface)] border-b-2 border-black dark:border-blue-900 shadow-[0_4px_0_rgba(0,0,0,0.25)] px-3 sm:px-6 py-2.5 sm:py-3 z-30">
        <div class="max-w-6xl mx-auto flex items-center justify-between gap-2">
            <a href="{"/"}" class="flex items-center gap-1.5 sm:gap-2 group transition-transform active:translate-y-0.5 shrink-0 min-w-0">

                <img src="{"/assets/logo/dark/icon_horizontal_dark.webp"}"
                     alt="Notenux Studio"
                     class="h-7 sm:h-8 w-auto object-contain hidden dark:block transition-transform group-hover:scale-105"
                     decoding="async">
                <img src="{"/assets/logo/light/icon_horizontal_light.webp"}"
                     alt="Notenux Studio"
                     class="h-7 sm:h-8 w-auto object-contain block dark:hidden transition-transform group-hover:scale-105"
                     decoding="async">
                <span class="sr-only">NOTENUX</span>
                <span class="text-[9px] font-mono bg-blue-900/20 text-blue-600 dark:text-cyan-300 px-1.5 py-0.5 rounded border border-blue-500/40 font-bold uppercase hidden xs:inline-block">AUTH</span>
            </a>

            <div class="flex items-center gap-2 sm:gap-2.5 shrink-0">

                <button id="theme-toggle-btn"
                        class="arcade-btn bg-amber-300 hover:bg-amber-400 dark:bg-blue-900 dark:hover:bg-blue-800 text-black dark:text-cyan-300 px-2 sm:px-2.5 py-1.5 rounded text-xs font-mono"
                        title="Toggle Light / Dark Mode">
                    <i aria-hidden="true" class="fa-solid fa-moon text-cyan-300 sm:mr-1.5"></i> <span class="hidden sm:inline">THEME</span>
                </button>

                <a href="{"/"}" class="arcade-btn bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-mono px-2.5 sm:px-3 py-1.5 rounded">
                    <i aria-hidden="true" class="fa-solid fa-house sm:mr-1"></i> <span class="hidden sm:inline">Beranda</span>
                </a>
            </div>
        </div>
    </header>

    <main class="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div class="w-full max-w-md">

            <div class="mb-4 arcade-card p-3 rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/60 shadow-[3px_3px_0px_#000] text-xs font-mono">
                <div class="flex items-start gap-2.5">
                    <i aria-hidden="true" class="fa-solid fa-shield-halved text-base text-blue-600 dark:text-cyan-400 mt-0.5 shrink-0"></i>
                    <div>
                        <span class="font-bold text-blue-900 dark:text-cyan-300">Autentikasi Studio Diperlukan</span>
                        <p class="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                            Akses ke <strong>/studio</strong> memerlukan akun Scribe aktif. Belum memiliki akun?
                            <a href="{"/register"}" class="text-blue-600 dark:text-cyan-400 underline font-bold hover:text-blue-700">Daftar terlebih dahulu di sini</a>.
                        </p>
                    </div>
                </div>
            </div>

            <div class="arcade-card p-6 sm:p-8 rounded-xl border-2 border-black dark:border-blue-700 bg-[var(--bg-surface)] shadow-[6px_6px_0px_#000] space-y-6">

                <div class="text-center space-y-2">
                    <div class="flex justify-center mb-1">
                        <img src="{"/assets/logo/dark/icon_vertical_dark.webp"}"
                             alt="Notenux Scribe"
                             class="w-16 sm:w-20 h-auto object-contain hidden dark:block mx-auto drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
                             fetchpriority="high"
                             decoding="async">
                        <img src="{"/assets/logo/light/icon_vertical_light.webp"}"
                             alt="Notenux Scribe"
                             class="w-16 sm:w-20 h-auto object-contain block dark:hidden mx-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
                             fetchpriority="high"
                             decoding="async">
                    </div>
                    <h1 class="font-pixel text-sm sm:text-base text-blue-950 dark:text-cyan-300 tracking-wider">MASUK SCRIBE</h1>
                    <p class="text-xs font-mono text-slate-600 dark:text-slate-400">Masukkan kredensial untuk membuka Studio Notenux</p>
                </div>

                {#if form?.errors?.length}
                    <div class="p-3 rounded-lg border-2 border-red-500 bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300 text-xs font-mono space-y-1">
                        <div class="flex items-center gap-1.5 font-bold">
                            <i aria-hidden="true" class="fa-solid fa-triangle-exclamation"></i>
                            <span>Gagal Masuk:</span>
                        </div>
                        <ul class="list-disc list-inside space-y-0.5 pl-1">
                            {#each form.errors as message}
                                <li>{message}</li>
                            {/each}
                        </ul>
                    </div>
                {/if}

                <form method="POST" use:enhance class="space-y-4 font-mono text-xs">

                    <div class="space-y-1.5">
                        <label for="email" class="block font-bold text-slate-800 dark:text-slate-200">
                            <i aria-hidden="true" class="fa-solid fa-envelope text-blue-500 mr-1"></i> EMAIL SCRIBE
                        </label>
                        <input id="email"
                               type="email"
                               name="email"
                               value="{form?.values?.email ?? ''}"
                               required
                               autocomplete="username"
                               placeholder="scribe@notenux.dev"
                               class="w-full px-3.5 py-2.5 rounded-lg border-2 border-black/40 dark:border-blue-500/50 bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-xs font-mono transition-colors">
                    </div>

                    <div class="space-y-1.5">
                        <label for="password" class="block font-bold text-slate-800 dark:text-slate-200">
                            <i aria-hidden="true" class="fa-solid fa-lock text-blue-500 mr-1"></i> KATA SANDI
                        </label>
                        <div class="relative">
                            <input id="password"
                                   type="password"
                                   name="password"
                                   required
                                   autocomplete="current-password"
                                   placeholder="••••••••"
                                   class="w-full pl-3.5 pr-10 py-2.5 rounded-lg border-2 border-black/40 dark:border-blue-500/50 bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-xs font-mono transition-colors">
                            <button type="button"
                                    id="toggle-password-btn"
                                    class="toggle-password-btn absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 p-1.5 rounded transition-colors focus:outline-none cursor-pointer flex items-center justify-center"
                                    data-target="password"
                                    data-state="closed"
                                    aria-label="Tampilkan kata sandi"
                                    title="Tampilkan kata sandi (Show password)">
                                <i aria-hidden="true" class="fa-solid fa-eye text-xs toggle-password-icon"></i>
                            </button>
                        </div>
                    </div>

                    <div class="flex items-center justify-between pt-1">
                        <label class="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox"
                                   name="remember"
                                   class="rounded border-2 border-black dark:border-blue-400 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer">
                            <span class="text-slate-600 dark:text-slate-400 font-bold">Ingat sesi ini</span>
                        </label>
                    </div>

                    <button type="submit"
                            id="login-submit-btn"
                            class="arcade-btn w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-pixel text-xs tracking-wider shadow-[3px_3px_0px_#000] active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] flex items-center justify-center gap-2 transition-all">
                        <i aria-hidden="true" class="fa-solid fa-right-to-bracket text-sm"></i>
                        <span>MASUK KE STUDIO</span>
                    </button>
                </form>

                <div class="pt-4 border-t-2 border-dashed border-black/10 dark:border-white/10 text-center space-y-3 font-mono text-xs">
                    <p class="text-slate-600 dark:text-slate-400">
                        Belum memiliki akun Scribe?
                    </p>
                    <a href="{"/register"}"
                       id="to-register-btn"
                       class="arcade-btn inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs tracking-wider shadow-[3px_3px_0px_#000] transition-colors">
                        <i aria-hidden="true" class="fa-solid fa-user-plus"></i>
                        <span>REGISTER AKUN BARU</span>
                    </a>
                </div>

            </div>

            <p class="mt-6 text-center text-[10px] font-mono text-slate-500 dark:text-slate-400">
                Notenux Studio &copy; {new Date().getFullYear()} &bull; Scribe Memory Matrix
            </p>
        </div>
    </main>

</div>
