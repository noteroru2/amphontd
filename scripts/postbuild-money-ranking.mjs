import fs from 'node:fs';
import path from 'node:path';
import {
	P5_RANKING_TARGETS,
	assertMoneyRankingOutput,
	inspectMoneyRankingHtml,
	transformMoneyRankingHtml,
} from './static-money-ranking-contract.mjs';

const distRoot = path.resolve('dist');
if (!fs.existsSync(distRoot)) {
	throw new Error('P5 postbuild: dist/ does not exist. Run the production build first.');
}

const summaries = [];
for (const target of P5_RANKING_TARGETS) {
	const htmlPath = path.join(distRoot, target.slug, 'index.html');
	if (!fs.existsSync(htmlPath)) {
		throw new Error(`P5 postbuild: missing built money page ${target.pathname}`);
	}

	const beforeHtml = fs.readFileSync(htmlPath, 'utf8');
	const before = inspectMoneyRankingHtml(beforeHtml);
	const afterHtml = transformMoneyRankingHtml(beforeHtml, target);
	fs.writeFileSync(htmlPath, afterHtml, 'utf8');
	const after = assertMoneyRankingOutput(afterHtml, target);

	summaries.push({
		page: target.pathname,
		beforeTitle: before.title,
		afterTitle: after.title,
		h1: after.h1,
	});
}

console.log('P5 money ranking normalization: PASS');
for (const item of summaries) {
	console.log(`${item.page} title="${item.afterTitle}" h1="${item.h1}"`);
}
