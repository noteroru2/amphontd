const OFF_TOPIC_TERMS = [
	'เหล้า',
	'สุรา',
	'วิสกี้',
	'whisky',
	'whiskey',
	'ไวน์',
	'wine',
	'คอนญัก',
	'cognac',
	'แชมเปญ',
	'champagne',
	'เบียร์',
	'beer',
];

const CORE_TOPIC_TERMS = [
	'รับซื้อ',
	'ขาย',
	'ประเมิน',
	'ซ่อม',
	'คอม',
	'computer',
	'pc',
	'โน้ต',
	'โน๊ต',
	'notebook',
	'laptop',
	'macbook',
	'imac',
	'mac mini',
	'iphone',
	'ipad',
	'ไอโฟน',
	'ไอแพด',
	'apple',
	'airpods',
	'แอร์พอด',
	'มือถือ',
	'โทรศัพท์',
	'smartphone',
	'tablet',
	'แท็บเล็ต',
	'กล้อง',
	'camera',
	'lens',
	'เลนส์',
	'การ์ดจอ',
	'gpu',
	'cpu',
	'ram',
	'ssd',
	'ฮาร์ดดิสก์',
	'harddisk',
	'monitor',
	'จอมอนิเตอร์',
	'เครื่องปริ้น',
	'printer',
	'playstation',
	'xbox',
	'nintendo',
	'steam deck',
	'ไอที',
	'สินค้า',
	'สต๊อก',
	'stock',
	'ประมูล',
	'บริษัท',
	'สำนักงาน',
];

const FORCE_INDEX_SLUGS = new Set([
	'fix-com-ubon',
	'fixmobile-ubon',
	'fix-notebook-ubon',
	'buynotebookubon',
	'รับซื้อคอมพิษณุโลก',
	'รับซื้อคอมภูเก็ต',
	'computer-auction',
]);

export const STATIC_OWNER_PATHS = new Set([
	'/rab-sue-notebook/',
	'/rab-sue-com/',
	'/rab-sue-iphone/',
	'/rab-sue-ipad/',
	'/rab-sue-macbook/',
	'/rab-sue-klong/',
	'/buynotebookubon/',
]);

