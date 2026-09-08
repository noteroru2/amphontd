import { classifyPostPageIntent, isEditorialIntent } from './post-page-intent.mjs';

export const SERVICE_AUTHORITY_FAMILIES = [
	{
		key: 'NOTEBOOK',
		slug: 'notebook',
		label: 'รับซื้อโน๊ตบุ๊ค',
		description: 'รวมข้อมูลรับซื้อโน๊ตบุ๊ค พร้อมพื้นที่ให้บริการและช่องทางประเมินราคาก่อนขาย',
		moneyPath: '/rab-sue-notebook/',
	},
	{
		key: 'COMPUTER',
		slug: 'computer',
		label: 'รับซื้อคอมพิวเตอร์',
		description: 'รวมบริการรับซื้อคอม PC คอมประกอบ และอุปกรณ์คอม พร้อมพื้นที่ให้บริการ',
		moneyPath: '/rab-sue-com/',
	},
	{
		key: 'IPHONE',
		slug: 'iphone',
		label: 'รับซื้อ iPhone และมือถือ',
		description: 'รวมบริการรับซื้อ iPhone และมือถือ พร้อมพื้นที่ให้บริการและข้อมูลก่อนขายเครื่อง',
		moneyPath: '/rab-sue-iphone/',
	},
	{
		key: 'IPAD',
		slug: 'ipad',
		label: 'รับซื้อ iPad',
		description: 'รวมบริการรับซื้อ iPad พร้อมพื้นที่ให้บริการและช่องทางส่งข้อมูลเพื่อประเมินราคา',
		moneyPath: '/rab-sue-ipad/',
	},
	{
		key: 'MACBOOK',
		slug: 'macbook',
		label: 'รับซื้อ MacBook',
		description: 'รวมบริการรับซื้อ MacBook และ Mac พร้อมพื้นที่ให้บริการและข้อมูลเตรียมเครื่องก่อนขาย',
		moneyPath: '/rab-sue-macbook/',
	},
	{
		key: 'CAMERA',
		slug: 'camera',
		label: 'รับซื้อกล้องและเลนส์',
		description: 'รวมบริการรับซื้อกล้อง เลนส์ และอุปกรณ์กล้อง พร้อมพื้นที่ให้บริการและวิธีส่งข้อมูลประเมินราคา',
		moneyPath: '/rab-sue-klong/',
	},
];

const MONEY_AUTHORITY_TRIGGERS = new Map([
	['/rab-sue-notebook/', { familyKey: 'NOTEBOOK', heading: 'อยากเปลี่ยนโน๊ตบุ๊คเก่าเป็นเงินสด?' }],
	['/rab-sue-com/', { familyKey: 'COMPUTER', heading: 'อยากรู้ราคาคอมของคุณ?' }],
	['/rab-sue-iphone/', { familyKey: 'IPHONE', heading: 'อยากรู้ราคาไอโฟนของคุณ?' }],
	['/rab-sue-ipad/', { familyKey: 'IPAD', heading: 'เช็คสเปก iPad ของคุณครบแล้วใช่ไหม?' }],
	['/rab-sue-macbook/', { familyKey: 'MACBOOK', heading: 'เช็คสเปก MacBook ของคุณแล้วใช่ไหม?' }],
	['/rab-sue-klong/', { familyKey: 'CAMERA', heading: 'มีกล้องอยากขาย?' }],
]);

function normalizePath(pathname = '/') {
	const path = String(pathname || '/').split('?')[0].split('#')[0];
	if (path === '/') return '/';
	const normalized = path.startsWith('/') ? path : `/${path}`;
	return normalized.endsWith('/') ? normalized : `${normalized}/`;
}

function cleanTitle(post) {
	return String(post?.title?.rendered ?? '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;|&#160;/gi, ' ')
		.replace(/&amp;/gi, '&')
		.replace(/\s+/g, ' ')
		.trim();
}

export function normalizeAuthorityFamilyKey(familyKey) {
	return familyKey === 'PHONE' ? 'IPHONE' : familyKey;
}

export function getAuthorityFamilyByKey(familyKey) {
	const normalized = normalizeAuthorityFamilyKey(familyKey);
	return SERVICE_AUTHORITY_FAMILIES.find((family) => family.key === normalized);
}

export function getAuthorityFamilyBySlug(slug) {
	return SERVICE_AUTHORITY_FAMILIES.find((family) => family.slug === slug);
}

export function getAuthorityFamilyByMoneyPath(pathname) {
	const path = normalizePath(pathname);
	return SERVICE_AUTHORITY_FAMILIES.find((family) => family.moneyPath === path);
}

export function getFamilyHubPath(familyKey) {
	const family = getAuthorityFamilyByKey(familyKey);
	return family ? `/services/${family.slug}/` : '/services/';
}

export function getMoneyAuthorityTrigger(pathname, heading) {
	const trigger = MONEY_AUTHORITY_TRIGGERS.get(normalizePath(pathname));
	if (!trigger || trigger.heading !== heading) return undefined;
	return trigger;
}

export function buildFamilyServiceEntries(indexablePosts, familyKey, options = {}) {
	const normalizedFamily = normalizeAuthorityFamilyKey(familyKey);
	const currentSlug = options.currentSlug;
	const localOnly = options.localOnly ?? false;
	const entries = [];
	const seen = new Set();

	for (const post of indexablePosts ?? []) {
		if (!post?.slug || post.slug === currentSlug || seen.has(post.slug)) continue;
		const intent = classifyPostPageIntent(post);
		if (isEditorialIntent(intent)) continue;
		if (normalizeAuthorityFamilyKey(intent.familyKey) !== normalizedFamily) continue;
		if (localOnly && intent.kind !== 'LOCAL_SERVICE') continue;

		seen.add(post.slug);
		entries.push({
			slug: post.slug,
			href: `/${post.slug}/`,
			label: cleanTitle(post),
			locationLabel: intent.locationLabel,
			kind: intent.kind,
			familyKey: normalizedFamily,
			modified: post.modified ?? post.date ?? '',
		});
	}

	return entries.sort((a, b) => {
		const localDiff = Number(b.kind === 'LOCAL_SERVICE') - Number(a.kind === 'LOCAL_SERVICE');
		if (localDiff !== 0) return localDiff;
		const dateDiff = (Date.parse(b.modified) || 0) - (Date.parse(a.modified) || 0);
		if (dateDiff !== 0) return dateDiff;
		return a.label.localeCompare(b.label, 'th');
	});
}

export function buildAuthorityClusters(indexablePosts) {
	return SERVICE_AUTHORITY_FAMILIES.map((family) => {
		const entries = buildFamilyServiceEntries(indexablePosts, family.key);
		const localEntries = entries.filter((entry) => entry.kind === 'LOCAL_SERVICE');
		return {
			...family,
			hubPath: `/services/${family.slug}/`,
			entries,
			localEntries,
		};
	});
}

export function getMoneyAuthorityLinks(indexablePosts, familyKey, limit = 8) {
	return buildFamilyServiceEntries(indexablePosts, familyKey, { localOnly: true }).slice(0, limit);
}

export function getServiceSiblingLinks(indexablePosts, familyKey, currentSlug, limit = 5) {
	return buildFamilyServiceEntries(indexablePosts, familyKey, { currentSlug, localOnly: true }).slice(0, limit);
}
