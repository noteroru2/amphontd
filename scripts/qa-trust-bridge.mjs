import fs from 'node:fs';
import path from 'node:path';

const pages = [
	{
		slug: 'fixmobile-ubon',
		dir: 'fixmobile-ubon',
		titleIncludes: 'ซ่อมมือถือ อุบล เช็กอาการก่อนซ่อม',
		descIncludes: 'บริการซ่อมมือถือในอุบล',
		bridgeIncludes: 'trust-bridge',
		linkChecks: [
			{ href: 'https://amphon.co.th/', label: 'ร้านอำพล เทรดดิ้ง อุบลราชธานี' },
			{ href: 'https://ร้านรับซื้อไอโฟน.com/', label: 'ร้านรับซื้อไอโฟน.com' },
		],
	},
	{
		slug: 'fix-notebook-ubon',
		dir: 'fix-notebook-ubon',
		titleIncludes: 'ซ่อมโน๊ตบุ๊ค อุบล เช็กอาการก่อนซ่อม',
		descIncludes: 'บริการซ่อมโน๊ตบุ๊คในอุบล',
		bridgeIncludes: 'trust-bridge',
		linkChecks: [
			{ href: 'https://amphon.co.th/', label: 'AMPHON TRADING' },
			{ href: 'https://ร้านรับซื้อโน๊ตบุ๊ค.com/', label: 'ร้านรับซื้อโน๊ตบุ๊ค.com' },
		],
	},
];

let failed = 0;

for (const page of pages) {
	const filePath = path.join('dist', page.dir, 'index.html');
	console.log(`--- Trust bridge QA: ${page.slug} ---`);

	if (!fs.existsSync(filePath)) {
		console.log(`FAIL: missing ${filePath}`);
		failed += 1;
		continue;
	}

	const html = fs.readFileSync(filePath, 'utf8');
	const title = html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? '';
	const desc = html.match(/name="description" content="([^"]*)"/i)?.[1] ?? '';
	const robots = html.match(/name="robots" content="([^"]*)"/i)?.[1] ?? '';
	const bridgeCount = (html.match(/class="trust-bridge"/g) ?? []).length;

	const checks = [
		['title unchanged', title.includes(page.titleIncludes), title],
		['description unchanged', desc.includes(page.descIncludes.slice(0, 20)), desc],
		['robots index', robots.includes('index') && !robots.includes('noindex'), robots],
		['single bridge paragraph', bridgeCount === 1, `count=${bridgeCount}`],
		['bridge class present', html.includes(page.bridgeIncludes), page.bridgeIncludes],
		...page.linkChecks.map((link) => [
			`link ${link.label}`,
			html.includes(link.href) && html.includes(`>${link.label}</a>`),
			link.href,
		]),
	];

	for (const [name, ok, detail] of checks) {
		console.log(`${ok ? 'PASS' : 'FAIL'}: ${name} - ${detail}`);
		if (!ok) failed += 1;
	}
}

console.log('');
console.log('--- URL reachability ---');
const urls = [
	'https://amphon.co.th/',
	'https://ร้านรับซื้อไอโฟน.com/',
	'https://ร้านรับซื้อโน๊ตบุ๊ค.com/',
];

for (const url of urls) {
	try {
		const response = await fetch(url, { method: 'GET', redirect: 'follow' });
		const ok = response.ok;
		console.log(`${ok ? 'PASS' : 'FAIL'}: ${url} -> ${response.status}`);
		if (!ok) failed += 1;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.log(`FAIL: ${url} - ${message}`);
		failed += 1;
	}
}

console.log('');
if (failed === 0) {
	console.log('TRUST BRIDGE QA PASSED');
} else {
	console.log(`TRUST BRIDGE QA FAILED (${failed} checks)`);
	process.exitCode = 1;
}
