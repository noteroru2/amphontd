import fs from 'node:fs';
import path from 'node:path';
import { P5_RANKING_TARGETS } from './static-money-ranking-contract.mjs';
import { MONEY_OWNERSHIP_HOLD_SLUGS } from '../src/lib/money-query-ownership.mjs';

const failures = [];
function check(condition, message) {
	if (!condition) failures.push(message);
}

const baselinePath = path.resolve('observations/p6-baseline.json');
const markerPath = path.resolve('public/recovery-gate.json');
const packagePath = path.resolve('package.json');
const startPath = path.resolve('scripts/start.mjs');

check(fs.existsSync(baselinePath), 'missing observations/p6-baseline.json');
check(fs.existsSync(markerPath), 'missing public/recovery-gate.json');

const baseline = fs.existsSync(baselinePath) ? JSON.parse(fs.readFileSync(baselinePath, 'utf8')) : {};
const marker = fs.existsSync(markerPath) ? JSON.parse(fs.readFileSync(markerPath, 'utf8')) : {};
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const startSource = fs.readFileSync(startPath, 'utf8');

check(baseline.batch === 'P6', 'baseline batch must be P6');
check(baseline.sourceCommit === '3921593ab23f33e2da82f8e101bcbe6a287a9182', 'baseline source commit must be immutable P5 SHA');
check(baseline.gsc?.property === 'sc-domain:amphontd.com', 'GSC property mismatch');
check(baseline.gsc?.finalizedThrough === '2026-09-06', 'GSC finalized date mismatch');
check(baseline.gsc?.current28d?.clicks === 380, 'current28d clicks baseline changed');
check(baseline.gsc?.current28d?.impressions === 8637, 'current28d impressions baseline changed');
check(baseline.gsc?.previous28d?.clicks === 804, 'previous28d clicks baseline changed');
check(baseline.gsc?.previous28d?.impressions === 16242, 'previous28d impressions baseline changed');
check(baseline.productionEvidence?.verdict === 'WAIT_FOR_DEPLOY_OR_RECRAWL', 'initial P6 production verdict must stay immutable');
check(baseline.observation?.clockActive === false, 'observation clock must not start before live PASS');
check(baseline.observation?.minimumNewFinalizedDaysAfterLivePass === 7, 'minimum observation days must be 7');

check(marker.batch === 'P6', 'deployment marker batch mismatch');
check(marker.includesThrough === 'P5', 'deployment marker must include through P5');
check(marker.sourceCommit === baseline.sourceCommit, 'deployment marker source commit must match baseline');
check(marker.baselineFinalizedGscDate === baseline.gsc?.finalizedThrough, 'deployment marker GSC date mismatch');

check(P5_RANKING_TARGETS.length === 4, `expected 4 P5 ranking targets, found ${P5_RANKING_TARGETS.length}`);
for (const pathname of ['/rab-sue-macbook/', '/rab-sue-ipad/', '/rab-sue-com/', '/rab-sue-iphone/']) {
	check(P5_RANKING_TARGETS.some((item) => item.pathname === pathname), `missing P5 target ${pathname}`);
}
check(MONEY_OWNERSHIP_HOLD_SLUGS.get('รับซื้อเมืองเลย') === 'money_query_owner_conflict', 'P5 ownership hold override missing');

check(packageJson.scripts?.['audit:p6-observation'] === 'node scripts/qa-p6-observation.mjs', 'audit:p6-observation script missing');
check(packageJson.scripts?.['verify:p6-production'] === 'node scripts/p6-production-gate.mjs', 'verify:p6-production script missing');
check(packageJson.scripts?.['qa:p6'], 'qa:p6 script missing');
check(packageJson.scripts?.['qa:p6']?.includes('qa:p5'), 'qa:p6 must preserve the P0-P5 gate chain');
check(startSource.includes("max-age=0, must-revalidate"), 'HTML cache policy must revalidate so production cannot stay pinned to old HTML');

if (failures.length > 0) {
	console.error('P6 observation gate: FAIL');
	for (const failure of failures) console.error(`- ${failure}`);
	process.exit(1);
}

const current = baseline.gsc.current28d;
const previous = baseline.gsc.previous28d;
const clickDeltaPct = ((current.clicks - previous.clicks) / previous.clicks) * 100;
const impressionDeltaPct = ((current.impressions - previous.impressions) / previous.impressions) * 100;

console.log('P6 observation gate: PASS');
console.log(`GSC finalized through: ${baseline.gsc.finalizedThrough}`);
console.log(`28d clicks: ${previous.clicks} -> ${current.clicks} (${clickDeltaPct.toFixed(2)}%)`);
console.log(`28d impressions: ${previous.impressions} -> ${current.impressions} (${impressionDeltaPct.toFixed(2)}%)`);
console.log(`Initial production verdict: ${baseline.productionEvidence.verdict}`);
console.log('Observation clock: INACTIVE until verify:p6-production returns PASS');
