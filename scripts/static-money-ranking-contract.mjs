export const MONEY_QUERY_OWNERS = [
	{
		pathname: '/rab-sue-notebook/',
		terms: ['รับซื้อโน๊ตบุ๊ค', 'รับซื้อโน้ตบุ๊ค', 'รับซื้อ notebook', 'รับซื้อ laptop'],
	},
	{
		pathname: '/rab-sue-com/',
		terms: ['รับซื้อคอม', 'รับซื้อคอมพิวเตอร์', 'ขายคอมมือสอง'],
	},
	{
		pathname: '/rab-sue-iphone/',
		terms: ['รับซื้อ iphone', 'รับซื้อไอโฟน', 'ขายไอโฟนมือสอง'],
	},
	{
		pathname: '/rab-sue-ipad/',
		terms: ['รับซื้อ ipad', 'รับซื้อไอแพด', 'ขายไอแพดมือสอง', 'ประเมินราคาไอแพด'],
	},
	{
		pathname: '/rab-sue-macbook/',
		terms: ['รับซื้อ macbook', 'รับซื้อ macbook มือสอง', 'รับซื้อแมคบุ๊ค', 'รับซื้อ macbook ให้ราคาสูง'],
	},
	{
		pathname: '/rab-sue-klong/',
		terms: ['รับซื้อกล้อง', 'รับซื้อกล้องมือสอง', 'ขายกล้องมือสอง'],
	},
	{
		pathname: '/rab-sue-lamphong/',
		terms: ['รับซื้อลำโพง', 'รับซื้อลำโพงมือสอง'],
	},
];

export const P5_RANKING_TARGETS = [
	{
		slug: 'rab-sue-macbook',
		pathname: '/rab-sue-macbook/',
		title: 'รับซื้อ MacBook / แมคบุ๊ค มือสอง ให้ราคาสูง | AMPHON TRADING',
		description:
			'รับซื้อ MacBook Air และ MacBook Pro มือสอง ทั้ง Intel และ M-Series ประเมินตามรุ่น RAM SSD Cycle Count และสภาพจริง ส่งรูปประเมินฟรีทาง Line @webuy',
		h1: 'รับซื้อ MacBook / แมคบุ๊ค มือสอง ทุกรุ่น ประเมินตามสเปกและสภาพ',
	},
	{
		slug: 'rab-sue-ipad',
		pathname: '/rab-sue-ipad/',
		title: 'รับซื้อ iPad / ไอแพด มือสอง ทุกรุ่น | AMPHON TRADING',
		description:
			'รับซื้อ iPad มือสอง ทั้ง Gen, mini, Air และ Pro ประเมินตามรุ่น ความจุ Wi-Fi/Cellular สภาพจอ แบตเตอรี่ และอุปกรณ์ ส่งรูปประเมินฟรีทาง Line @webuy',
		h1: 'รับซื้อ iPad / ไอแพด มือสอง ทุกรุ่น ประเมินตามรุ่น ความจุ และสภาพ',
	},
	{
		slug: 'rab-sue-com',
		pathname: '/rab-sue-com/',
		title: 'รับซื้อคอม / คอมพิวเตอร์มือสอง PC Gaming | AMPHON TRADING',
		description:
			'รับซื้อคอมพิวเตอร์มือสอง คอมประกอบ Gaming PC Workstation และคอมสำนักงาน ประเมิน CPU GPU RAM SSD และสภาพจริง ส่งสเปกประเมินฟรีทาง Line @webuy',
		h1: 'รับซื้อคอม / คอมพิวเตอร์มือสอง PC Gaming และคอมสำนักงาน',
	},
	{
		slug: 'rab-sue-iphone',
		pathname: '/rab-sue-iphone/',
		title: 'รับซื้อ iPhone / ไอโฟน มือสอง ทุกรุ่น | AMPHON TRADING',
		description:
			'รับซื้อ iPhone มือสองทุกรุ่น ประเมินตามรุ่น ความจุ Battery Health จอ Face ID True Tone และสภาพเครื่อง ส่งรูปประเมินฟรีทาง Line @webuy',
		h1: 'รับซื้อ iPhone / ไอโฟน มือสอง ทุกรุ่น ประเมินตามรุ่น ความจุ แบตเตอรี่ และสภาพ',
	},
];

