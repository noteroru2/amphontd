import fs from 'node:fs';
import path from 'node:path';
import { buildPostIndexPolicy, getPolicySummary } from '../src/lib/post-index-policy.mjs';

const dataPath = path.resolve('src/data/local-posts.generated.json');
const posts = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const policy = buildPostIndexPolicy(posts);
const summary = getPolicySummary(policy);

const indexed = posts.filter((post) => policy.get(post.slug)?.lifecycle === 'INDEX');
const held = posts.filter((post) => policy.get(post.slug)?.lifecycle === 'HOLD_NOINDEX');
const redirected = posts.filter((post) => policy.get(post.slug)?.lifecycle === 'REDIRECT');
const gone = posts.filter((post) => policy.get(post.slug)?.lifecycle === 'GONE');
const offTopicIndexed = indexed.filter((post) =>
	String(policy.get(post.slug)?.reason ?? '').startsWith('off_topic'),
);

console.log('AMPHONTD P0/P1 INDEX SURFACE');
console.log(JSON.stringify(summary, null, 2));
console.log(`INDEX=${indexed.length}`);
console.log(`HOLD_NOINDEX=${held.length}`);
console.log(`REDIRECT=${redirected.length}`);
console.log(`GONE=${gone.length}`);

if (summary.total !== posts.length) {
	throw new Error(`Policy coverage mismatch: policy=${summary.total} posts=${posts.length}`);
}

if (indexed.length === 0) {
	throw new Error('Index policy produced zero indexable generated posts.');
}

if (held.length + redirected.length + gone.length === 0) {
	throw new Error('Index policy did not reduce the generated index surface.');
}

if (offTopicIndexed.length > 0) {
	throw new Error(`Off-topic generated posts remain indexable: ${offTopicIndexed.map((post) => post.slug).join(', ')}`);
}

for (const [slug, item] of policy.entries()) {
	if (!['INDEX', 'HOLD_NOINDEX', 'REDIRECT', 'GONE'].includes(item.lifecycle)) {
		throw new Error(`Unknown lifecycle for ${slug}: ${item.lifecycle}`);
	}
}

console.log('P0_INDEX_SURFACE_GATE=PASS');
