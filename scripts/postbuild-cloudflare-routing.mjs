import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyMoneyOwnershipOverrides, MONEY_OWNERSHIP_HOLD_SLUGS } from '../src/lib/money-query-ownership.mjs';
import { buildPostIndexPolicy } from '../src/lib/post-index-policy.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const generatedPostsPath = path.join(root, 'src', 'data', 'local-posts.generated.json');
const redirectsPath = path.join(dist, '_redirects');
const headersPath = path.join(dist, '_headers');

const MAX_STATIC_REDIRECTS = 2000;
const MAX_HEADER_RULES = 100;

if (!fs.existsSync(dist)) {
	throw new Error('[p7-routing] dist/ not found. Run astro build before this script.');
}

const generatedPosts = JSON.parse(fs.readFileSync(generatedPostsPath, 'utf8'));
const policy = applyMoneyOwnershipOverrides(buildPostIndexPolicy(generatedPosts));

const redirects = [];
for (const [slug, item] of policy.entries()) {
	if (item.lifecycle !== 'REDIRECT' || !item.ownerPath) continue;
	const source = `/${slug}/`;
	const destination = item.ownerPath.endsWith('/') ? item.ownerPath : `${item.ownerPath}/`;
	if (source === destination) continue;
	redirects.push({ source, destination });
}

redirects.sort((a, b) => a.source.localeCompare(b.source, 'th'));

if (redirects.length > MAX_STATIC_REDIRECTS) {
	throw new Error(
		`[p7-routing] ${redirects.length} redirects exceed Cloudflare's ${MAX_STATIC_REDIRECTS} static redirect limit.`,
	);
}

const redirectLines = [
	'# AMPHON TD SEO ownership redirects — generated; do not edit by hand.',
	'# Source Destination Status',
	...redirects.map(({ source, destination }) => `${source} ${destination} 301`),
	'',
];
fs.writeFileSync(redirectsPath, redirectLines.join('\n'), 'utf8');

// HOLD_NOINDEX already renders a meta robots directive in Astro. Reinforce the
// small, explicit money-query conflict set at the HTTP layer on Cloudflare so a
// stale cached/rendered document cannot keep competing with its owner page.
const holdHeaderRules = [...MONEY_OWNERSHIP_HOLD_SLUGS.keys()]
	.filter((slug) => policy.get(slug)?.lifecycle === 'HOLD_NOINDEX')
	.sort((a, b) => a.localeCompare(b, 'th'));

if (holdHeaderRules.length > MAX_HEADER_RULES) {
	throw new Error(
		`[p7-routing] ${holdHeaderRules.length} ownership noindex rules exceed Cloudflare's ${MAX_HEADER_RULES} header-rule limit.`,
	);
}

const headerLines = [
	'# AMPHON TD ownership conflict headers — generated; do not edit by hand.',
	...holdHeaderRules.flatMap((slug) => [
		`/${slug}/`,
		'  X-Robots-Tag: noindex, follow',
		'',
	]),
];
fs.writeFileSync(headersPath, headerLines.join('\n'), 'utf8');

const goneCount = [...policy.values()].filter((item) => item.lifecycle === 'GONE').length;
const holdCount = [...policy.values()].filter((item) => item.lifecycle === 'HOLD_NOINDEX').length;
const indexCount = [...policy.values()].filter((item) => item.lifecycle === 'INDEX').length;

console.log(
	`[p7-routing] INDEX=${indexCount} HOLD_NOINDEX=${holdCount} REDIRECT=${redirects.length} GONE=${goneCount}`,
);
console.log(`[p7-routing] wrote ${path.relative(root, redirectsPath)} and ${path.relative(root, headersPath)}`);
