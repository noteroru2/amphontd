import postsData from '../data/local-posts.generated.json';

export interface InternalLink {
	href: string;
	label: string;
	external?: boolean;
}

export interface PostSeoOverride {
	title: string;
	description: string;
	leadingBlocksToReplace: number;
	introParagraphs: string[];
	cta: {
		text: string;
		href: string;
		external?: boolean;
	};
	internalLinks: InternalLink[];
	transformContent?: (html: string) => string;
}

const LINE_URL = 'https://line.me/R/ti/p/@webuy';
const AMPHON_URL = 'https://amphon.co.th';

const STATIC_ROUTE_SLUGS = new Set([
	'about',
	'contact',
	'evaluate-price',
	'rab-sue-com',
	'rab-sue-notebook',
	'rab-sue-iphone',
	'rab-sue-ipad',
	'rab-sue-macbook',
	'rab-sue-klong',
	'rab-sue-lamphong',
	'blog',
]);

const POST_SLUGS = new Set((postsData as Array<{ slug: string }>).map((post) => post.slug));

export function isValidInternalHref(href: string): boolean {
	if (!href.startsWith('/') || !href.endsWith('/')) return false;
	const slug = href.slice(1, -1);
	return STATIC_ROUTE_SLUGS.has(slug) || POST_SLUGS.has(slug);
}

function assertValidOverrideLinks(): void {
	for (const [slug, override] of Object.entries(POST_SEO_OVERRIDES)) {
		for (const link of override.internalLinks) {
			if (link.external) continue;
			if (!isValidInternalHref(link.href)) {
				throw new Error(
					`Invalid SEO internal link on /${slug}/: ${link.href} (page does not exist)`,
				);
			}
		}
	}
}

function demoteContentH1(html: string): string {
	return html.replace(/<h1\b/gi, '<h2').replace(/<\/h1>/gi, '</h2>');
}

