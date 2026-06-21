import fs from 'node:fs';
import path from 'node:path';

const pages = [
	{
		slug: 'fixmobile-ubon',
		dir: 'fixmobile-ubon',
		titleIncludes: 'รับซ่อมมือถืออุบล ตีราคาก่อนซ่อม',
		descIncludes: 'รับซ่อมมือถืออุบล ทุกยี่ห้อ',
		h1Max: 1,
		introCta: 'มือถือเสียในอุบล',
	},
	{
		slug: 'fix-notebook-ubon',
		dir: 'fix-notebook-ubon',
		titleIncludes: 'รับซ่อมโน๊ตบุ๊คอุบล เช็คฟรี',
		descIncludes: 'รับซ่อมโน๊ตบุ๊คอุบล ทุกอาการ',
		h1Max: 1,
		introCta: 'โน๊ตบุ๊คเปิดไม่ติด',
	},
	{
		slug: 'รับซื้อคอมพิษณุโลก',
		dir: 'รับซื้อคอมพิษณุโลก',
		titleIncludes: 'รับซื้อคอมพิษณุโลก ถึงบ้าน',
		descIncludes: 'รับซื้อคอมพิษณุโลก คอม PC',
		h1Max: 1,
		introCta: 'อยากขายคอมในพิษณุโลก',
	},
];

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
	const canonical = html.match(/rel="canonical" href="([^"]*)"/i)?.[1] ?? '';
	const h1Count = (html.match(/<h1\b/gi) ?? []).length;

	const checks = [
		['title', title.includes(page.titleIncludes), title],
		['description', desc.includes(page.descIncludes.slice(0, 20)), `${desc.slice(0, 80)}...`],
		['robots index', robots.includes('index') && !robots.includes('noindex'), robots],
		['canonical slug', canonical.includes(`/${page.dir}/`), canonical],
		['single H1', h1Count === page.h1Max, `h1 count=${h1Count}`],
		['intro CTA', html.includes(page.introCta), page.introCta],
		['no meta refresh redirect', !/<meta[^>]+http-equiv=["']refresh/i.test(html), 'ok'],
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
