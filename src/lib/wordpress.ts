/**
 * WordPress REST API (headless) — ใช้เฉพาะ endpoint ที่เปิด public
 * เอกสาร: https://developer.wordpress.org/rest-api/
 */

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
		'wp:featuredmedia'?: Array<{
			source_url: string;
			alt_text?: string;
		}>;
	};
}

export function normalizeWpSlug(slug: string): string {
	try {
		return decodeURIComponent(slug);
	} catch {
		return slug;
	}
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

export function getFeaturedImageAlt(post: WPPost): string {
	const media = post._embedded?.['wp:featuredmedia']?.[0];
	return media?.alt_text || post.title.rendered.replace(/<[^>]+>/g, '').trim();
}
