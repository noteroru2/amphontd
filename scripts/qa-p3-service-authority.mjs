import fs from 'node:fs';
import path from 'node:path';
import { buildPostIndexPolicy } from '../src/lib/post-index-policy.mjs';
import { classifyPostPageIntent, isEditorialIntent } from '../src/lib/post-page-intent.mjs';
import {
	SERVICE_AUTHORITY_FAMILIES,
	buildFamilyServiceEntries,
	getAuthorityFamilyByKey,
	getMoneyAuthorityTrigger,
	normalizeAuthorityFamilyKey,
} from '../src/lib/service-authority-core.mjs';

const posts = JSON.parse(fs.readFileSync(path.resolve('src/data/local-posts.generated.json'), 'utf8'));
const policy = buildPostIndexPolicy(posts);
const indexablePosts = posts.filter((post) => policy.get(post.slug)?.lifecycle === 'INDEX');

const triggerChecks = [
	['/rab-sue-notebook/', 'NOTEBOOK', 'อยากเปลี่ยนโน๊ตบุ๊คเก่าเป็นเงินสด?', 'src/pages/rab-sue-notebook.astro'],
	['/rab-sue-com/', 'COMPUTER', 'อยากรู้ราคาคอมของคุณ?', 'src/pages/rab-sue-com.astro'],
	['/rab-sue-iphone/', 'IPHONE', 'อยากรู้ราคาไอโฟนของคุณ?', 'src/pages/rab-sue-iphone.astro'],
	['/rab-sue-ipad/', 'IPAD', 'เช็คสเปก iPad ของคุณครบแล้วใช่ไหม?', 'src/pages/rab-sue-ipad.astro'],
	['/rab-sue-macbook/', 'MACBOOK', 'เช็คสเปก MacBook ของคุณแล้วใช่ไหม?', 'src/pages/rab-sue-macbook.astro'],
	['/rab-sue-klong/', 'CAMERA', 'มีกล้องอยากขาย?', 'src/pages/rab-sue-klong.astro'],
];

function countOccurrences(text, needle) {
	if (!needle) return 0;
	return text.split(needle).length - 1;
}

const keys = SERVICE_AUTHORITY_FAMILIES.map((family) => family.key);
const slugs = SERVICE_AUTHORITY_FAMILIES.map((family) => family.slug);
const moneyPaths = SERVICE_AUTHORITY_FAMILIES.map((family) => family.moneyPath);
if (new Set(keys).size !== keys.length) throw new Error('Duplicate P3 family key.');
if (new Set(slugs).size !== slugs.length) throw new Error('Duplicate P3 family slug.');
if (new Set(moneyPaths).size !== moneyPaths.length) throw new Error('Duplicate P3 money owner path.');

const clusterMembership = new Map();
const clusterSummary = {};

for (const family of SERVICE_AUTHORITY_FAMILIES) {
	const entries = buildFamilyServiceEntries(indexablePosts, family.key);
	const localEntries = entries.filter((entry) => entry.kind === 'LOCAL_SERVICE');
	clusterSummary[family.key] = { entries: entries.length, local: localEntries.length };

	for (const entry of entries) {
		const post = posts.find((candidate) => candidate.slug === entry.slug);
		if (!post) throw new Error(`P3 entry missing source post: ${entry.slug}`);
		if (policy.get(entry.slug)?.lifecycle !== 'INDEX') {
			throw new Error(`P3 linked non-INDEX URL: ${entry.slug}`);
		}
		const intent = classifyPostPageIntent(post);
		if (isEditorialIntent(intent)) throw new Error(`Editorial URL leaked into service hub: ${entry.slug}`);
		if (normalizeAuthorityFamilyKey(intent.familyKey) !== family.key) {
			throw new Error(`Cross-topic family link: ${entry.slug} => ${intent.familyKey} inside ${family.key}`);
		}
		const memberships = clusterMembership.get(entry.slug) ?? [];
		memberships.push(family.key);
		clusterMembership.set(entry.slug, memberships);
	}
}

const supportedIndexServices = indexablePosts.filter((post) => {
	const intent = classifyPostPageIntent(post);
	if (isEditorialIntent(intent)) return false;
	return Boolean(getAuthorityFamilyByKey(intent.familyKey));
});

for (const post of supportedIndexServices) {
	const memberships = clusterMembership.get(post.slug) ?? [];
	if (memberships.length !== 1) {
		throw new Error(`Supported INDEX service must belong to exactly one hub: ${post.slug} => ${memberships.join(',') || 'NONE'}`);
	}
}

for (const [pathname, familyKey, heading, sourcePath] of triggerChecks) {
	const trigger = getMoneyAuthorityTrigger(pathname, heading);
	if (!trigger || trigger.familyKey !== familyKey) {
		throw new Error(`Money authority trigger mismatch: ${pathname}`);
	}
	const source = fs.readFileSync(path.resolve(sourcePath), 'utf8');
	if (countOccurrences(source, `heading="${heading}"`) !== 1) {
		throw new Error(`Money page must contain exactly one configured authority heading: ${sourcePath}`);
	}
}

const contactBoxSource = fs.readFileSync(path.resolve('src/components/ContactBox.astro'), 'utf8');
if (!contactBoxSource.includes('getMoneyAuthorityTrigger')) throw new Error('ContactBox missing P3 money authority trigger.');
if (!contactBoxSource.includes('<ServiceAuthorityLinks')) throw new Error('ContactBox missing P3 authority component.');

const generatedRouteSource = fs.readFileSync(path.resolve('src/pages/[slug].astro'), 'utf8');
if (!generatedRouteSource.includes('normalizeAuthorityFamilyKey')) throw new Error('[slug] missing topical family filter.');
if (!generatedRouteSource.includes('<ServiceAuthorityLinks')) throw new Error('[slug] missing service authority links.');
if (!generatedRouteSource.includes("indexPolicy.lifecycle === 'INDEX'")) throw new Error('[slug] authority block is not protected by INDEX lifecycle.');

for (const requiredPath of [
	'src/pages/services/index.astro',
	'src/pages/services/[family].astro',
	'src/components/ServiceAuthorityLinks.astro',
]) {
	if (!fs.existsSync(path.resolve(requiredPath))) throw new Error(`Missing P3 file: ${requiredPath}`);
}

console.log('AMPHONTD P3 SERVICE HUB AUTHORITY');
console.log(JSON.stringify({
	families: SERVICE_AUTHORITY_FAMILIES.length,
	supportedIndexServices: supportedIndexServices.length,
	clusters: clusterSummary,
}, null, 2));
console.log('P3_SERVICE_AUTHORITY_GATE=PASS');
