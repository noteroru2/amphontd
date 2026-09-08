import { P5_RANKING_TARGETS, assertMoneyRankingOutput } from './static-money-ranking-contract.mjs';
import { STATIC_MONEY_PAGES, assertStaticMoneyOutput } from './static-money-schema-contract.mjs';

const BASE_URL = (process.env.P6_BASE_URL ?? 'https://amphontd.com').replace(/\/+$/, '');
const EXPECTED_SOURCE_COMMIT = '3921593ab23f33e2da82f8e101bcbe6a287a9182';
const USER_AGENT = 'AMPHON-P6-Production-Gate/1.0';
const checks = [];
const waitReasons = [];
const criticalReasons = [];

function pushCheck(name, status, detail = '') {
	checks.push({ name, status, detail });
}

async function get(pathname, options = {}) {
	const url = new URL(pathname, `${BASE_URL}/`);
	const response = await fetch(url, {
		redirect: options.redirect ?? 'follow',
		headers: {
			'User-Agent': USER_AGENT,
			'Cache-Control': 'no-cache',
			Pragma: 'no-cache',
		},
		signal: AbortSignal.timeout(Number(process.env.P6_FETCH_TIMEOUT_MS ?? 12000)),
	});
	return {
		url: url.toString(),
		status: response.status,
		headers: response.headers,
		body: await response.text(),
	};
}

function normalizeText(value) {
	return String(value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function readH1(html) {
	return normalizeText(String(html).match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]);
}

function hasNoindex(html) {
	const robots = String(html).match(/<meta\s+[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i)?.[1]
		?? String(html).match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']robots["'][^>]*>/i)?.[1]
		?? '';
	return robots.toLowerCase().includes('noindex');
}

async function verifyMarker() {
	try {
		const result = await get('/recovery-gate.json');
		if (result.status !== 200) {
			waitReasons.push(`deployment marker status ${result.status}`);
			pushCheck('deployment-marker', 'WAIT', `HTTP ${result.status}`);
			return;
		}
		const marker = JSON.parse(result.body);
		if (marker.batch !== 'P6' || marker.includesThrough !== 'P5' || marker.sourceCommit !== EXPECTED_SOURCE_COMMIT) {
			waitReasons.push('deployment marker does not match the P6/P5 recovery fingerprint');
			pushCheck('deployment-marker', 'WAIT', JSON.stringify(marker));
			return;
		}
		pushCheck('deployment-marker', 'PASS', marker.sourceCommit);
	} catch (error) {
		waitReasons.push(`deployment marker unavailable: ${error.message}`);
		pushCheck('deployment-marker', 'WAIT', error.message);
	}
}

async function verifyRobots() {
	try {
		const result = await get('/robots.txt');
		if (result.status !== 200) {
			criticalReasons.push(`robots.txt HTTP ${result.status}`);
			pushCheck('robots', 'NO_GO', `HTTP ${result.status}`);
			return;
		}
		if (/Disallow:\s*\/\s*$/im.test(result.body)) {
			criticalReasons.push('robots.txt blocks the whole site');
			pushCheck('robots', 'NO_GO', 'site-wide Disallow found');
			return;
		}
		const ok = /User-agent:\s*\*/i.test(result.body) && /Allow:\s*\//i.test(result.body) && /Sitemap:/i.test(result.body);
		if (!ok) {
			criticalReasons.push('robots.txt is missing expected allow/sitemap directives');
			pushCheck('robots', 'NO_GO', 'expected directives missing');
			return;
		}
		pushCheck('robots', 'PASS');
	} catch (error) {
		criticalReasons.push(`robots check failed: ${error.message}`);
		pushCheck('robots', 'NO_GO', error.message);
	}
}

async function verifyMoneyPages() {
	for (const target of P5_RANKING_TARGETS) {
		let result;
		try {
			result = await get(target.pathname);
		} catch (error) {
			criticalReasons.push(`${target.pathname} fetch failed: ${error.message}`);
			pushCheck(`money:${target.pathname}`, 'NO_GO', error.message);
			continue;
		}
		if (result.status >= 500 || result.status === 0) {
			criticalReasons.push(`${target.pathname} HTTP ${result.status}`);
			pushCheck(`money:${target.pathname}`, 'NO_GO', `HTTP ${result.status}`);
			continue;
		}
		if (result.status !== 200) {
			waitReasons.push(`${target.pathname} returned HTTP ${result.status}`);
			pushCheck(`money:${target.pathname}`, 'WAIT', `HTTP ${result.status}`);
			continue;
		}

		const detail = [];
		try {
			assertMoneyRankingOutput(result.body, target);
			detail.push('P5 ranking fingerprint PASS');
		} catch (error) {
			waitReasons.push(`${target.pathname} is still serving pre-P5 ranking output`);
			detail.push(`P5 WAIT: ${error.message}`);
		}

		const page = STATIC_MONEY_PAGES.find((item) => item.pathname === target.pathname);
		if (page) {
			try {
				assertStaticMoneyOutput(result.body, page);
				detail.push('P4 schema contract PASS');
			} catch (error) {
				waitReasons.push(`${target.pathname} is still serving pre-P4 schema output`);
				detail.push(`P4 WAIT: ${error.message}`);
			}
		}

		pushCheck(`money:${target.pathname}`, detail.every((item) => item.includes('PASS')) ? 'PASS' : 'WAIT', detail.join(' | '));
	}
}

