import { parse, type HTMLElement } from 'node-html-parser';

const UPLOADS_SEG = '/wp-content/uploads/';

function readTryContentSrcset(): boolean {
	const raw = (import.meta.env as Record<string, unknown>).PUBLIC_WP_TRY_CONTENT_SRCSET;
	if (raw === false) return false;
	if (typeof raw === 'string') return raw !== '0' && raw.toLowerCase() !== 'false';
	return true;
}

/**
 * Heuristic srcset for classic WordPress resized files: `{name}-{w}x{h}.{ext}` next to `{name}.{ext}`.
 * Disable with PUBLIC_WP_TRY_CONTENT_SRCSET=0 if your media library doesn't generate these sizes.
 */
function buildHeuristicWpSrcset(src: string, wpOrigin: string): string | undefined {
	try {
		const url = new URL(src);
		const baseOrigin = new URL(wpOrigin).origin;
		if (url.origin !== baseOrigin) return undefined;

		const path = url.pathname;
		const uploadsIdx = path.indexOf(UPLOADS_SEG);
		if (uploadsIdx === -1) return undefined;

		const after = path.slice(uploadsIdx + UPLOADS_SEG.length);
		const lastSlash = after.lastIndexOf('/');
		if (lastSlash === -1) return undefined;

		const ym = after.slice(0, lastSlash);
		const file = after.slice(lastSlash + 1);
		if (!/^\d{4}\/\d{2}$/.test(ym)) return undefined;

		const dot = file.lastIndexOf('.');
		if (dot <= 0) return undefined;

		const baseName = file.slice(0, dot);
		const ext = file.slice(dot + 1);
		if (!baseName || !ext) return undefined;

		if (/-\d+x\d+$/i.test(baseName)) return undefined;

		const dir = `${url.origin}${UPLOADS_SEG}${ym}/`;
		const widths = [300, 768, 1024];
		const parts = widths.map((w) => `${dir}${baseName}-${w}x${w}.${ext} ${w}w`);
		/* Descriptor is a hint; full-size `src` is often ≤1024px on this site — high `w` steers the browser to smaller candidates. */
		parts.push(`${src} 4096w`);
		return parts.join(', ');
	} catch {
		return undefined;
	}
}

/**
 * Improves IMG tags inside WordPress HTML: lazy-load, async decode, sizes, optional responsive srcset.
 */
export function enhancePostContentImages(html: string, wpBase: string | null | undefined): string {
	if (!html) return html;
	const wpOrigin = typeof wpBase === 'string' && wpBase ? wpBase.replace(/\/+$/, '') : null;
	const trySrcset = readTryContentSrcset() && Boolean(wpOrigin);

	const root = parse(html, {
		lowerCaseTagName: false,
		comment: false,
		blockTextElements: { script: true, style: true, pre: true, code: true },
	});

	for (const el of root.querySelectorAll('img')) {
		const img = el as HTMLElement;
		if (img.getAttribute('data-skip-opt') === '1') continue;

		const src = img.getAttribute('src')?.trim();
		if (!src) continue;

		img.setAttribute('loading', 'lazy');
		img.setAttribute('decoding', 'async');
		img.setAttribute('fetchpriority', 'low');

		if (!img.getAttribute('sizes')) {
			img.setAttribute('sizes', '(max-width: 720px) 100vw, 720px');
		}

		if (trySrcset && wpOrigin && !img.getAttribute('srcset')) {
			const srcset = buildHeuristicWpSrcset(src, wpOrigin);
			if (srcset) img.setAttribute('srcset', srcset);
		}
	}

	return root.toString();
}
