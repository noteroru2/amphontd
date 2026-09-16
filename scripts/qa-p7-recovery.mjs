import fs from 'node:fs';
import path from 'node:path';
import { applyMoneyOwnershipOverrides, MONEY_OWNERSHIP_HOLD_SLUGS, MONEY_OWNERSHIP_REDIRECT_SLUGS } from '../src/lib/money-query-ownership.mjs';
import { buildPostIndexPolicy } from '../src/lib/post-index-policy.mjs';

const root = process.cwd();
const posts = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'local-posts.generated.json'), 'utf8'));
const policy = applyMoneyOwnershipOverrides(buildPostIndexPolicy(posts));
const redirectsFile = path.join(root, 'dist', '_redirects');
const headersFile = path.join(root, 'dist', '_headers');
const homeFile = path.join(root, 'dist', 'index.html');

for (const required of [redirectsFile, headersFile, homeFile]) {
	if (!fs.existsSync(required)) throw new Error(`P7 missing build artifact: ${path.relative(root, required)}`);
}

const redirectsText = fs.readFileSync(redirectsFile, 'utf8');
const headersText = fs.readFileSync(headersFile, 'utf8');
const homeHtml = fs.readFileSync(homeFile, 'utf8');

for (const [slug, destination] of MONEY_OWNERSHIP_REDIRECT_SLUGS.entries()) {
	const item = policy.get(slug);
	if (item?.lifecycle !== 'REDIRECT' || item.ownerPath !== destination) {
		throw new Error(`P7 explicit money redirect policy mismatch: /${slug}/ -> ${item?.ownerPath ?? item?.lifecycle ?? 'missing'}`);
	}
	const line = `/${slug}/ ${destination} 301`;
	if (!redirectsText.includes(line)) throw new Error(`P7 Cloudflare redirect missing: ${line}`);
}

for (const [slug] of MONEY_OWNERSHIP_HOLD_SLUGS.entries()) {
	const item = policy.get(slug);
	if (item?.lifecycle !== 'HOLD_NOINDEX') throw new Error(`P7 hold policy mismatch: /${slug}/ => ${item?.lifecycle ?? 'missing'}`);
	if (!headersText.includes(`/${slug}/`)) throw new Error(`P7 Cloudflare header path missing: /${slug}/`);
}
if (!headersText.includes('X-Robots-Tag: noindex, follow')) throw new Error('P7 X-Robots-Tag noindex header missing.');

let expectedRedirects = 0;
for (const [slug, item] of policy.entries()) {
	if (item.lifecycle !== 'REDIRECT' || !item.ownerPath) continue;
	expectedRedirects += 1;
	const destination = item.ownerPath.endsWith('/') ? item.ownerPath : `${item.ownerPath}/`;
	const line = `/${slug}/ ${destination} 301`;
	if (!redirectsText.includes(line)) throw new Error(`P7 policy redirect missing from Cloudflare output: ${line}`);
}

// The homepage is the strongest internal authority source. It must never link
// directly to generated URLs retired by the index policy.
const leaked = [];
for (const [slug, item] of policy.entries()) {
	if (item.lifecycle === 'INDEX') continue;
	const encoded = encodeURI(`/${slug}/`);
	if (homeHtml.includes(`href="/${slug}/"`) || homeHtml.includes(`href='/${slug}/'`) || homeHtml.includes(`href="${encoded}"`) || homeHtml.includes(`href='${encoded}'`)) {
		leaked.push({ slug, lifecycle: item.lifecycle });
	}
}
if (leaked.length > 0) {
	throw new Error(`P7 homepage leaks authority to retired URLs: ${JSON.stringify(leaked.slice(0, 20))}`);
}

const summary = {
	index: [...policy.values()].filter((item) => item.lifecycle === 'INDEX').length,
	holdNoindex: [...policy.values()].filter((item) => item.lifecycle === 'HOLD_NOINDEX').length,
	redirects: expectedRedirects,
	gone: [...policy.values()].filter((item) => item.lifecycle === 'GONE').length,
	explicitMoneyRedirects: MONEY_OWNERSHIP_REDIRECT_SLUGS.size,
	explicitMoneyHolds: MONEY_OWNERSHIP_HOLD_SLUGS.size,
};

console.log('AMPHONTD P7 RECOVERY V2');
console.log(JSON.stringify(summary, null, 2));
console.log('P7_RECOVERY_GATE=PASS');
