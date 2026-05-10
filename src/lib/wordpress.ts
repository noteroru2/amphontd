/**
 * WordPress REST API (headless) — ใช้เฉพาะ endpoint ที่เปิด public
 * เอกสาร: https://developer.wordpress.org/rest-api/
 */

export interface WPMediaSize {
	file?: string;
	width?: number;
	height?: number;
	source_url?: string;
}

export interface WPEmbeddedMedia {
	source_url: string;
	alt_text?: string;
	media_details?: {
		width?: number;
		height?: number;
		sizes?: Record<string, WPMediaSize>;
	};
}

export interface WPPost {
	id: number;
	date: string;
	modified: string;
	slug: string;
	title: { rendered: string };
	excerpt: { rendered: string };
	content: { rendered: string };
	link: string;
	_embedded?: {
		'wp:featuredmedia'?: WPEmbeddedMedia[];
		'wp:term'?: Array<Array<{ taxonomy: string; name: string }>>;
	};
}

export function normalizeWpSlug(slug: string): string {
	try {
		return decodeURIComponent(slug);
	} catch {
		return slug;
	}
}

export function getPostTags(post: WPPost): string[] {
	const terms = post._embedded?.['wp:term'];
	if (!terms) return [];
	const tags: string[] = [];
	for (const termGroup of terms) {
		for (const term of termGroup) {
			if (term.taxonomy === 'post_tag') {
				tags.push(term.name);
			}
		}
	}
	return tags;
}

function getBaseUrl(): string | null {
	const raw = import.meta.env.PUBLIC_WORDPRESS_URL;
	if (!raw || typeof raw !== 'string') return null;
	return raw.replace(/\/+$/, '');
}

export function isWordpressConfigured(): boolean {
	return Boolean(getBaseUrl());
}

function readNumberEnv(key: string, fallback: number): number {
	const raw = (import.meta.env as Record<string, unknown>)[key];
	if (typeof raw !== 'string') return fallback;
	const n = Number(raw);
	return Number.isFinite(n) ? n : fallback;
}

// Defaults are generous to allow "all posts" for most sites.
// You can override in Coolify env to reduce build time if needed.
const FETCH_TIMEOUT_MS = readNumberEnv('PUBLIC_WORDPRESS_TIMEOUT_MS', 12000);
const MAX_PAGES = readNumberEnv('PUBLIC_WORDPRESS_MAX_PAGES', 0); // 0 = unlimited
const MAX_POSTS = readNumberEnv('PUBLIC_WORDPRESS_MAX_POSTS', 0); // 0 = unlimited

async function fetchJsonWithTimeout(url: string): Promise<Response> {
	return fetch(url, {
		headers: { Accept: 'application/json' },
		signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
	});
}

export async function fetchPosts(): Promise<WPPost[]> {
	const base = getBaseUrl();
	if (!base) return [];

	const allPosts: WPPost[] = [];
	let page = 1;
	let totalPages = 1;

	while (page <= totalPages && (MAX_PAGES <= 0 || page <= MAX_PAGES)) {
		const url = new URL(`${base}/wp-json/wp/v2/posts`);
		url.searchParams.set('per_page', '100');
		url.searchParams.set('page', String(page));
		url.searchParams.set('_embed', '1');

		let res: Response;
		try {
			res = await fetchJsonWithTimeout(url.toString());
		} catch (error) {
			console.error(`[wordpress] fetch posts page ${page} timeout/error`, error);
			break;
		}

		if (!res.ok) {
			console.error(`[wordpress] fetch posts page ${page} failed: ${res.status} ${res.statusText}`);
			break;
		}

		if (page === 1) {
			const tp = res.headers.get('X-WP-TotalPages');
			if (tp) totalPages = parseInt(tp, 10) || 1;
		}

		const posts = (await res.json()) as WPPost[];
		allPosts.push(...posts);
		if (MAX_POSTS > 0 && allPosts.length >= MAX_POSTS) break;
		page++;
	}

	return allPosts.map((post) => ({
		...post,
		slug: normalizeWpSlug(post.slug),
	}));
}

export async function fetchPostBySlug(slug: string): Promise<WPPost | null> {
	const base = getBaseUrl();
	if (!base) return null;

	const url = new URL(`${base}/wp-json/wp/v2/posts`);
	url.searchParams.set('slug', slug);
	url.searchParams.set('_embed', '1');

	let res: Response;
	try {
		res = await fetchJsonWithTimeout(url.toString());
	} catch (error) {
		console.error(`[wordpress] fetch post "${slug}" timeout/error`, error);
		return null;
	}

	if (!res.ok) {
		console.error(
			`[wordpress] fetch post "${slug}" failed: ${res.status} ${res.statusText}`,
		);
		return null;
	}

	const list = (await res.json()) as WPPost[];
	return list[0] ?? null;
}

export function getFeaturedImageUrl(post: WPPost): string | undefined {
	const media = post._embedded?.['wp:featuredmedia']?.[0];
	return media?.source_url;
}

export type FeaturedImageAttrs = {
	src: string;
	srcset: string;
	sizes: string;
	width: number;
	height: number;
	alt: string;
};

function resolveMediaSizeUrl(media: WPEmbeddedMedia, size: WPMediaSize): string | undefined {
	if (size.source_url) return size.source_url;
	const file = size.file;
	const full = media.source_url;
	if (!file || !full) return undefined;
	try {
		const base = new URL(full);
		const path = base.pathname;
		const idx = path.lastIndexOf('/');
		if (idx === -1) return undefined;
		const dir = path.slice(0, idx + 1);
		return `${base.origin}${dir}${file}`;
	} catch {
		return undefined;
	}
}

/**
 * Build responsive attributes from embedded mediaDetails (WordPress REST _embed).
 * Helps LCP by letting the browser pick a smaller file than full-size `source_url`.
 */
export function getFeaturedImageAttrs(post: WPPost): FeaturedImageAttrs | null {
	const media = post._embedded?.['wp:featuredmedia']?.[0];
	if (!media?.source_url) return null;

	const md = media.media_details;
	const alt = getFeaturedImageAlt(post);
	const fullW = md?.width ?? 1200;
	const fullH = md?.height ?? Math.max(1, Math.round((fullW * 9) / 16));

	const pairs: Array<{ url: string; w: number }> = [];

	const sizes = md?.sizes;
	if (sizes) {
		for (const s of Object.values(sizes)) {
			const url = resolveMediaSizeUrl(media, s);
			const w = s.width;
			if (url && typeof w === 'number' && w > 0) pairs.push({ url, w });
		}
	}

	pairs.push({ url: media.source_url, w: fullW });

	const byW = new Map<number, string>();
	for (const { url, w } of pairs) {
		const cur = byW.get(w);
		if (!cur || url.length < cur.length) byW.set(w, url);
	}

	const sorted = [...byW.entries()].sort((a, b) => a[0] - b[0]);
	const srcset = sorted.map(([w, url]) => `${url} ${w}w`).join(', ');
	const src = sorted.length ? sorted[sorted.length - 1][1] : media.source_url;

	return {
		src,
		srcset,
		sizes: '(max-width: 720px) 100vw, 720px',
		width: fullW,
		height: fullH,
		alt,
	};
}

export function getFeaturedImageAlt(post: WPPost): string {
	const media = post._embedded?.['wp:featuredmedia']?.[0];
	return media?.alt_text || post.title.rendered.replace(/<[^>]+>/g, '').trim();
}
