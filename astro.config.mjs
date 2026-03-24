// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');
const siteUrl = env.SITE_URL ?? 'https://example.com';

// https://astro.build/config
export default defineConfig({
	site: siteUrl,
	trailingSlash: 'always',
	integrations: [
		sitemap({
			changefreq: 'weekly',
			priority: 0.7,
			serialize(item) {
				const url = item.url;
				if (url.endsWith('/rab-sue-notebook/') || url.endsWith('/rab-sue-com/') || url.endsWith('/rab-sue-iphone/') || url.endsWith('/rab-sue-klong/') || url.endsWith('/contact/')) {
					item.changefreq = 'weekly';
					item.priority = 0.9;
				}
				if (url === siteUrl + '/' || url === siteUrl) {
					item.changefreq = 'daily';
					item.priority = 1.0;
				}
				if (url.includes('/blog/') && url !== siteUrl + '/blog/') {
					item.changefreq = 'monthly';
					item.priority = 0.6;
				}
				return item;
			},
		}),
	],
});
