import fs from 'node:fs';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sirv from 'sirv';
import { applyMoneyOwnershipOverrides } from '../src/lib/money-query-ownership.mjs';
import { buildPostIndexPolicy } from '../src/lib/post-index-policy.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const port = Number(process.env.PORT || '3000');

// Astro's static redirect output is an HTML redirect page. Because production is
// served by this custom sirv server (not a platform-aware Astro adapter), enforce
// redirects and removals at the HTTP layer so crawlers receive the intended
// status codes rather than a 200 redirect document / generic 404.
const generatedPostsPath = path.join(root, 'src', 'data', 'local-posts.generated.json');
const generatedPosts = JSON.parse(fs.readFileSync(generatedPostsPath, 'utf8'));
const generatedPolicy = applyMoneyOwnershipOverrides(buildPostIndexPolicy(generatedPosts));
const redirectByPath = new Map();
const gonePaths = new Set();

for (const [slug, policy] of generatedPolicy.entries()) {
	const sourcePath = `/${slug}/`;
	if (policy.lifecycle === 'REDIRECT' && policy.ownerPath) {
		redirectByPath.set(sourcePath, policy.ownerPath);
	} else if (policy.lifecycle === 'GONE') {
		gonePaths.add(sourcePath);
	}
}

function normalizeRequestPath(value = '/') {
	try {
		const pathname = decodeURIComponent(new URL(value, 'http://localhost').pathname);
		if (pathname === '/') return '/';
		return `/${pathname.replace(/^\/+|\/+$/g, '')}/`;
	} catch {
		return '/';
	}
}

function getRequestSearch(value = '/') {
	try {
		return new URL(value, 'http://localhost').search;
	} catch {
		return '';
	}
}

function sendRedirect(req, res, destination) {
	const location = `${destination}${getRequestSearch(req.url)}`;
	res.statusCode = 301;
	res.setHeader('Location', location);
	res.setHeader('Cache-Control', 'public, max-age=3600');
	res.setHeader('Content-Type', 'text/plain; charset=utf-8');
	if (req.method === 'HEAD') {
		res.end();
		return;
	}
	res.end(`Moved permanently to ${location}`);
}

function sendGone(req, res) {
	const body = '<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><title>410 Gone</title></head><body><h1>410 Gone</h1><p>หน้านี้ถูกนำออกถาวรแล้ว</p></body></html>';
	res.statusCode = 410;
	res.setHeader('X-Robots-Tag', 'noindex, follow');
	res.setHeader('Cache-Control', 'public, max-age=3600');
	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	if (req.method === 'HEAD') {
		res.end();
		return;
	}
	res.end(body);
}

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

		const requestPath = normalizeRequestPath(req.url);
		const redirectDestination = redirectByPath.get(requestPath);
		if (redirectDestination) {
			sendRedirect(req, res, redirectDestination);
			return;
		}
		if (gonePaths.has(requestPath)) {
			sendGone(req, res);
			return;
		}

		serve(req, res);
	})
	.listen(port, '0.0.0.0', () => {
		console.log(
			`[start] serving ${dist} on 0.0.0.0:${port}; ${redirectByPath.size} permanent redirects; ${gonePaths.size} gone URLs`,
		);
	});