function stripLeadingBlocks(html: string, count: number): string {
	let remaining = html.trimStart();
	let stripped = 0;

	while (stripped < count && remaining.length > 0) {
		const match = remaining.match(
			/^<(p|h[1-6]|div|blockquote|ul|ol|table)(?:\s[^>]*)?>[\s\S]*?<\/\1>/i,
		);
		if (!match) break;
		remaining = remaining.slice(match[0].length).trimStart();
		stripped += 1;
	}

	return remaining;
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function renderIntroBlock(override: PostSeoOverride): string {
	const paragraphs = override.introParagraphs
		.map((text) => `<p>${escapeHtml(text)}</p>`)
		.join('\n');

	const links = override.internalLinks
		.map((link) => {
			const rel = link.external ? ' rel="noopener noreferrer"' : '';
			const target = link.external ? ' target="_blank"' : '';
			return `<a href="${link.href}"${target}${rel}>${escapeHtml(link.label)}</a>`;
		})
		.join(' · ');

	const ctaRel = override.cta.external ? ' rel="noopener noreferrer"' : '';
	const ctaTarget = override.cta.external ? ' target="_blank"' : '';

	return [
		paragraphs,
		`<p class="seo-intro-links">${links}</p>`,
		`<p class="seo-intro-cta"><a href="${override.cta.href}"${ctaTarget}${ctaRel}><strong>${escapeHtml(override.cta.text)}</strong></a></p>`,
	].join('\n');
}

function patchIntro(html: string, override: PostSeoOverride): string {
	const rest = stripLeadingBlocks(html, override.leadingBlocksToReplace);
	return `${renderIntroBlock(override)}\n${rest}`;
}

const POST_SEO_OVERRIDES: Record<string, PostSeoOverride> = {
	'fixmobile-ubon': {
		title: 'ซ่อมมือถือ อุบล เช็กอาการก่อนซ่อมโดยช่างร้านจริง',
		description:
			'บริการซ่อมมือถือในอุบล เช็กอาการเบื้องต้นก่อนซ่อม แจ้งอาการ รุ่น และรูปเครื่องเพื่อประเมินแนวทางซ่อมได้',
		leadingBlocksToReplace: 3,
		introParagraphs: [
			'หากมือถือมีอาการจอแตก ชาร์จไม่เข้า แบตเสื่อม เครื่องค้าง หรือเปิดไม่ติด สามารถแจ้งรุ่นและอาการเบื้องต้นให้ร้านช่วยประเมินก่อนได้',
			'เหมาะสำหรับคนอุบลที่ต้องการเช็กแนวทางซ่อมก่อนนำเครื่องเข้าร้าน',
		],
		cta: {
			text: 'ส่งอาการมือถือและรูปเครื่องให้ช่างเช็กเบื้องต้น',
			href: LINE_URL,
			external: true,
		},
		internalLinks: [
			{ href: AMPHON_URL, label: 'AMPHON TRADING', external: true },
			{ href: '/fix-notebook-ubon/', label: 'ซ่อมโน๊ตบุ๊คอุบล' },
			{ href: '/contact/', label: 'ติดต่อร้าน' },
		],
	},
	'รับซื้อคอมพิษณุโลก': {
		title: 'รับซื้อคอม พิษณุโลก ส่งรูปประเมินราคา คุยรายละเอียดก่อนได้',
		description:
			'รับซื้อคอมพิวเตอร์มือสองในพิษณุโลก ประเมินตามสเปก สภาพ และอุปกรณ์ ส่งรูปเครื่องให้เช็กราคาก่อนขายได้',
		leadingBlocksToReplace: 2,
		introParagraphs: [
			'หากต้องการขายคอมพิวเตอร์ คอมประกอบ หรือคอมสำนักงานในพิษณุโลก สามารถส่งรูปเครื่องพร้อมสเปกเบื้องต้นเพื่อประเมินราคาก่อนตัดสินใจได้',
			'เหมาะกับทั้งเครื่องใช้งานส่วนตัวและเครื่องหลายรายการ',
		],
		cta: {
			text: 'ส่งรูปคอมและสเปกเพื่อประเมินราคาก่อนขาย',
			href: LINE_URL,
			external: true,
		},
		internalLinks: [
			{ href: AMPHON_URL, label: 'บริษัท อำพล เทรดดิ้ง จำกัด', external: true },
			{ href: '/computer-auction/', label: 'รับประมูลคอมบริษัท' },
			{ href: '/evaluate-price/', label: 'วิธีประเมินราคาคอมและโน๊ตบุ๊ค' },
		],
	},
	'รับซื้อคอมภูเก็ต': {
		title: 'รับซื้อคอม ภูเก็ต ประเมินตามสเปก ส่งรูปเช็กก่อนได้',
		description:
			'รับซื้อคอมพิวเตอร์และคอมประกอบในภูเก็ต ส่งรูปและสเปกให้ประเมินเบื้องต้นก่อนขายได้ ราคาขึ้นกับรุ่น สภาพ และอุปกรณ์',
		leadingBlocksToReplace: 2,
		introParagraphs: [
			'สำหรับผู้ที่อยู่ภูเก็ตและต้องการขายคอมพิวเตอร์และคอมประกอบ สามารถส่งรูปเครื่อง สเปก และอุปกรณ์ที่มีให้ประเมินเบื้องต้นก่อนได้',
			'เพื่อช่วยให้รู้แนวทางราคาก่อนนัดขายหรือจัดส่ง',
		],
		cta: {
			text: 'ส่งรูปคอม สเปก และอุปกรณ์ที่มี เพื่อประเมินราคา',
			href: LINE_URL,
			external: true,
		},
		internalLinks: [
			{ href: AMPHON_URL, label: 'AMPHON TRADING', external: true },
			{ href: '/rab-sue-com/', label: 'รับซื้อคอมพิวเตอร์' },
			{ href: '/contact/', label: 'ติดต่อเรา' },
		],
	},
	'fix-notebook-ubon': {
		title: 'ซ่อมโน๊ตบุ๊ค อุบล เช็กอาการก่อนซ่อม แจ้งราคาก่อนทำ',
		description:
			'บริการซ่อมโน๊ตบุ๊คในอุบล เช็กอาการเบื้องต้น เช่น เปิดไม่ติด จอเสีย แบตเสื่อม เครื่องช้า ส่งรูปและอาการให้ประเมินก่อนได้',
		leadingBlocksToReplace: 2,
		introParagraphs: [
			'หากโน๊ตบุ๊คมีอาการเปิดไม่ติด เครื่องช้า จอเสีย แบตเสื่อม หรือคีย์บอร์ดมีปัญหา สามารถแจ้งรุ่นและอาการเบื้องต้นให้ร้านช่วยประเมินแนวทางซ่อมก่อนได้',
			'เหมาะสำหรับคนอุบลที่ต้องการเช็กอาการก่อนนำเครื่องเข้าร้าน',
		],
		cta: {
			text: 'ส่งรุ่นโน๊ตบุ๊คและอาการเสียให้ช่างเช็กเบื้องต้น',
			href: LINE_URL,
			external: true,
		},
		internalLinks: [
			{ href: '/fixmobile-ubon/', label: 'ซ่อมมือถืออุบล' },
			{ href: AMPHON_URL, label: 'AMPHON TRADING', external: true },
			{ href: '/rab-sue-notebook/', label: 'รับซื้อโน๊ตบุ๊ค' },
		],
		transformContent: demoteContentH1,
	},
};

assertValidOverrideLinks();

export function getPostSeoOverride(slug: string): PostSeoOverride | undefined {
	return POST_SEO_OVERRIDES[slug];
}

export function preparePostContent(slug: string, html: string): string {
	const override = getPostSeoOverride(slug);
	if (!override) return html;

	let output = patchIntro(html, override);
	if (override.transformContent) {
		output = override.transformContent(output);
	}
	return output;
}
