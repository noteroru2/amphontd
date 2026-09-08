import fs from 'node:fs';
import path from 'node:path';
import { buildPostIndexPolicy, getPolicySummary } from '../src/lib/post-index-policy.mjs';

const dataPath = path.resolve('src/data/local-posts.generated.json');
const posts = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const policy = buildPostIndexPolicy(posts);
const summary = getPolicySummary(policy);

const indexed = posts.filter((post) => policy.get(post.slug)?.lifecycle === 'INDEX');
const held = posts.filter((post) => policy.get(post.slug)?.lifecycle === 'HOLD_NOINDEX');
const offTopicIndexed = indexed.filter((post) => policy.get(post.slug)?.reason === 'off_topic');
const duplicateOwners = new Map();

for (const post of held) {
	const item = policy.get(post.slug);
	if (!item?.ownerSlug) continue;
	const list = duplicateOwners.get(item.ownerSlug) ?? [];
	list.push(post.slug);
	duplicateOwners.set(item.ownerSlug, list);
}

console.log('AMPHONTD P0 INDEX SURFACE');
console.log(JSON.stringify(summary, null, 2));
console.log(`INDEX=${indexed.length}`);
console.log(`HOLD_NOINDEX=${held.length}`);
console.log(`DUPLICATE_FAMILIES=${duplicateOwners.size}`);

if (summary.total !== posts.length) {
	throw new Error(`Policy coverage mismatch: policy=${summary.total} posts=${posts.length}`);
}

if (indexed.length === 0) {
	throw new Error('Index policy produced zero indexable generated posts.');
}

if (held.length === 0) {
	throw new Error('Index policy did not quarantine any generated posts; P0 cleanup is ineffective.');
}

if (offTopicIndexed.length > 0) {
	throw new Error(`Off-topic generated posts remain indexable: ${offTopicIndexed.map((post) => post.slug).join(', ')}`);
}

for (const [slug, item] of policy.entries()) {
	if (!['INDEX', 'HOLD_NOINDEX'].includes(item.lifecycle)) {
		throw new Error(`Unknown lifecycle for ${slug}: ${item.lifecycle}`);
	}
}

console.log('P0_INDEX_SURFACE_GATE=PASS');
