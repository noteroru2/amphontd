import http from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sirv from 'sirv';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const port = Number(process.env.PORT || '3000');

const serve = sirv(dist, {
	etag: true,
	single: true,
	// cache heuristics:
	// - HTML should revalidate (avoid getting stuck on old deploys)
	// - hashed assets under /_astro can be cached long
	setHeaders(res, filePath) {
		const normalized = filePath.split(path.sep).join('/');
		if (normalized.endsWith('.html')) {
			res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
			return;
		}
		if (normalized.includes('/_astro/')) {
			res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
			return;
		}
		if (/\.(?:css|js|mjs|map|svg|png|jpg|jpeg|webp|avif|gif|ico|woff2?)$/i.test(normalized)) {
			res.setHeader('Cache-Control', 'public, max-age=604800');
			return;
		}
		res.setHeader('Cache-Control', 'public, max-age=3600');
	},
});

http
	.createServer((req, res) => {
		// basic hardening
		res.setHeader('X-Content-Type-Options', 'nosniff');
		res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
		serve(req, res);
	})
	.listen(port, '0.0.0.0', () => {
		console.log(`[start] serving ${dist} on 0.0.0.0:${port}`);
	});