function htmlToText(value = '') {
	return String(value)
		.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
		.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;|&#160;/gi, ' ')
		.replace(/&amp;/gi, '&')
		.replace(/&quot;/gi, '"')
		.replace(/&#39;|&apos;/gi, "'")
		.replace(/\s+/g, ' ')
		.trim();
}

function normalizedTitle(post) {
	return htmlToText(post?.title?.rendered ?? '')
		.toLocaleLowerCase('th')
		.replace(/[|｜–—:：•·]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function normalizedSlug(slug) {
	return String(slug ?? '').trim().toLocaleLowerCase('th');
}

function searchText(post) {
	return `${post?.slug ?? ''} ${htmlToText(post?.title?.rendered ?? '')}`.toLocaleLowerCase('th');
}

function plainContentLength(post) {
	return htmlToText(post?.content?.rendered ?? '').length;
}

function hasAny(text, terms) {
	return terms.some((term) => text.includes(term));
}

function stripNumericSuffix(slug) {
	return String(slug ?? '').replace(/-\d+$/, '');
}

function matchesGenericFamily(slug, roots) {
	const value = normalizedSlug(slug);
	const base = stripNumericSuffix(value);
	return roots.includes(base);
}

export function getStaticOwnerPath(slug) {
	if (
		matchesGenericFamily(slug, [
			'รับซื้อโน๊ตบุ๊คมือสอง',
			'รับซื้อโน้ตบุ๊คมือสอง',
			'รับซื้อโน๊ตบุ๊ค',
			'รับซื้อโน้ตบุ๊ค',
		])
	) {
		return '/rab-sue-notebook/';
	}

	if (matchesGenericFamily(slug, ['rab-sue-notebook-ubon-ratchathani'])) {
		return '/buynotebookubon/';
	}

	if (matchesGenericFamily(slug, ['รับซื้อคอม', 'รับซื้อคอมพิวเตอร์'])) {
		return '/rab-sue-com/';
	}

	if (matchesGenericFamily(slug, ['รับซื้อไอโฟน', 'รับซื้อiphone'])) {
		return '/rab-sue-iphone/';
	}

	if (matchesGenericFamily(slug, ['รับซื้อไอแพด', 'รับซื้อipad'])) {
		return '/rab-sue-ipad/';
	}

	if (matchesGenericFamily(slug, ['รับซื้อmacbook', 'รับซื้อ-macbook'])) {
		return '/rab-sue-macbook/';
	}

	if (matchesGenericFamily(slug, ['รับซื้อกล้องมือสอง', 'รับซื้อกล้อง'])) {
		return '/rab-sue-klong/';
	}

	return undefined;
}

function duplicateWinnerScore(post) {
	const slug = post?.slug ?? '';
	const numericSuffixPenalty = /-\d+$/.test(slug) ? -10000 : 0;
	const contentScore = Math.min(plainContentLength(post), 12000);
	const slugScore = Math.max(0, 250 - slug.length);
	const modified = Date.parse(post?.modified ?? post?.date ?? '') || 0;
	return numericSuffixPenalty + contentScore + slugScore + modified / 1e11;
}

function chooseWinner(posts) {
	return [...posts].sort((a, b) => {
		const scoreDiff = duplicateWinnerScore(b) - duplicateWinnerScore(a);
		if (scoreDiff !== 0) return scoreDiff;
		return String(a.slug).localeCompare(String(b.slug), 'th');
	})[0];
}

function resolveGeneratedRedirectOwner(policy, startSlug) {
	const seen = new Set();
	let currentSlug = startSlug;

	while (currentSlug) {
		if (seen.has(currentSlug)) return undefined;
		seen.add(currentSlug);

		const item = policy.get(currentSlug);
		if (!item) return undefined;

		if (item.lifecycle === 'INDEX') {
			return `/${currentSlug}/`;
		}

		if (item.lifecycle !== 'REDIRECT') return undefined;
		if (item.ownerPath) return item.ownerPath;
		currentSlug = item.ownerSlug;
	}

	return undefined;
}

function finalizeRedirectOwners(policy) {
	for (const [slug, item] of policy.entries()) {
		if (item.lifecycle !== 'REDIRECT') continue;

		if (item.ownerPath) {
			policy.set(slug, {
				...item,
				ownerPath: item.ownerPath.endsWith('/') ? item.ownerPath : `${item.ownerPath}/`,
			});
			continue;
		}

		const ownerPath = item.ownerSlug
			? resolveGeneratedRedirectOwner(policy, item.ownerSlug)
			: undefined;

		if (!ownerPath) {
			policy.set(slug, {
				lifecycle: 'HOLD_NOINDEX',
				reason: `${item.reason}_owner_not_indexable`,
			});
			continue;
		}

		policy.set(slug, {
			...item,
			ownerPath,
		});
	}
}

export function buildPostIndexPolicy(posts) {
	const safePosts = Array.isArray(posts) ? posts.filter((post) => post?.slug) : [];
	const bySlug = new Map(safePosts.map((post) => [post.slug, post]));
	const titleGroups = new Map();

	for (const post of safePosts) {
		const key = normalizedTitle(post);
		if (!key) continue;
		const group = titleGroups.get(key) ?? [];
		group.push(post);
		titleGroups.set(key, group);
	}

	const duplicateWinnerByTitle = new Map();
	for (const [key, group] of titleGroups.entries()) {
		if (group.length > 1) duplicateWinnerByTitle.set(key, chooseWinner(group).slug);
	}

	const policy = new Map();

	for (const post of safePosts) {
		const slug = post.slug;
		const text = searchText(post);
		const titleKey = normalizedTitle(post);
		const duplicateTitleWinner = duplicateWinnerByTitle.get(titleKey);
		const baseSlug = stripNumericSuffix(slug);
		const hasBaseSlugSibling = baseSlug !== slug && bySlug.has(baseSlug);
		const staticOwnerPath = getStaticOwnerPath(slug);

		if (hasAny(text, OFF_TOPIC_TERMS)) {
			policy.set(slug, {
				lifecycle: 'GONE',
				reason: 'off_topic_removed',
			});
			continue;
		}

		if (staticOwnerPath) {
			policy.set(slug, {
				lifecycle: 'REDIRECT',
				reason: 'static_money_owner',
				ownerPath: staticOwnerPath,
			});
			continue;
		}

		if (duplicateTitleWinner && duplicateTitleWinner !== slug) {
			policy.set(slug, {
				lifecycle: 'REDIRECT',
				reason: 'duplicate_title',
				ownerSlug: duplicateTitleWinner,
			});
			continue;
		}

		if (hasBaseSlugSibling) {
			policy.set(slug, {
				lifecycle: 'REDIRECT',
				reason: 'duplicate_slug_family',
				ownerSlug: baseSlug,
			});
			continue;
		}

		if (FORCE_INDEX_SLUGS.has(slug)) {
			policy.set(slug, {
				lifecycle: 'INDEX',
				reason: 'force_index_proven',
			});
			continue;
		}

		if (!hasAny(text, CORE_TOPIC_TERMS)) {
			policy.set(slug, {
				lifecycle: 'HOLD_NOINDEX',
				reason: 'topic_mismatch',
			});
			continue;
		}

		if (plainContentLength(post) < 600) {
			policy.set(slug, {
				lifecycle: 'HOLD_NOINDEX',
				reason: 'thin_content',
			});
			continue;
		}

		policy.set(slug, {
			lifecycle: 'INDEX',
			reason: 'aligned_unique_content',
		});
	}

	finalizeRedirectOwners(policy);
	return policy;
}

export function buildRedirectConfig(policy) {
	const redirects = {};
	for (const [slug, item] of policy.entries()) {
		if (item.lifecycle !== 'REDIRECT' || !item.ownerPath) continue;
		redirects[`/${slug}/`] = {
			status: 301,
			destination: item.ownerPath,
		};
	}
	return redirects;
}

export function getPolicySummary(policy) {
	const summary = {
		total: 0,
		INDEX: 0,
		HOLD_NOINDEX: 0,
		REDIRECT: 0,
		GONE: 0,
		reasons: {},
	};

	for (const value of policy.values()) {
		summary.total += 1;
		summary[value.lifecycle] = (summary[value.lifecycle] ?? 0) + 1;
		summary.reasons[value.reason] = (summary.reasons[value.reason] ?? 0) + 1;
	}

	return summary;
}

export function isIndexLifecycle(value) {
	return value?.lifecycle === 'INDEX';
}

export function isRoutableLifecycle(value) {
	return value?.lifecycle === 'INDEX' || value?.lifecycle === 'HOLD_NOINDEX';
}
