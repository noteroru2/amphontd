export const STATIC_MONEY_PAGES = [
	{ slug: 'rab-sue-notebook', pathname: '/rab-sue-notebook/', source: 'src/pages/rab-sue-notebook.astro', label: 'บริการรับซื้อโน๊ตบุ๊คมือสอง' },
	{ slug: 'rab-sue-com', pathname: '/rab-sue-com/', source: 'src/pages/rab-sue-com.astro', label: 'บริการรับซื้อคอมพิวเตอร์มือสอง' },
	{ slug: 'rab-sue-iphone', pathname: '/rab-sue-iphone/', source: 'src/pages/rab-sue-iphone.astro', label: 'บริการรับซื้อ iPhone มือสอง' },
	{ slug: 'rab-sue-ipad', pathname: '/rab-sue-ipad/', source: 'src/pages/rab-sue-ipad.astro', label: 'บริการรับซื้อ iPad มือสอง' },
	{ slug: 'rab-sue-macbook', pathname: '/rab-sue-macbook/', source: 'src/pages/rab-sue-macbook.astro', label: 'บริการรับซื้อ MacBook มือสอง' },
	{ slug: 'rab-sue-klong', pathname: '/rab-sue-klong/', source: 'src/pages/rab-sue-klong.astro', label: 'บริการรับซื้อกล้องมือสอง' },
	{ slug: 'rab-sue-lamphong', pathname: '/rab-sue-lamphong/', source: 'src/pages/rab-sue-lamphong.astro', label: 'บริการรับซื้อลำโพงมือสอง' },
];

const DROP_SCHEMA_TYPES = new Set([
	'Article',
	'NewsArticle',
	'BlogPosting',
	'FAQPage',
	'HowTo',
]);

function schemaTypes(value) {
	const type = value?.['@type'];
	if (Array.isArray(type)) return type.map(String);
	return type ? [String(type)] : [];
}

function hasType(value, type) {
	return schemaTypes(value).includes(type);
}

function shouldDropSchema(value) {
	return schemaTypes(value).some((type) => DROP_SCHEMA_TYPES.has(type));
}

function canonicalFromHtml(html, fallbackPathname) {
	const match = String(html).match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)
		?? String(html).match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
	if (match?.[1]) return match[1];
	return `https://amphontd.com${fallbackPathname}`;
}

function normalizeService(service, { canonical, label }) {
	const origin = new URL(canonical).origin;
	return {
		...service,
		'@context': service?.['@context'] ?? 'https://schema.org',
		'@type': 'Service',
		'@id': `${canonical}#service`,
		name: service?.name ?? label,
		url: canonical,
		provider: { '@id': `${origin}/#organization` },
		mainEntityOfPage: { '@id': `${canonical}#webpage` },
	};
}

function transformSchemaValue(value, context) {
	if (Array.isArray(value)) {
		const transformed = value
			.map((item) => transformSchemaValue(item, context))
			.filter(Boolean);
		return transformed.length > 0 ? transformed : null;
	}
	if (!value || typeof value !== 'object') return value;
	if (shouldDropSchema(value)) return null;
	if (hasType(value, 'Service')) return normalizeService(value, context);
	return value;
}

export function inspectStaticMoneyHtml(html) {
	const scripts = [];
	const scriptRe = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
	let match;
	while ((match = scriptRe.exec(String(html)))) {
		try {
			scripts.push(JSON.parse(match[1]));
		} catch {
			scripts.push({ __invalidJsonLd: true });
		}
	}

	const flat = scripts.flatMap((item) => (Array.isArray(item) ? item : [item]));
	const counts = {
		Article: flat.filter((item) => hasType(item, 'Article') || hasType(item, 'NewsArticle') || hasType(item, 'BlogPosting')).length,
		FAQPage: flat.filter((item) => hasType(item, 'FAQPage')).length,
		HowTo: flat.filter((item) => hasType(item, 'HowTo')).length,
		Service: flat.filter((item) => hasType(item, 'Service')).length,
		BreadcrumbList: flat.filter((item) => hasType(item, 'BreadcrumbList')).length,
		WebPage: flat.filter((item) => hasType(item, 'WebPage')).length,
		invalidJsonLd: flat.filter((item) => item?.__invalidJsonLd).length,
	};

	return {
		counts,
		ogType: String(html).match(/<meta\s+[^>]*property=["']og:type["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1]
			?? String(html).match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:type["'][^>]*>/i)?.[1],
		articleMetaCount: (String(html).match(/<meta\s+[^>]*property=["']article:[^"']+["'][^>]*>/gi) ?? []).length,
	};
}

export function transformStaticMoneyHtml(html, page) {
	const canonical = canonicalFromHtml(html, page.pathname);
	let output = String(html)
		.replace(/(<meta\s+[^>]*property=["']og:type["'][^>]*content=["'])article(["'][^>]*>)/gi, '$1website$2')
		.replace(/(<meta\s+[^>]*content=["'])article(["'][^>]*property=["']og:type["'][^>]*>)/gi, '$1website$2')
		.replace(/\s*<meta\s+[^>]*property=["']article:(?:published_time|modified_time|author)["'][^>]*>\s*/gi, '\n');

	const scriptRe = /<script\b([^>]*)type=["']application\/ld\+json["']([^>]*)>([\s\S]*?)<\/script>/gi;
	output = output.replace(scriptRe, (whole, before, after, jsonText) => {
		let value;
		try {
			value = JSON.parse(jsonText);
		} catch {
			throw new Error(`Invalid JSON-LD on ${page.pathname}`);
		}
		const transformed = transformSchemaValue(value, { canonical, label: page.label });
		if (!transformed) return '';
		return `<script${before}type="application/ld+json"${after}>${JSON.stringify(transformed)}</script>`;
	});

	return output;
}

export function assertStaticMoneyOutput(html, page) {
	const report = inspectStaticMoneyHtml(html);
	const failures = [];
	if (report.ogType !== 'website') failures.push(`og:type=${report.ogType ?? 'missing'}`);
	if (report.articleMetaCount !== 0) failures.push(`article-meta=${report.articleMetaCount}`);
	if (report.counts.Article !== 0) failures.push(`Article=${report.counts.Article}`);
	if (report.counts.FAQPage !== 0) failures.push(`FAQPage=${report.counts.FAQPage}`);
	if (report.counts.HowTo !== 0) failures.push(`HowTo=${report.counts.HowTo}`);
	if (report.counts.Service !== 1) failures.push(`Service=${report.counts.Service}`);
	if (report.counts.BreadcrumbList !== 1) failures.push(`BreadcrumbList=${report.counts.BreadcrumbList}`);
	if (report.counts.WebPage < 1) failures.push(`WebPage=${report.counts.WebPage}`);
	if (report.counts.invalidJsonLd !== 0) failures.push(`invalid-jsonld=${report.counts.invalidJsonLd}`);
	if (failures.length > 0) throw new Error(`${page.pathname}: ${failures.join(', ')}`);
	return report;
}
