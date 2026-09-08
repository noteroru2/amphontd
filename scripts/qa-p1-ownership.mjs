import fs from 'node:fs';
import path from 'node:path';
import {
	STATIC_OWNER_PATHS,
	buildPostIndexPolicy,
	buildRedirectConfig,
	getPolicySummary,
} from '../src/lib/post-index-policy.mjs';

const dataPath = path.resolve('src/data/local-posts.generated.json');
const posts = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const bySlug = new Map(posts.map((post) => [post.slug, post]));
const policy = buildPostIndexPolicy(posts);
const redirects = buildRedirectConfig(policy);
const summary = getPolicySummary(policy);

const offTopic = posts.filter((post) =>
	['เหล้า', 'สุรา', 'วิสกี้', 'whisky', 'whiskey', 'ไวน์', 'wine', 'คอนญัก', 'cognac', 'แชมเปญ', 'champagne', 'เบียร์', 'beer']
		.some((term) => `${post.slug} ${post.title?.rendered ?? ''}`.toLocaleLowerCase('th').includes(term)),
);

const redirectsByDestination = new Map();
for (const [source, rule] of Object.entries(redirects)) {
	const list = redirectsByDestination.get(rule.destination) ?? [];
	list.push(source);
	redirectsByDestination.set(rule.destination, list);
}

console.log('AMPHONTD P1 OWNERSHIP CONSOLIDATION');
console.log(JSON.stringify(summary, null, 2));
console.log(`REDIRECT_RULES=${Object.keys(redirects).length}`);
console.log(`REDIRECT_DESTINATIONS=${redirectsByDestination.size}`);
console.log(`OFF_TOPIC_GONE=${offTopic.length}`);

if (summary.REDIRECT === 0) {
	throw new Error('P1 produced zero permanent redirect candidates.');
}

if (summary.GONE === 0) {
	throw new Error('P1 produced zero GONE off-topic routes.');
}

for (const post of offTopic) {
	const item = policy.get(post.slug);
	if (item?.lifecycle !== 'GONE') {
		throw new Error(`Off-topic route is not GONE: /${post.slug}/ => ${item?.lifecycle}`);
	}
}

for (const [slug, item] of policy.entries()) {
	if (item.lifecycle !== 'REDIRECT') continue;
	if (!item.ownerPath) {
		throw new Error(`Redirect has no final ownerPath: /${slug}/`);
	}
	if (item.ownerPath === `/${slug}/`) {
		throw new Error(`Self redirect detected: /${slug}/`);
	}

	const generatedOwnerSlug = decodeURIComponent(item.ownerPath).replace(/^\/+|\/+$/g, '');
	if (bySlug.has(generatedOwnerSlug)) {
		const owner = policy.get(generatedOwnerSlug);
		if (owner?.lifecycle !== 'INDEX') {
			throw new Error(`Redirect owner is not INDEX: /${slug}/ -> ${item.ownerPath} (${owner?.lifecycle})`);
		}
	} else if (!STATIC_OWNER_PATHS.has(item.ownerPath)) {
		throw new Error(`Redirect points to an unknown static owner: /${slug}/ -> ${item.ownerPath}`);
	}

	if (redirects[item.ownerPath]) {
		throw new Error(`Redirect chain detected: /${slug}/ -> ${item.ownerPath}`);
	}
}

for (const probe of ['รับซื้อโน๊ตบุ๊คมือสอง-46', 'รับซื้อโน๊ตบุ๊คมือสอง-30']) {
	if (!bySlug.has(probe)) continue;
	const item = policy.get(probe);
	if (item?.lifecycle !== 'REDIRECT' || item.ownerPath !== '/rab-sue-notebook/') {
		throw new Error(`GSC notebook duplicate not consolidated to money owner: /${probe}/`);
	}
}

console.log('P1_OWNERSHIP_GATE=PASS');
