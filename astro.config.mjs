// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');
const siteUrl =
	env.SITE_URL ??
		(env.COOLIFY_FQDN ? `https://${env.COOLIFY_FQDN}` : null) ??
		env.COOLIFY_URL ??
		'https://example.com';

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
