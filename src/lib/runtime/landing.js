
        export function start() {

            // Audio Helper (integrates with window.notenux.audio or fallback)
            const playSound = (type = 'blip') => {
                if (window.notenux && window.notenux.audio) {
                    if (type === 'coin') window.notenux.audio.playCoin();
                    else if (type === 'levelup') window.notenux.audio.playLevelUp();
                    else if (type === 'warp') window.notenux.audio.playWarp();
                    else if (type === 'delete') window.notenux.audio.playDelete();
                    else window.notenux.audio.playBlip();
                }
            };

            // --------------------------------------------------------------------------
            // 1. FAQ Accordions & Live Search Filter
            // --------------------------------------------------------------------------
            document.querySelectorAll('.faq-trigger').forEach(trigger => {
                trigger.addEventListener('click', () => {
                    playSound('blip');
                    const item = trigger.closest('.faq-item');
                    const content = item.querySelector('.faq-content');
                    const chevron = trigger.querySelector('.faq-chevron');
                    const isHidden = content.classList.contains('hidden');

                    document.querySelectorAll('.faq-content').forEach(c => c.classList.add('hidden'));
                    document.querySelectorAll('.faq-chevron').forEach(ch => ch.classList.remove('rotate-180'));

                    if (isHidden) {
                        content.classList.remove('hidden');
                        chevron.classList.add('rotate-180');
                    }
                });
            });

            const faqSearchInput = document.getElementById('faq-search-input');
            const faqItems = document.querySelectorAll('.faq-item');
            const faqEmptyState = document.getElementById('faq-empty-state');

            if (faqSearchInput) {
                faqSearchInput.addEventListener('input', () => {
                    const query = faqSearchInput.value.toLowerCase().trim();
                    let matchCount = 0;

                    faqItems.forEach(item => {
                        const text = item.textContent.toLowerCase();
                        const keywords = (item.getAttribute('data-keywords') || '').toLowerCase();
                        const matches = text.includes(query) || keywords.includes(query);

                        if (matches) {
                            item.classList.remove('hidden');
                            matchCount++;
                        } else {
                            item.classList.add('hidden');
                        }
                    });

                    if (faqEmptyState) {
                        if (matchCount === 0) faqEmptyState.classList.remove('hidden');
                        else faqEmptyState.classList.add('hidden');
                    }
                });
            }

            // --------------------------------------------------------------------------
            // 2. Hero Interactive Station (Tabs, Quests, Safety Check, Font Lab)
            // --------------------------------------------------------------------------
            const stationTabs = document.querySelectorAll('.station-tab-btn');
            const stationPanels = document.querySelectorAll('.station-panel');

            stationTabs.forEach(btn => {
                btn.addEventListener('click', () => {
                    playSound('blip');
                    const tab = btn.getAttribute('data-tab');

                    stationTabs.forEach(b => {
                        b.classList.remove('bg-blue-600', 'text-white');
                        b.classList.add('bg-[var(--bg-surface)]', 'text-[var(--text-main)]');
                    });
                    btn.classList.add('bg-blue-600', 'text-white');
                    btn.classList.remove('bg-[var(--bg-surface)]', 'text-[var(--text-main)]');

                    stationPanels.forEach(panel => panel.classList.add('hidden'));
                    const targetPanel = document.getElementById(`station-panel-${tab}`);
                    if (targetPanel) targetPanel.classList.remove('hidden');
                });
            });

            // Hero Quests System
            let heroQuestXp = 25;
            const heroQuestXpBar = document.getElementById('hero-quest-xp-bar');
            const heroQuestXpText = document.getElementById('hero-quest-xp-text');
            const heroQuestRank = document.getElementById('hero-quest-rank');
            const heroLevelupBanner = document.getElementById('hero-levelup-banner');
            const heroResetQuestsBtn = document.getElementById('hero-reset-quests-btn');

            document.querySelectorAll('.quest-item').forEach(item => {
                item.addEventListener('click', () => {
                    const isDone = item.getAttribute('data-completed') === 'true';
                    if (isDone) return;

                    const xpAward = parseInt(item.getAttribute('data-xp') || '25', 10);
                    item.setAttribute('data-completed', 'true');

                    const icon = item.querySelector('.quest-check-icon');
                    const title = item.querySelector('.quest-title');
                    const badge = item.querySelector('.quest-badge');

                    if (icon) {
                        icon.className = 'fa-solid fa-circle-check text-emerald-500 text-sm quest-check-icon shrink-0';
                    }
                    if (title) {
                        title.classList.add('line-through', 'text-slate-500', 'dark:text-slate-400');
                    }
                    if (badge) {
                        badge.className = 'text-[10px] font-pixel text-emerald-500 font-bold quest-badge shrink-0';
                        badge.textContent = `+${xpAward} XP [DONE]`;
                    }

                    heroQuestXp = Math.min(100, heroQuestXp + xpAward);
                    if (heroQuestXpBar) heroQuestXpBar.style.width = `${heroQuestXp}%`;
                    if (heroQuestXpText) heroQuestXpText.textContent = `${heroQuestXp} / 100 XP`;

                    if (heroQuestXp >= 100) {
                        playSound('levelup');
                        if (heroQuestRank) heroQuestRank.textContent = 'LV. 2 APPRENTICE SCRIBE';
                        if (heroLevelupBanner) heroLevelupBanner.classList.remove('hidden');
                    } else {
                        playSound('coin');
                    }
                });
            });

            if (heroResetQuestsBtn) {
                heroResetQuestsBtn.addEventListener('click', () => {
                    playSound('warp');
                    heroQuestXp = 25;
                    if (heroQuestXpBar) heroQuestXpBar.style.width = '25%';
                    if (heroQuestXpText) heroQuestXpText.textContent = '25 / 100 XP';
                    if (heroQuestRank) heroQuestRank.textContent = 'LV. 1 NOVICE SCRIBE';
                    if (heroLevelupBanner) heroLevelupBanner.classList.add('hidden');

                    const q2 = document.getElementById('quest-item-2');
                    if (q2) {
                        q2.setAttribute('data-completed', 'false');
                        q2.querySelector('.quest-check-icon').className = 'fa-regular fa-circle text-slate-400 text-sm quest-check-icon shrink-0';
                        q2.querySelector('.quest-title').classList.remove('line-through', 'text-slate-500', 'dark:text-slate-400');
                        const b = q2.querySelector('.quest-badge');
                        b.className = 'text-[10px] font-pixel text-amber-500 font-bold quest-badge shrink-0';
                        b.textContent = '+25 XP';
                    }

                    const q3 = document.getElementById('quest-item-3');
                    if (q3) {
                        q3.setAttribute('data-completed', 'false');
                        q3.querySelector('.quest-check-icon').className = 'fa-regular fa-circle text-slate-400 text-sm quest-check-icon shrink-0';
                        q3.querySelector('.quest-title').classList.remove('line-through', 'text-slate-500', 'dark:text-slate-400');
                        const b = q3.querySelector('.quest-badge');
                        b.className = 'text-[10px] font-pixel text-cyan-400 font-bold quest-badge shrink-0';
                        b.textContent = '+50 XP';
                    }
                });
            }

            // Live Safety & Protection Hasher
            const hasherInput = document.getElementById('hasher-input');
            const hasherOutput = document.getElementById('hasher-hash-output');
            const hasherCharCount = document.getElementById('hasher-char-count');
            const hasherByteCount = document.getElementById('hasher-byte-count');
            const copyHashBtn = document.getElementById('copy-hash-btn');

            async function computeSha256(str) {
                const buffer = new TextEncoder().encode(str);
                const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            }

            if (hasherInput && hasherOutput) {
                const updateHasher = async () => {
                    const text = hasherInput.value;
                    if (hasherCharCount) hasherCharCount.textContent = text.length;
                    if (hasherByteCount) hasherByteCount.textContent = `${new TextEncoder().encode(text).length} B`;
                    try {
                        const hash = await computeSha256(text);
                        hasherOutput.textContent = hash;
                    } catch (e) {
                        hasherOutput.textContent = 'protected_hash_verified';
                    }
                };

                hasherInput.addEventListener('input', updateHasher);
            }

            if (copyHashBtn && hasherOutput) {
                copyHashBtn.addEventListener('click', () => {
                    playSound('coin');
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(hasherOutput.textContent.trim());
                        copyHashBtn.innerHTML = '<i class="fa-solid fa-check mr-1"></i> Tersalin!';
                        setTimeout(() => {
                            copyHashBtn.innerHTML = '<i class="fa-solid fa-copy mr-1"></i> Salin Kunci';
                        }, 1800);
                    }
                });
            }

            // Hero Font Lab
            const heroFontPreviewBox = document.getElementById('hero-font-preview-box');
            document.querySelectorAll('.hero-font-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    playSound('warp');
                    const font = btn.getAttribute('data-font');
                    document.querySelectorAll('.hero-font-btn').forEach(b => {
                        b.classList.remove('bg-blue-600', 'text-white');
                        b.classList.add('bg-[var(--bg-surface)]', 'text-[var(--text-main)]');
                    });
                    btn.classList.add('bg-blue-600', 'text-white');
                    btn.classList.remove('bg-[var(--bg-surface)]', 'text-[var(--text-main)]');

                    if (heroFontPreviewBox) {
                        heroFontPreviewBox.classList.remove('font-pixel', 'font-arcade', 'font-mono', 'font-sans', 'font-serif');
                        if (font === 'pixel') heroFontPreviewBox.classList.add('font-pixel');
                        else if (font === 'arcade') heroFontPreviewBox.classList.add('font-arcade');
                        else if (font === 'mono') heroFontPreviewBox.classList.add('font-mono');
                        else if (font === 'serif') heroFontPreviewBox.classList.add('font-serif');
                        else heroFontPreviewBox.classList.add('font-sans');
                    }
                });
            });

            // --------------------------------------------------------------------------
            // 3. Interactive Demo Playground (Spell Bar, Metrics, Actions, Preview)
            // --------------------------------------------------------------------------
            const demoEditor = document.getElementById('demo-editor-input');
            const demoWordCount = document.getElementById('demo-word-count');
            const demoCharCount = document.getElementById('demo-char-count');
            const demoLineCount = document.getElementById('demo-line-count');
            const demoReadTime = document.getElementById('demo-read-time');
            const demoXpBar = document.getElementById('demo-xp-bar');
            const demoXpText = document.getElementById('demo-xp-text');
            const demoLevelDisplay = document.getElementById('demo-level-display');
            const demoPreviewContainer = document.getElementById('demo-preview-container');
            const demoEditorContainer = document.getElementById('demo-editor-container');
            const togglePreviewBtn = document.getElementById('toggle-preview-btn');
            const demoCopyBtn = document.getElementById('demo-copy-btn');
            const demoDownloadBtn = document.getElementById('demo-download-btn');

            let simulatedXp = 25;
            let simulatedLevel = 1;

            const updateDemoMetrics = () => {
                if (!demoEditor) return;
                const text = demoEditor.value || '';
                const words = text.trim() ? text.trim().split(/\s+/).length : 0;
                const chars = text.length;
                const lines = text ? text.split('\n').length : 0;
                const readMins = Math.max(1, Math.ceil(words / 200));

                if (demoWordCount) demoWordCount.textContent = words;
                if (demoCharCount) demoCharCount.textContent = chars;
                if (demoLineCount) demoLineCount.textContent = lines;
                if (demoReadTime) demoReadTime.textContent = `~${readMins} mnt baca`;
            };

            if (demoEditor) {
                demoEditor.addEventListener('input', () => {
                    updateDemoMetrics();

                    // XP Level Simulation on typing
                    simulatedXp += 2;
                    if (simulatedXp >= 100) {
                        simulatedLevel += 1;
                        simulatedXp = 10;
                        playSound('levelup');
                    }

                    if (demoXpBar) demoXpBar.style.width = Math.min(simulatedXp, 100) + '%';
                    if (demoXpText) demoXpText.textContent = `${simulatedXp} / 100 XP`;
                    if (demoLevelDisplay) demoLevelDisplay.textContent = `LV. ${simulatedLevel} ${simulatedLevel > 1 ? 'SCRIBE ADEPT' : 'NOVICE'}`;
                });
            }

            // Spell Bar Formatting
            document.querySelectorAll('.spell-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (!demoEditor) return;
                    playSound('blip');
                    const action = btn.getAttribute('data-action');
                    const start = demoEditor.selectionStart;
                    const end = demoEditor.selectionEnd;
                    const val = demoEditor.value;
                    const selected = val.substring(start, end);

                    let replacement = '';
                    if (action === 'bold') replacement = `**${selected || 'teks tebal'}**`;
                    else if (action === 'italic') replacement = `*${selected || 'teks miring'}*`;
                    else if (action === 'heading') replacement = `\n## ${selected || 'Judul Bagian Baru'}\n`;
                    else if (action === 'task') replacement = `\n- [ ] ${selected || 'Tugas baru'}\n`;
                    else if (action === 'code') replacement = `\n\`\`\`javascript\n${selected || '// Catatan kode'}\n\`\`\`\n`;
                    else if (action === 'quote') replacement = `\n> ${selected || 'Kutipan berharga'}\n`;

                    demoEditor.value = val.substring(0, start) + replacement + val.substring(end);
                    demoEditor.focus();
                    demoEditor.dispatchEvent(new Event('input'));
                });
            });

            // Copy & Download Actions
            if (demoCopyBtn && demoEditor) {
                demoCopyBtn.addEventListener('click', () => {
                    playSound('coin');
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(demoEditor.value);
                        demoCopyBtn.innerHTML = '<i class="fa-solid fa-check mr-1 text-emerald-400"></i> Tersalin!';
                        setTimeout(() => {
                            demoCopyBtn.innerHTML = '<i class="fa-solid fa-copy mr-1 text-cyan-500"></i> Salin';
                        }, 1800);
                    }
                });
            }

            if (demoDownloadBtn && demoEditor) {
                demoDownloadBtn.addEventListener('click', () => {
                    playSound('coin');
                    const blob = new Blob([demoEditor.value], { type: 'text/markdown;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'notenux-manuscript.md';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                });
            }

            // Font Selector in Demo
            document.querySelectorAll('.demo-font-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    playSound('warp');
                    const font = btn.getAttribute('data-font');
                    document.querySelectorAll('.demo-font-btn').forEach(b => {
                        b.classList.remove('bg-blue-600', 'text-white');
                        b.classList.add('bg-[var(--bg-surface)]', 'text-[var(--text-main)]');
                    });
                    btn.classList.add('bg-blue-600', 'text-white');
                    btn.classList.remove('bg-[var(--bg-surface)]', 'text-[var(--text-main)]');

                    if (demoEditor) {
                        demoEditor.classList.remove('font-pixel', 'font-arcade', 'font-mono', 'font-sans', 'font-serif');
                        if (font === 'pixel') demoEditor.classList.add('font-pixel');
                        else if (font === 'arcade') demoEditor.classList.add('font-arcade');
                        else if (font === 'mono') demoEditor.classList.add('font-mono');
                        else if (font === 'serif') demoEditor.classList.add('font-serif');
                        else demoEditor.classList.add('font-sans');
                    }
                });
            });

            // Templates
            const templateQuestBtn = document.getElementById('template-quest-btn');
            const templateCodeBtn = document.getElementById('template-code-btn');
            const templateTableBtn = document.getElementById('template-table-btn');

            if (templateQuestBtn && demoEditor) {
                templateQuestBtn.addEventListener('click', () => {
                    playSound('coin');
                    demoEditor.value = `# ⚔️ Rencana Harian: Petualangan Menulis

- [x] Tulis draf naskah utama
- [x] Susun prioritas tugas mingguan
- [ ] Buka mode Zen layar penuh
- [ ] Simpan dan backup naskah ke Markdown!`;
                    demoEditor.dispatchEvent(new Event('input'));
                });
            }

            if (templateCodeBtn && demoEditor) {
                templateCodeBtn.addEventListener('click', () => {
                    playSound('coin');
                    demoEditor.value = `# 💻 Catatan Kode: Snippet Cepat

\`\`\`javascript
// Simpan dan olah data dengan cepat
const saveNote = (note) => {
    return { status: 'success', savedAt: new Date() };
};
\`\`\`

Catatan kode rapi dan siap diekspor kapan saja!`;
                    demoEditor.dispatchEvent(new Event('input'));
                });
            }

            if (templateTableBtn && demoEditor) {
                templateTableBtn.addEventListener('click', () => {
                    playSound('coin');
                    demoEditor.value = `# 📊 Matriks Produktivitas Mingguan

| Hari | Target Tulisan | Status |
| :--- | :--- | :--- |
| Senin | 500 kata & Outline | Selesai |
| Selasa | Bab 1 Naskah | Selesai |
| Rabu | Review & Pratinjau | Terjadwal |`;
                    demoEditor.dispatchEvent(new Event('input'));
                });
            }

            // Toggle Preview
            if (togglePreviewBtn && demoPreviewContainer && demoEditorContainer && demoEditor) {
                togglePreviewBtn.addEventListener('click', () => {
                    playSound('blip');
                    const isPreview = !demoPreviewContainer.classList.contains('hidden');
                    if (isPreview) {
                        demoPreviewContainer.classList.add('hidden');
                        demoEditorContainer.classList.remove('hidden');
                        togglePreviewBtn.innerHTML = '👁️ Preview';
                    } else {
                        // Render basic markdown into preview
                        const raw = demoEditor.value;
                        const rendered = raw
                            .replace(/^# (.*$)/gim, '<h2 class="text-xl font-bold text-blue-500 mb-2 font-pixel">$1</h2>')
                            .replace(/^## (.*$)/gim, '<h3 class="text-lg font-bold text-cyan-400 mb-1.5 font-pixel">$1</h3>')
                            .replace(/^- \[x\] (.*$)/gim, '<div class="text-emerald-500 font-mono py-0.5">✅ $1</div>')
                            .replace(/^- \[ \] (.*$)/gim, '<div class="text-slate-400 font-mono py-0.5">⬜ $1</div>')
                            .replace(/```([\s\S]*?)```/gm, '<pre class="bg-black/30 p-2.5 rounded font-mono text-xs my-2 border border-blue-500/30 overflow-x-auto">$1</pre>')
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            .replace(/\n/gim, '<br>');
                        demoPreviewContainer.innerHTML = rendered;
                        demoPreviewContainer.classList.remove('hidden');
                        demoEditorContainer.classList.add('hidden');
                        togglePreviewBtn.innerHTML = '✏️ Edit';
                    }
                });
            }

            // --------------------------------------------------------------------------
            // 4. Interactive Protection & Recovery Simulator
            // --------------------------------------------------------------------------
            const simCorruptBtn = document.getElementById('sim-corrupt-btn');
            const simRepairBtn = document.getElementById('sim-repair-btn');
            const simStatusBanner = document.getElementById('sim-status-banner');
            const simStatusIcon = document.getElementById('sim-status-icon');
            const simStatusText = document.getElementById('sim-status-text');
            const simStatusChip = document.getElementById('sim-status-chip');
            const simShard2Box = document.getElementById('sim-shard-2-box');
            const simShard2Badge = document.getElementById('sim-shard-2-badge');
            const simShard2Content = document.getElementById('sim-shard-2-content');
            const simShard2Hash = document.getElementById('sim-shard-2-hash');

            if (simCorruptBtn && simRepairBtn) {
                simCorruptBtn.addEventListener('click', () => {
                    playSound('delete');

                    if (simStatusBanner) {
                        simStatusBanner.className = 'p-3 rounded-xl border-2 border-rose-500/80 bg-rose-500/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs animate-pulse';
                    }
                    if (simStatusIcon) {
                        simStatusIcon.className = 'fa-solid fa-triangle-exclamation text-rose-500 text-base';
                    }
                    if (simStatusText) {
                        simStatusText.className = 'font-bold text-rose-600 dark:text-rose-400';
                        simStatusText.textContent = 'PERINGATAN: Perubahan tak terduga terdeteksi pada Bagian #02! Sistem otomatis siap memulihkan.';
                    }
                    if (simStatusChip) {
                        simStatusChip.className = 'px-2 py-0.5 rounded font-pixel text-[9px] bg-rose-600 text-white shrink-0';
                        simStatusChip.textContent = 'TERDETEKSI';
                    }

                    if (simShard2Box) {
                        simShard2Box.classList.add('border-rose-500', 'bg-rose-500/10');
                    }
                    if (simShard2Badge) {
                        simShard2Badge.className = 'text-rose-500 font-pixel text-[9px] animate-pulse';
                        simShard2Badge.textContent = 'TERUBAH!';
                    }
                    if (simShard2Content) {
                        simShard2Content.textContent = '⚠️ [DATA TERGANGGU - TEKAN PULIHKAN]';
                        simShard2Content.classList.add('text-rose-500');
                    }
                    if (simShard2Hash) {
                        simShard2Hash.textContent = 'e02a9c1d0f84a0c8...';
                        simShard2Hash.className = 'text-rose-400 font-bold';
                    }
                });

                simRepairBtn.addEventListener('click', () => {
                    playSound('levelup');

                    if (simStatusBanner) {
                        simStatusBanner.className = 'p-3 rounded-xl border-2 border-emerald-500/60 bg-emerald-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs';
                    }
                    if (simStatusIcon) {
                        simStatusIcon.className = 'fa-solid fa-circle-check text-emerald-500 text-base';
                    }
                    if (simStatusText) {
                        simStatusText.className = 'font-bold text-emerald-600 dark:text-emerald-400';
                        simStatusText.textContent = 'STATUS: Seluruh bagian catatan utuh sempurna. Keamanan tulisan 100% terverifikasi.';
                    }
                    if (simStatusChip) {
                        simStatusChip.className = 'px-2 py-0.5 rounded font-pixel text-[9px] bg-emerald-600 text-white shrink-0';
                        simStatusChip.textContent = 'AMAN 100%';
                    }

                    if (simShard2Box) {
                        simShard2Box.classList.remove('border-rose-500', 'bg-rose-500/10');
                    }
                    if (simShard2Badge) {
                        simShard2Badge.className = 'text-emerald-500 font-pixel text-[9px]';
                        simShard2Badge.textContent = 'UTUH';
                    }
                    if (simShard2Content) {
                        simShard2Content.textContent = '- [x] Selesaikan draf naskah utama';
                        simShard2Content.classList.remove('text-rose-500');
                    }
                    if (simShard2Hash) {
                        simShard2Hash.textContent = '9b71d224bd62f378...';
                        simShard2Hash.className = 'text-cyan-500 font-bold';
                    }
                });
            }

            // --------------------------------------------------------------------------
            // 5. RPG Scribe Rank Codex Interactive Selector
            // --------------------------------------------------------------------------
            const rankData = {
                '1': {
                    name: 'RANK: NOVICE SCRIBE',
                    level: 'Tingkat Kemahiran: Level 1 – 9 (0 – 450 XP)',
                    badge: 'INITIAL RANK',
                    icon: '<i class="fa-solid fa-feather"></i>',
                    color: 'bg-blue-600',
                    desc: 'Langkah awal sang petualang aksara. Scribe pemula mempelajari seni mencatat naskah dengan Markdown dasar dan pengelompokan kategori yang terstruktur rapi.',
                    perks: ['Editor Markdown Dual-Mode', 'Proteksi Tulisan Otomatis', '5 Tipografi Font Retro']
                },
                '2': {
                    name: 'RANK: APPRENTICE SCRIBE',
                    level: 'Tingkat Kemahiran: Level 10 – 24 (450 – 1,200 XP)',
                    badge: 'UNLOCKED AT LV.10',
                    icon: '<i class="fa-solid fa-scroll text-emerald-400"></i>',
                    color: 'bg-emerald-600',
                    desc: 'Scribe telah menguasai dasar sintaks. Naskah catatan tersusun rapi dengan checklist interaktif dan alur penulisan cepat tanpa lag.',
                    perks: ['Manajemen Multi-Kategori', 'Ekspor HTML & Markdown 1-Klik', 'Shortcut Keyboard Cepat']
                },
                '3': {
                    name: 'RANK: SCHOLAR SCRIBE',
                    level: 'Tingkat Kemahiran: Level 25 – 39 (1,200 – 2,500 XP)',
                    badge: 'UNLOCKED AT LV.25',
                    icon: '<i class="fa-solid fa-book-skull text-cyan-400"></i>',
                    color: 'bg-cyan-600',
                    desc: 'Cendekiawan arsip digital. Membangun perpustakaan pengetahuan dengan struktur tabel markdown dan riwayat edit tak terbatas.',
                    perks: ['Dukungan Tabel Markdown', 'Pencarian Instan Sekejap', 'Notepad Plain Text Mode']
                },
                '4': {
                    name: 'RANK: ARCHMAGE SCRIBE',
                    level: 'Tingkat Kemahiran: Level 40 – 49 (2,500 – 4,000 XP)',
                    badge: 'UNLOCKED AT LV.40',
                    icon: '<i class="fa-solid fa-hat-wizard text-purple-400"></i>',
                    color: 'bg-purple-600',
                    desc: 'Penyihir aksara agung. Mampu mempertahankan fokus absolut dalam Zen Mode layar penuh dan manipulasi tata letak tingkat lanjut.',
                    perks: ['Distraction-Free Zen Mode', 'Audit Keamanan Naskah Manual', 'Pengurutan Naskah Fleksibel']
                },
                '5': {
                    name: 'RANK: MYTHIC CHRONO-SCRIBE',
                    level: 'Tingkat Kemahiran: Level 50+ (4,000+ XP)',
                    badge: 'MASTER TIER',
                    icon: '<i class="fa-solid fa-crown text-amber-400"></i>',
                    color: 'bg-amber-500',
                    desc: 'Gelar tertinggi di Notenux. Mengendalikan waktu dan catatan dengan cadangan JSON menyeluruh dan status keabadian data.',
                    perks: ['Cadangan JSON Menyeluruh', 'Insignia Mahkota Legendaris', 'Akses Prioritas Fitur AI Assistant']
                }
            };

            document.querySelectorAll('.rank-card').forEach(card => {
                card.addEventListener('click', () => {
                    playSound('warp');
                    const rankId = card.getAttribute('data-rank');
                    const data = rankData[rankId];
                    if (!data) return;

                    document.querySelectorAll('.rank-card').forEach(c => {
                        c.classList.remove('bg-blue-600', 'text-white');
                        c.classList.add('bg-[var(--bg-surface)]', 'text-[var(--text-main)]');
                    });
                    card.classList.add('bg-blue-600', 'text-white');
                    card.classList.remove('bg-[var(--bg-surface)]', 'text-[var(--text-main)]');

                    const nameEl = document.getElementById('rank-detail-name');
                    const levelEl = document.getElementById('rank-detail-level');
                    const badgeEl = document.getElementById('rank-detail-badge');
                    const iconEl = document.getElementById('rank-detail-icon');
                    const descEl = document.getElementById('rank-detail-desc');
                    const perksEl = document.getElementById('rank-detail-perks');

                    if (nameEl) nameEl.textContent = data.name;
                    if (levelEl) levelEl.textContent = data.level;
                    if (badgeEl) badgeEl.textContent = data.badge;
                    if (iconEl) {
                        iconEl.className = `w-10 h-10 rounded-xl ${data.color} text-white flex items-center justify-center text-xl shadow-[2px_2px_0px_#000]`;
                        iconEl.innerHTML = data.icon;
                    }
                    if (descEl) descEl.textContent = data.desc;
                    if (perksEl) {
                        perksEl.innerHTML = data.perks.map(p => `
                            <div class="p-2.5 rounded-lg border border-black/15 dark:border-blue-900 bg-[var(--bg-surface-alt)] flex items-center gap-2">
                                <i class="fa-solid fa-check text-emerald-500"></i>
                                <span>${p}</span>
                            </div>
                        `).join('');
                    }
                });
            });

            // --------------------------------------------------------------------------
            // 6. Floating Companion Sprite (Mascot Tips)
            // --------------------------------------------------------------------------
            const companionTips = [
                '💡 Tip: Di Studio, tekan Ctrl+S untuk menyimpan catatanmu seketika!',
                '⚔️ Selesaikan checklist di catatanmu untuk mendapatkan bonus XP!',
                '🛡️ Catatanmu selalu terlindungi secara otomatis tanpa takut hilang saat browser tertutup.',
                '🎨 Ganti tema Day / Night kapan saja — Favicon kami juga ikut berganti!',
                '📖 Mode Zen layar penuh menyembunyikan semua distraksi agar idemu mengalir.',
                '💾 Gunakan tombol Ekspor di Studio untuk backup catatan ke format Markdown (.md).'
            ];

            let companionIndex = 0;
            const companionBubble = document.getElementById('companion-bubble');
            const companionText = document.getElementById('companion-text');
            const companionAvatarBtn = document.getElementById('companion-avatar-btn');
            const companionCloseBtn = document.getElementById('companion-close-btn');

            if (companionAvatarBtn && companionText) {
                companionAvatarBtn.addEventListener('click', () => {
                    playSound('blip');
                    if (companionBubble && !companionBubble.classList.contains('hidden')) {
                        companionBubble.classList.add('hidden');
                    } else {
                        companionIndex = (companionIndex + 1) % companionTips.length;
                        companionText.textContent = companionTips[companionIndex];
                        if (companionBubble) companionBubble.classList.remove('hidden');
                    }
                });
            }

            if (companionCloseBtn && companionBubble) {
                companionCloseBtn.addEventListener('click', () => {
                    playSound('blip');
                    companionBubble.classList.add('hidden');
                });
            }

            // --------------------------------------------------------------------------
            // 7. Responsive Mobile/Tablet Navigation Drawer Toggle
            // --------------------------------------------------------------------------
            const mobileMenuBtn = document.getElementById('landing-mobile-menu-btn');
            const mobileMenu = document.getElementById('landing-mobile-menu');
            if (mobileMenuBtn && mobileMenu) {
                mobileMenuBtn.addEventListener('click', () => {
                    playSound('blip');
                    const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
                    mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
                    mobileMenu.classList.toggle('hidden');
                });

                document.querySelectorAll('.landing-mobile-nav-link').forEach(link => {
                    link.addEventListener('click', () => {
                        mobileMenu.classList.add('hidden');
                        mobileMenuBtn.setAttribute('aria-expanded', 'false');
                    });
                });
            }

            // Drawer SFX and CRT toggle shortcuts
            document.getElementById('drawer-sound-toggle-btn')?.addEventListener('click', () => {
                document.getElementById('sound-toggle-btn')?.click();
            });
            document.getElementById('drawer-crt-toggle-btn')?.addEventListener('click', () => {
                document.getElementById('crt-toggle-btn')?.click();
            });

        }
