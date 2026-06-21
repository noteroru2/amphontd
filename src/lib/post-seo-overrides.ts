export interface PostIntroCta {
	text: string;
	lineHref?: string;
	lineLabel?: string;
	phoneHref?: string;
	phoneLabel?: string;
}

export interface PostSeoOverride {
	title: string;
	description: string;
	introCta?: PostIntroCta;
	transformContent?: (html: string) => string;
}

function demoteContentH1(html: string): string {
	return html.replace(/<h1\b/gi, '<h2').replace(/<\/h1>/gi, '</h2>');
}

const POST_SEO_OVERRIDES: Record<string, PostSeoOverride> = {
	'fixmobile-ubon': {
		title: 'รับซ่อมมือถืออุบล ตีราคาก่อนซ่อม รับประกัน | ถนนชยางกูร',
		description:
			'รับซ่อมมือถืออุบล ทุกยี่ห้อ iPhone Samsung OPPO ถนนชยางกูร เมืองอุบล ตีราคาก่อนซ่อม ไม่มีค่าใช้จ่ายแอบแฝง รับประกันงานซ่อม โทร 064-257-9353 แอดไลน์ @webuy',
		introCta: {
			text: 'มือถือเสียในอุบล? โทรหรือแอดไลน์ตีราคาก่อนซ่อมฟรี — ช่างมืออาชีพ รับประกันคุณภาพ ไม่มีค่าใช้จ่ายแอบแฝง',
			lineHref: 'https://line.me/R/ti/p/@webuy',
			lineLabel: 'แอดไลน์ @webuy',
			phoneHref: 'tel:0642579353',
			phoneLabel: 'โทร 064-257-9353',
		},
	},
	'fix-notebook-ubon': {
		title: 'รับซ่อมโน๊ตบุ๊คอุบล เช็คฟรี ตีราคาก่อนซ่อม | อำพล เทรดดิ้ง',
		description:
			'รับซ่อมโน๊ตบุ๊คอุบล ทุกอาการ เช็คฟรี ตีราคาก่อนซ่อม ร้านอำพล เทรดดิ้ง ถนนชยางกูร เมืองอุบล เปิดทุกวัน 09-21 น. โทร 064-257-9353 แอดไลน์ @webuy',
		introCta: {
			text: 'โน๊ตบุ๊คเปิดไม่ติด จอเสีย หรือช้า? นำมาเช็คฟรีที่ร้านถนนชยางกูร — ตีราคาก่อนซ่อม รับประกันงาน เปิดทุกวัน 09-21 น.',
			lineHref: 'https://line.me/R/ti/p/@webuy',
			lineLabel: 'แอดไลน์ @webuy',
			phoneHref: 'tel:0642579353',
			phoneLabel: 'โทร 064-257-9353',
		},
		transformContent: demoteContentH1,
	},
	'รับซื้อคอมพิษณุโลก': {
		title: 'รับซื้อคอมพิษณุโลก ถึงบ้าน จ่ายสดทันที ประเมินฟรี',
		description:
			'รับซื้อคอมพิษณุโลก คอม PC โน๊ตบุ๊ค Mac ถึงบ้าน ตีราคาฟรีก่อนขาย จ่ายเงินสดทันที ทีมมืออาชีพ ปลอดภัย ไว้ใจได้ แอดไลน์ @webuy โทร 064-257-9353',
		introCta: {
			text: 'อยากขายคอมในพิษณุโลก? ส่งรูปและสเปคเครื่อง แอดไลน์ @webuy รับประเมินราคาฟรี — รับซื้อถึงบ้าน จ่ายเงินสดทันที ปลอดภัย',
			lineHref: 'https://line.me/R/ti/p/@webuy',
			lineLabel: 'แอดไลน์ @webuy ประเมินฟรี',
			phoneHref: 'tel:0642579353',
			phoneLabel: 'โทร 064-257-9353',
		},
	},
};

export function getPostSeoOverride(slug: string): PostSeoOverride | undefined {
	return POST_SEO_OVERRIDES[slug];
}

export function preparePostContent(slug: string, html: string): string {
	const override = getPostSeoOverride(slug);
	if (!override?.transformContent) return html;
	return override.transformContent(html);
}