async function verifyServiceHubs() {
	const targets = [
		['/services/', 'รวมบริการรับซื้อสินค้าไอที แยกตามหมวดและพื้นที่'],
		['/services/macbook/', 'รับซื้อ MacBook'],
	];
	for (const [pathname, expectedH1Part] of targets) {
		try {
			const result = await get(pathname);
			if (result.status >= 500) {
				criticalReasons.push(`${pathname} HTTP ${result.status}`);
				pushCheck(`hub:${pathname}`, 'NO_GO', `HTTP ${result.status}`);
				continue;
			}
			const h1 = readH1(result.body);
			if (result.status !== 200 || !h1.toLowerCase().includes(expectedH1Part.toLowerCase())) {
				waitReasons.push(`${pathname} P3 hub fingerprint is not live`);
				pushCheck(`hub:${pathname}`, 'WAIT', `HTTP ${result.status}, H1=${h1 || 'missing'}`);
				continue;
			}
			pushCheck(`hub:${pathname}`, 'PASS', h1);
		} catch (error) {
			waitReasons.push(`${pathname} unavailable: ${error.message}`);
			pushCheck(`hub:${pathname}`, 'WAIT', error.message);
		}
	}
}

async function verifyOwnershipSignals() {
	try {
		const hold = await get('/รับซื้อเมืองเลย/');
		if (hold.status >= 500) {
			criticalReasons.push(`/รับซื้อเมืองเลย/ HTTP ${hold.status}`);
			pushCheck('ownership-hold', 'NO_GO', `HTTP ${hold.status}`);
		} else if (hold.status === 200 && hasNoindex(hold.body)) {
			pushCheck('ownership-hold', 'PASS', 'HOLD_NOINDEX live');
		} else {
			waitReasons.push('/รับซื้อเมืองเลย/ is not yet serving the P5 noindex ownership override');
			pushCheck('ownership-hold', 'WAIT', `HTTP ${hold.status}, noindex=${hasNoindex(hold.body)}`);
		}
	} catch (error) {
		waitReasons.push(`ownership hold check unavailable: ${error.message}`);
		pushCheck('ownership-hold', 'WAIT', error.message);
	}

	try {
		const redirect = await get('/รับซื้อโน๊ตบุ๊คมือสอง-46/', { redirect: 'manual' });
		const location = redirect.headers.get('location') ?? '';
		const valid = [301, 308].includes(redirect.status) && new URL(location, `${BASE_URL}/`).pathname === '/rab-sue-notebook/';
		if (valid) {
			pushCheck('duplicate-redirect', 'PASS', `${redirect.status} -> ${location}`);
		} else if (redirect.status >= 500) {
			criticalReasons.push(`duplicate redirect HTTP ${redirect.status}`);
			pushCheck('duplicate-redirect', 'NO_GO', `HTTP ${redirect.status}, location=${location}`);
		} else {
			waitReasons.push('P1 duplicate redirect is not yet live');
			pushCheck('duplicate-redirect', 'WAIT', `HTTP ${redirect.status}, location=${location}`);
		}
	} catch (error) {
		waitReasons.push(`duplicate redirect check unavailable: ${error.message}`);
		pushCheck('duplicate-redirect', 'WAIT', error.message);
	}
}

function extractLocs(xml) {
	return [...String(xml).matchAll(/<loc>([^<]+)<\/loc>/gi)].map((match) => match[1].trim());
}

async function verifySitemap() {
	try {
		let sitemap = await get('/sitemap-index.xml');
		let combined = sitemap.body;
		if (sitemap.status === 200) {
			const locs = extractLocs(sitemap.body);
			if (locs.length > 0) {
				for (const loc of locs.slice(0, 20)) {
					try {
						const child = await get(new URL(loc).pathname);
						if (child.status === 200) combined += `\n${child.body}`;
					} catch {}
				}
			}
		} else {
			sitemap = await get('/sitemap-0.xml');
			combined = sitemap.body;
		}

		if (sitemap.status !== 200) {
			criticalReasons.push(`sitemap HTTP ${sitemap.status}`);
			pushCheck('sitemap', 'NO_GO', `HTTP ${sitemap.status}`);
			return;
		}

		const decoded = decodeURIComponent(combined);
		const required = ['/services/', '/services/macbook/', '/rab-sue-macbook/', '/rab-sue-ipad/', '/rab-sue-com/', '/rab-sue-iphone/'];
		const missing = required.filter((pathname) => !decoded.includes(pathname));
		const containsHold = decoded.includes('/รับซื้อเมืองเลย/');
		if (missing.length > 0 || containsHold) {
			waitReasons.push('sitemap does not yet reflect the P3/P5 index surface');
			pushCheck('sitemap', 'WAIT', `missing=${missing.join(',') || 'none'}, containsHold=${containsHold}`);
			return;
		}
		pushCheck('sitemap', 'PASS');
	} catch (error) {
		criticalReasons.push(`sitemap check failed: ${error.message}`);
		pushCheck('sitemap', 'NO_GO', error.message);
	}
}

await verifyMarker();
await verifyRobots();
await verifyMoneyPages();
await verifyServiceHubs();
await verifyOwnershipSignals();
await verifySitemap();

const verdict = criticalReasons.length > 0
	? 'NO_GO'
	: waitReasons.length > 0
		? 'WAIT_FOR_DEPLOY_OR_RECRAWL'
		: 'PASS';

const report = {
	batch: 'P6',
	baseUrl: BASE_URL,
	verdict,
	checkedAt: new Date().toISOString(),
	checks,
	waitReasons,
	criticalReasons,
	observationClockActive: verdict === 'PASS',
};

console.log(JSON.stringify(report, null, 2));
if (verdict === 'NO_GO') process.exit(1);
if (verdict !== 'PASS') process.exit(2);
