
        export function start() {
            if (window.RetroPasswordToggle) {
                window.RetroPasswordToggle.initAll();
            } else {
                document.querySelectorAll('.toggle-password-btn').forEach(function(btn) {
                    if (btn.dataset.boundPasswordToggle) return;
                    btn.dataset.boundPasswordToggle = 'true';
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        var targetId = btn.getAttribute('data-target');
                        var input = targetId ? document.getElementById(targetId) : btn.parentElement.querySelector('input');
                        if (!input) return;
                        var icon = btn.querySelector('.toggle-password-icon') || btn.querySelector('i');
                        var isPassword = input.type === 'password';
                        if (isPassword) {
                            input.type = 'text';
                            btn.setAttribute('data-state', 'open');
                            btn.setAttribute('title', 'Sembunyikan kata sandi (Close password)');
                            btn.setAttribute('aria-label', 'Sembunyikan kata sandi');
                            if (icon) {
                                icon.classList.remove('fa-eye');
                                icon.classList.add('fa-eye-slash');
                            }
                        } else {
                            input.type = 'password';
                            btn.setAttribute('data-state', 'closed');
                            btn.setAttribute('title', 'Tampilkan kata sandi (Show password)');
                            btn.setAttribute('aria-label', 'Tampilkan kata sandi');
                            if (icon) {
                                icon.classList.remove('fa-eye-slash');
                                icon.classList.add('fa-eye');
                            }
                        }
                    });
                });
            }
        }
