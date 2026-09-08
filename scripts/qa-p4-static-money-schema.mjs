import fs from 'node:fs';
import path from 'node:path';
import {
	STATIC_MONEY_PAGES,
	assertStaticMoneyOutput,
	transformStaticMoneyHtml,
} from './static-money-schema-contract.mjs';

const failures = [];
function check(condition, message) {
	if (!condition) failures.push(message);
}

const fixture = `<!doctype html><html><head>
<link rel="canonical" href="https://amphontd.com/rab-sue-notebook/">
<meta property="og:type" content="article">
<meta property="article:published_time" content="2026-01-01">
<meta property="article:modified_time" content="2026-02-01">
<meta property="article:author" content="AMPHON TRADING">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"legacy"}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[]}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"HowTo","name":"legacy"}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Service","name":"รับซื้อโน๊ตบุ๊ค","provider":{"@type":"Organization","name":"old"},"areaServed":[{"@type":"AdministrativeArea","name":"อุบลราชธานี"}]}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[]}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","@id":"https://amphontd.com/rab-sue-notebook/#webpage"}</script>
</head><body></body></html>`;

try {
	const transformed = transformStaticMoneyHtml(fixture, STATIC_MONEY_PAGES[0]);
	assertStaticMoneyOutput(transformed, STATIC_MONEY_PAGES[0]);
	check(transformed.includes('https://amphontd.com/#organization'), 'normalized Service provider @id is missing');
	check(transformed.includes('https://amphontd.com/rab-sue-notebook/#service'), 'normalized Service @id is missing');
	check(transformed.includes('https://amphontd.com/rab-sue-notebook/#webpage'), 'Service mainEntityOfPage/WebPage link is missing');
} catch (error) {
	failures.push(`fixture transform failed: ${error.message}`);
}

for (const page of STATIC_MONEY_PAGES) {
	const sourcePath = path.resolve(page.source);
	check(fs.existsSync(sourcePath), `missing source ${page.source}`);
	if (!fs.existsSync(sourcePath)) continue;
	const source = fs.readFileSync(sourcePath, 'utf8');
	check(source.includes('<BaseLayout'), `${page.source}: BaseLayout missing`);
	check(source.includes(`pathname="${page.pathname}"`) || source.includes(`pathname='${page.pathname}'`), `${page.source}: pathname contract missing`);
	check(/['"]@type['"]\s*:\s*['"]Service['"]/.test(source), `${page.source}: Service schema missing`);
	check(/['"]@type['"]\s*:\s*['"]BreadcrumbList['"]/.test(source), `${page.source}: BreadcrumbList schema missing`);
}

const packageJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));
check(packageJson.scripts?.build?.includes('postbuild:p4'), 'package build does not run postbuild:p4');
check(packageJson.scripts?.['postbuild:p4']?.includes('postbuild-static-money-schema.mjs'), 'postbuild:p4 does not run P4 normalizer');
check(packageJson.scripts?.['audit:p4-static-money-schema'], 'audit:p4-static-money-schema script missing');
check(packageJson.scripts?.['audit:p4-dist'], 'audit:p4-dist script missing');
check(packageJson.scripts?.['qa:p4'], 'qa:p4 script missing');

if (process.argv.includes('--dist')) {
	for (const page of STATIC_MONEY_PAGES) {
		const htmlPath = path.resolve('dist', page.slug, 'index.html');
		check(fs.existsSync(htmlPath), `dist missing ${page.pathname}`);
		if (!fs.existsSync(htmlPath)) continue;
		try {
			assertStaticMoneyOutput(fs.readFileSync(htmlPath, 'utf8'), page);
		} catch (error) {
			failures.push(`dist ${error.message}`);
		}
	}
}

if (failures.length > 0) {
	console.error('P4 static money schema audit: FAIL');
	for (const failure of failures) console.error(`- ${failure}`);
	process.exit(1);
}

console.log(`P4 static money schema audit: PASS (${STATIC_MONEY_PAGES.length} money pages)`);