function escapeHtmlText(value) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;');
}

function replaceMetaContent(html, selector, value) {
	const { attribute, attributeValue } = selector;
	const escaped = String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;');
	const first = new RegExp(
		`(<meta\\s+[^>]*${attribute}=["']${attributeValue}["'][^>]*content=["'])[^"']*(["'][^>]*>)`,
		'i',
	);
	const second = new RegExp(
		`(<meta\\s+[^>]*content=["'])[^"']*(["'][^>]*${attribute}=["']${attributeValue}["'][^>]*>)`,
		'i',
	);
	if (first.test(html)) return html.replace(first, `$1${escaped}$2`);
	if (second.test(html)) return html.replace(second, `$1${escaped}$2`);
	return html;
}

function readMetaContent(html, attribute, attributeValue) {
	const first = new RegExp(
		`<meta\\s+[^>]*${attribute}=["']${attributeValue}["'][^>]*content=["']([^"']*)["'][^>]*>`,
		'i',
	);
	const second = new RegExp(
		`<meta\\s+[^>]*content=["']([^"']*)["'][^>]*${attribute}=["']${attributeValue}["'][^>]*>`,
		'i',
	);
	return String(html).match(first)?.[1] ?? String(html).match(second)?.[1];
}

export function transformMoneyRankingHtml(html, target) {
	let output = String(html);

	output = output.replace(
		/<title>[\s\S]*?<\/title>/i,
		`<title>${escapeHtmlText(target.title)}</title>`,
	);
	output = replaceMetaContent(output, { attribute: 'name', attributeValue: 'description' }, target.description);
	output = replaceMetaContent(output, { attribute: 'property', attributeValue: 'og:title' }, target.title);
	output = replaceMetaContent(output, { attribute: 'property', attributeValue: 'og:description' }, target.description);
	output = replaceMetaContent(output, { attribute: 'name', attributeValue: 'twitter:title' }, target.title);
	output = replaceMetaContent(output, { attribute: 'name', attributeValue: 'twitter:description' }, target.description);

	output = output.replace(
		/<h1\b([^>]*)>[\s\S]*?<\/h1>/i,
		`<h1$1>${escapeHtmlText(target.h1)}</h1>`,
	);

	return output;
}

export function inspectMoneyRankingHtml(html) {
	return {
		title: String(html).match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim(),
		description: readMetaContent(html, 'name', 'description'),
		ogTitle: readMetaContent(html, 'property', 'og:title'),
		ogDescription: readMetaContent(html, 'property', 'og:description'),
		twitterTitle: readMetaContent(html, 'name', 'twitter:title'),
		twitterDescription: readMetaContent(html, 'name', 'twitter:description'),
		h1: String(html).match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, '').trim(),
		h1Count: (String(html).match(/<h1\b/gi) ?? []).length,
		canonical: String(html).match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)?.[1]
			?? String(html).match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i)?.[1],
	};
}

export function assertMoneyRankingOutput(html, target) {
	const report = inspectMoneyRankingHtml(html);
	const failures = [];
	if (report.title !== target.title) failures.push(`title=${report.title ?? 'missing'}`);
	if (report.description !== target.description) failures.push('meta-description-mismatch');
	if (report.ogTitle !== target.title) failures.push('og-title-mismatch');
	if (report.ogDescription !== target.description) failures.push('og-description-mismatch');
	if (report.twitterTitle !== target.title) failures.push('twitter-title-mismatch');
	if (report.twitterDescription !== target.description) failures.push('twitter-description-mismatch');
	if (report.h1 !== target.h1) failures.push(`h1=${report.h1 ?? 'missing'}`);
	if (report.h1Count !== 1) failures.push(`h1-count=${report.h1Count}`);
	if (!report.canonical?.endsWith(target.pathname)) failures.push(`canonical=${report.canonical ?? 'missing'}`);
	if (failures.length > 0) {
		throw new Error(`${target.pathname}: ${failures.join(', ')}`);
	}
	return report;
}
