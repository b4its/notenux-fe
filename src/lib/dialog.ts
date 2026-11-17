// Keep keyboard focus inside an open dialog and restore its trigger on close.
export function focusDialog(element: HTMLElement) {
	const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	const controls = () => [...element.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([type="hidden"]), select, textarea, a[href]')];
	controls()[0]?.focus();
	const keydown = (event: KeyboardEvent) => {
		if (event.key !== 'Tab') return;
		const targets = controls();
		const first = targets[0];
		const last = targets.at(-1);
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault(); last?.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault(); first?.focus();
		}
	};
	element.addEventListener('keydown', keydown);
	return {
		destroy() {
			element.removeEventListener('keydown', keydown);
			previous?.focus();
		}
	};
}
