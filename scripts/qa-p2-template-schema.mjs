import fs from 'node:fs';
import path from 'node:path';
import { countContentH1, sanitizePostContentHtml } from '../src/lib/post-content-hygiene.mjs';
import { buildPostIndexPolicy, isRoutableLifecycle } from '../src/lib/post-index-policy.mjs';
import { buildPostStructuredData, classifyPostPageIntent, isEditorialIntent } from '../src/lib/post-page-intent.mjs';

const dataPath = path.resolve('src/data/local-posts.generated.json');
const pagePath = path.resolve('src/pages/[slug].astro');
const blogPath = path.resolve('src/pages/blog/index.astro');
const posts = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const pageSource = fs.readFileSync(pagePath, 'utf8');
const blogSource = fs.readFileSync(blogPath, 'utf8');
const policy = buildPostIndexPolicy(posts);
const routable = posts.filter((post) => isRoutableLifecycle(policy.get(post.slug)));

const stats = {
	ARTICLE: 0,
	GUIDE: 0,
	SERVICE: 0,
	LOCAL_SERVICE: 0,
	rawContentWithH1: 0,
};

for (const post of routable) {
	const intent = classifyPostPageIntent(post);
	stats[intent.kind] = (stats[intent.kind] ?? 0) + 1;

	const rawHtml = post?.content?.rendered ?? '';
	if (countContentH1(rawHtml) > 0) stats.rawContentWithH1 += 1;
	const sanitized = sanitizePostContentHtml(rawHtml);
	if (countContentH1(sanitized) !== 0) {
		throw new Error(`H1 hygiene failed for /${post.slug}/`);
	}

	const title = String(post?.title?.rendered ?? '').replace(/<[^>]+>/g, '').trim();
	const url = `https://amphontd.com/${post.slug}/`;
	const schemas = buildPostStructuredData({
		post,
		intent,
		title,
		description: title,
		url,
		site: 'https://amphontd.com',
		featuredUrl: undefined,
		tags: [],
	});
	const primary = schemas[0];
	const breadcrumb = schemas[1];

	if (isEditorialIntent(intent)) {
		const expected = intent.kind === 'GUIDE' ? 'TechArticle' : 'Article';
		if (primary['@type'] !== expected) {
			throw new Error(`Editorial schema mismatch for /${post.slug}/: ${primary['@type']} != ${expected}`);
		}
	} else {
		if (primary['@type'] !== 'Service') {
			throw new Error(`Service schema mismatch for /${post.slug}/: ${primary['@type']}`);
		}
		if (intent.kind === 'LOCAL_SERVICE' && !primary.areaServed?.name) {
			throw new Error(`Local service missing areaServed for /${post.slug}/`);
		}
	}

	if (breadcrumb?.['@type'] !== 'BreadcrumbList') {
		throw new Error(`Breadcrumb schema missing for /${post.slug}/`);
	}
}

const synthetic = [
	{
		post: { slug: 'รับซื้อคอมพิษณุโลก', title: { rendered: 'รับซื้อคอม พิษณุโลก' } },
		expected: 'LOCAL_SERVICE',
	},
	{
		post: { slug: 'วิธีแพ็คกล้องก่อนส่งขาย', title: { rendered: 'วิธีแพ็คกล้องก่อนส่งขายอย่างปลอดภัย' } },
		expected: 'GUIDE',
	},
	{
		post: { slug: 'ข่าวสารสินค้าไอที', title: { rendered: 'ข่าวสารสินค้าไอทีมือสอง' } },
		expected: 'ARTICLE',
	},
];

for (const item of synthetic) {
	const actual = classifyPostPageIntent(item.post).kind;
	if (actual !== item.expected) {
		throw new Error(`Intent classifier regression: ${item.post.slug} => ${actual}, expected ${item.expected}`);
	}
}

const sampleH1 = '<h1 class="legacy">หัวข้อเดิม</h1><p>เนื้อหา</p><H1>อีกหัวข้อ</H1>';
if (countContentH1(sanitizePostContentHtml(sampleH1)) !== 0) {
	throw new Error('Global H1 sanitizer regression.');
}

if (!pageSource.includes('sanitizePostContentHtml(preparePostContent(')) {
	throw new Error('[slug].astro is not applying global H1 hygiene after content transforms.');
}
if (!pageSource.includes("type={isEditorial ? 'article' : 'website'}")) {
	throw new Error('[slug].astro is not switching Open Graph/page metadata by intent.');
}
if (!pageSource.includes('buildPostStructuredData')) {
	throw new Error('[slug].astro is not using intent-aware structured data.');
}
if (!blogSource.includes('isEditorialIntent(classifyPostPageIntent(post))')) {
	throw new Error('/blog/ still mixes service landing pages into the editorial collection.');
}

console.log('AMPHONTD P2 TEMPLATE / SCHEMA / H1');
console.log(JSON.stringify(stats, null, 2));
console.log(`ROUTABLE=${routable.length}`);
console.log('P2_TEMPLATE_SCHEMA_H1_GATE=PASS');
