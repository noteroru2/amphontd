import fs from 'node:fs';
import path from 'node:path';
import {
	MONEY_QUERY_OWNERS,
	P5_RANKING_TARGETS,
	assertMoneyRankingOutput,
	transformMoneyRankingHtml,
} from './static-money-ranking-contract.mjs';
import {
	MONEY_OWNERSHIP_HOLD_SLUGS,
	applyMoneyOwnershipOverrides,
} from '../src/lib/money-query-ownership.mjs';

const failures = [];
function check(condition, message) {
	if (!condition) failures.push(message);
}

const fixture = `<!doctype html><html><head>
<title>Legacy title</title>
<meta name="description" content="Legacy description">
<meta property="og:title" content="Legacy title">
<meta property="og:description" content="Legacy description">
<meta name="twitter:title" content="Legacy title">
<meta name="twitter:description" content="Legacy description">
<link rel="canonical" href="https://amphontd.com/rab-sue-macbook/">
</head><body><h1><span>Legacy H1</span></h1></body></html>`;

try {
	const target = P5_RANKING_TARGETS[0];
	const transformed = transformMoneyRankingHtml(fixture, target);
	assertMoneyRankingOutput(transformed, target);
} catch (error) {
	failures.push(`fixture transform failed: ${error.message}`);
}

const ownerPaths = new Set();
const queryOwner = new Map();
for (const owner of MONEY_QUERY_OWNERS) {
	check(!ownerPaths.has(owner.pathname), `duplicate money owner path ${owner.pathname}`);
	ownerPaths.add(owner.pathname);
	for (const term of owner.terms) {
		const normalized = term.toLocaleLowerCase('th').replace(/\s+/g, ' ').trim();
		const existing = queryOwner.get(normalized);
		check(!existing || existing === owner.pathname, `query "${term}" has multiple owners: ${existing}, ${owner.pathname}`);
		queryOwner.set(normalized, owner.pathname);
	}
}

const targetSlugs = new Set();
for (const target of P5_RANKING_TARGETS) {
	check(!targetSlugs.has(target.slug), `duplicate P5 target ${target.slug}`);
	targetSlugs.add(target.slug);
	check(ownerPaths.has(target.pathname), `${target.pathname} missing from MONEY_QUERY_OWNERS`);
	check(target.title.length <= 80, `${target.pathname} title is too long (${target.title.length})`);
	check(target.description.length >= 80 && target.description.length <= 190, `${target.pathname} description length ${target.description.length}`);
	check(!/ใกล้ฉัน/i.test(target.title), `${target.pathname} money title should not own local "ใกล้ฉัน" intent`);
	check(!/ใกล้ฉัน/i.test(target.h1), `${target.pathname} money H1 should not own local "ใกล้ฉัน" intent`);
}

check(MONEY_OWNERSHIP_HOLD_SLUGS.get('รับซื้อเมืองเลย') === 'money_query_owner_conflict', 'GSC-proven ownership conflict /รับซื้อเมืองเลย/ is not held');
const syntheticPolicy = new Map([
	['รับซื้อเมืองเลย', { lifecycle: 'INDEX', reason: 'aligned_unique_content' }],
	['keep-me', { lifecycle: 'INDEX', reason: 'aligned_unique_content' }],
]);
const overriddenPolicy = applyMoneyOwnershipOverrides(syntheticPolicy);
check(overriddenPolicy.get('รับซื้อเมืองเลย')?.lifecycle === 'HOLD_NOINDEX', 'ownership override does not HOLD the conflict page');
check(overriddenPolicy.get('รับซื้อเมืองเลย')?.reason === 'money_query_owner_conflict', 'ownership override reason mismatch');
check(overriddenPolicy.get('keep-me')?.lifecycle === 'INDEX', 'ownership override changed an unrelated page');

for (const integrationPath of ['src/lib/posts.ts', 'astro.config.mjs']) {
	const sourcePath = path.resolve(integrationPath);
	check(fs.existsSync(sourcePath), `${integrationPath} missing`);
	if (!fs.existsSync(sourcePath)) continue;
	const source = fs.readFileSync(sourcePath, 'utf8');
	check(source.includes('applyMoneyOwnershipOverrides'), `${integrationPath} does not apply the P5 ownership override`);
}

const packageJson = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));
check(packageJson.scripts?.['postbuild:p5']?.includes('postbuild-money-ranking.mjs'), 'postbuild:p5 script missing');
check(packageJson.scripts?.build?.indexOf('postbuild:p4') < packageJson.scripts?.build?.indexOf('postbuild:p5'), 'build must run P4 before P5');
check(packageJson.scripts?.build?.includes('postbuild:p5'), 'build does not run P5 postbuild');
check(packageJson.scripts?.['audit:p5-money-ranking'], 'audit:p5-money-ranking script missing');
check(packageJson.scripts?.['audit:p5-dist'], 'audit:p5-dist script missing');
check(packageJson.scripts?.['qa:p5'], 'qa:p5 script missing');

if (process.argv.includes('--dist')) {
	for (const target of P5_RANKING_TARGETS) {
		const htmlPath = path.resolve('dist', target.slug, 'index.html');
		check(fs.existsSync(htmlPath), `dist missing ${target.pathname}`);
		if (!fs.existsSync(htmlPath)) continue;
		try {
			assertMoneyRankingOutput(fs.readFileSync(htmlPath, 'utf8'), target);
		} catch (error) {
			failures.push(`dist ${error.message}`);
		}
	}
}

if (failures.length > 0) {
	console.error('P5 money ranking audit: FAIL');
	for (const failure of failures) console.error(`- ${failure}`);
	process.exit(1);
}

console.log(`P5 money ranking audit: PASS (${P5_RANKING_TARGETS.length} optimized money pages, ${MONEY_QUERY_OWNERS.length} query owners)`);
