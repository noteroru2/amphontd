import fs from 'node:fs';
import path from 'node:path';

const pages = [
	{
		slug: 'fixmobile-ubon',
		dir: 'fixmobile-ubon',
		titleIncludes: 'ซ่อมมือถือ อุบล เช็กอาการก่อนซ่อม',
		descIncludes: 'บริการซ่อมมือถือในอุบล',
		introIncludes: 'หากมือถือมีอาการจอแตก',
		ctaIncludes: 'ส่งอาการมือถือและรูปเครื่อง',
		linkIncludes: ['/fix-notebook-ubon/', '/contact/', 'amphon.co.th'],
		h1Max: 1,
	},
	{
		slug: 'fix-notebook-ubon',
		dir: 'fix-notebook-ubon',
		titleIncludes: 'ซ่อมโน๊ตบุ๊ค อุบล เช็กอาการก่อนซ่อม',
		descIncludes: 'บริการซ่อมโน๊ตบุ๊คในอุบล',
		introIncludes: 'หากโน๊ตบุ๊คมีอาการเปิดไม่ติด',
		ctaIncludes: 'ส่งรุ่นโน๊ตบุ๊คและอาการเสีย',
		linkIncludes: ['/fixmobile-ubon/', 'amphon.co.th', '/rab-sue-notebook/'],
		h1Max: 1,
	},
	{
		slug: 'รับซื้อคอมพิษณุโลก',
		dir: 'รับซื้อคอมพิษณุโลก',
		titleIncludes: 'รับซื้อคอม พิษณุโลก ส่งรูปประเมินราคา',
		descIncludes: 'รับซื้อคอมพิวเตอร์มือสองในพิษณุโลก',
		introIncludes: 'หากต้องการขายคอมพิวเตอร์',
		ctaIncludes: 'ส่งรูปคอมและสเปกเพื่อประเมินราคาก่อนขาย',
		linkIncludes: ['amphon.co.th', '/computer-auction/', '/evaluate-price/'],
		h1Max: 1,
	},
	{
		slug: 'รับซื้อคอมภูเก็ต',
		dir: 'รับซื้อคอมภูเก็ต',
		titleIncludes: 'รับซื้อคอม ภูเก็ต ประเมินตามสเปก',
		descIncludes: 'รับซื้อคอมพิวเตอร์และคอมประกอบในภูเก็ต',
		introIncludes: 'สำหรับผู้ที่อยู่ภูเก็ต',
		ctaIncludes: 'ส่งรูปคอม สเปก และอุปกรณ์ที่มี',
		linkIncludes: ['amphon.co.th', '/rab-sue-com/', '/contact/'],
		h1Max: 1,
	},
];

const banned = ['อันดับ 1', 'ราคาสูงสุด', 'ดีที่สุด', 'รับทุกรุ่น', 'รับทุกสภาพ'];

let failed = 0;

for (const page of pages) {
	const filePath = path.join('dist', page.dir, 'index.html');
	console.log(`--- QA: ${page.slug} ---`);

	if (!fs.existsSync(filePath)) {
		console.log(`FAIL: missing ${filePath}`);
		failed += 1;
		continue;
	}

	const html = fs.readFileSync(filePath, 'utf8');
	const title = html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? '';
	const desc = html.match(/name="description" content="([^"]*)"/i)?.[1] ?? '';
	const robots = html.match(/name="robots" content="([^"]*)"/i)?.[1] ?? '';
	const h1Count = (html.match(/<h1\b/gi) ?? []).length;

	const checks = [
		['title', title.includes(page.titleIncludes), title],
		['description', desc.includes(page.descIncludes.slice(0, 20)), desc],
		['robots index', robots.includes('index') && !robots.includes('noindex'), robots],
		['single H1', h1Count === page.h1Max, `h1 count=${h1Count}`],
		['intro', html.includes(page.introIncludes), page.introIncludes],
		['CTA', html.includes(page.ctaIncludes), page.ctaIncludes],
		...page.linkIncludes.map((link) => [
			`link ${link}`,
			html.includes(link),
			link,
		]),
		[
			'banned words absent',
			!banned.some((word) => title.includes(word) || desc.includes(word) || html.slice(0, 4000).includes(word)),
			'checked intro/meta',
		],
	];

	for (const [name, ok, detail] of checks) {
		console.log(`${ok ? 'PASS' : 'FAIL'}: ${name} - ${detail}`);
		if (!ok) failed += 1;
	}
}

console.log('');
if (failed === 0) {
	console.log('QA PASSED');
} else {
	console.log(`QA FAILED (${failed} checks)`);
	process.exitCode = 1;
}
