import fs from 'node:fs';
import path from 'node:path';
import {
	STATIC_MONEY_PAGES,
	assertStaticMoneyOutput,
	inspectStaticMoneyHtml,
	transformStaticMoneyHtml,
} from './static-money-schema-contract.mjs';

const distRoot = path.resolve('dist');
if (!fs.existsSync(distRoot)) {
	throw new Error('P4 postbuild: dist/ does not exist. Run Astro build first.');
}

const summaries = [];
for (const page of STATIC_MONEY_PAGES) {
	const htmlPath = path.join(distRoot, page.slug, 'index.html');
	if (!fs.existsSync(htmlPath)) {
		throw new Error(`P4 postbuild: missing built money page ${page.pathname}`);
	}

	const beforeHtml = fs.readFileSync(htmlPath, 'utf8');
	const before = inspectStaticMoneyHtml(beforeHtml);
	const afterHtml = transformStaticMoneyHtml(beforeHtml, page);
	fs.writeFileSync(htmlPath, afterHtml, 'utf8');
	const after = assertStaticMoneyOutput(afterHtml, page);

	summaries.push({
		page: page.pathname,
		before: before.counts,
		after: after.counts,
		ogType: after.ogType,
	});
}

console.log('P4 static money schema normalization: PASS');
for (const item of summaries) {
	console.log(
		`${item.page} Article ${item.before.Article}->${item.after.Article}, FAQ ${item.before.FAQPage}->${item.after.FAQPage}, HowTo ${item.before.HowTo}->${item.after.HowTo}, Service ${item.after.Service}, Breadcrumb ${item.after.BreadcrumbList}, WebPage ${item.after.WebPage}, og:type=${item.ogType}`,
	);
}
