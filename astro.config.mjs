// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';
import { buildPostIndexPolicy } from './src/lib/post-index-policy.mjs';

const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');
const siteUrl =
	env.SITE_URL ??
		(env.COOLIFY_FQDN ? `https://${env.COOLIFY_FQDN}` : null) ??
		env.COOLIFY_URL ??
		'https://amphontd.com';

const generatedPostsPath = path.resolve('src/data/local-posts.generated.json');
const generatedPosts = JSON.parse(fs.readFileSync(generatedPostsPath, 'utf8'));
const generatedPolicy = buildPostIndexPolicy(generatedPosts);
const heldGeneratedSlugs = new Set(
	generatedPosts
		.filter((post) => generatedPolicy.get(post.slug)?.lifecycle !== 'INDEX')
		.map((post) => post.slug),
);

function sitemapIncludesPage(page) {
	try {
		const pathname = decodeURIComponent(new URL(page).pathname);
		const slug = pathname.replace(/^\/+|\/+$/g, '');
		return !heldGeneratedSlugs.has(slug);
	} catch {
		return true;
	}
}

// https://astro.build/config
export default defineConfig({
	site: siteUrl,
	trailingSlash: 'always',
	build: {
		// Inlines global CSS into HTML to cut a render-blocking stylesheet request (small total CSS budget).
		inlineStylesheets: 'always',
	},
	integrations: [
		sitemap({
			filter: sitemapIncludesPage,
			changefreq: 'weekly',
			priority: 0.7,
			serialize(item) {
				const url = item.url;
				if (url === siteUrl + '/' || url === siteUrl) {
					item.changefreq = 'daily';
					item.priority = 1.0;
				} else if (
					url.match(
						/\/(rab-sue-notebook|rab-sue-com|rab-sue-iphone|rab-sue-klong|rab-sue-ipad|rab-sue-macbook|rab-sue-lamphong|contact|about|evaluate-price)\/$/
					)
				) {
					item.changefreq = 'weekly';
					item.priority = 0.9;
				} else if (url.includes('/blog/') && url !== siteUrl + '/blog/') {
					item.changefreq = 'monthly';
					item.priority = 0.6;
				}
				return item;
			},
		}),
	],
});
