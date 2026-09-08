const SERVICE_TITLE_PREFIXES = [
	/^รับซื้อ/i,
	/^ร้าน\s*รับซื้อ/i,
	/^รับจำนำ/i,
	/^รับจํานํา/i,
	/^จำนำ/i,
	/^จํานํา/i,
	/^ซ่อม/i,
	/^รับถึงที่/i,
	/^รับประมูล/i,
];

const SERVICE_SLUG_PREFIXES = [
	/^buy-/i,
	/^rab-sue/i,
	/^raan-rab-sue/i,
	/^fix-/i,
	/^fixmobile/i,
	/^pawn-/i,
	/^buy-ticketpawn/i,
	/^computer-auction/i,
];

const GUIDE_TERMS = [
	'วิธี',
	'คู่มือ',
	'เช็ก',
	'เช็ค',
	'ตรวจสอบ',
	'ก่อนขาย',
	'คืออะไร',
	'กี่ชนิด',
	'กี่ประเภท',
	'ข้อควร',
	'เทคนิค',
	'แนะนำ',
	'ทำอย่างไร',
	'ขั้นตอน',
	'เตรียม',
	'เลือกยังไง',
	'เลือกอย่างไร',
];

const LOCATIONS = [
	'กรุงเทพมหานคร','กรุงเทพ','กระบี่','กาญจนบุรี','กาฬสินธุ์','กำแพงเพชร','ขอนแก่น','จันทบุรี','ฉะเชิงเทรา','ชลบุรี','ชัยนาท','ชัยภูมิ','ชุมพร','เชียงราย','เชียงใหม่','ตรัง','ตราด','ตาก','นครนายก','นครปฐม','นครพนม','นครราชสีมา','โคราช','นครศรีธรรมราช','นครสวรรค์','นนทบุรี','นราธิวาส','น่าน','บึงกาฬ','บุรีรัมย์','ปทุมธานี','ประจวบคีรีขันธ์','ปราจีนบุรี','ปัตตานี','พระนครศรีอยุธยา','อยุธยา','พังงา','พัทลุง','พิจิตร','พิษณุโลก','เพชรบุรี','เพชรบูรณ์','แพร่','พะเยา','ภูเก็ต','มหาสารคาม','มุกดาหาร','แม่ฮ่องสอน','ยโสธร','ยะลา','ร้อยเอ็ด','ระนอง','ระยอง','ราชบุรี','ลพบุรี','ลำปาง','ลำพูน','เลย','ศรีสะเกษ','สกลนคร','สงขลา','สตูล','สมุทรปราการ','สมุทรสงคราม','สมุทรสาคร','สระแก้ว','สระบุรี','สิงห์บุรี','สุโขทัย','สุพรรณบุรี','สุราษฎร์ธานี','สุรินทร์','หนองคาย','หนองบัวลำภู','อ่างทอง','อำนาจเจริญ','อุดรธานี','อุตรดิตถ์','อุทัยธานี','อุบลราชธานี','อุบล','หาดใหญ่','วารินชำราบ','ปากช่อง',
];

const LOCATION_ALIASES = new Map([
	['กรุงเทพ', 'กรุงเทพมหานคร'],
	['โคราช', 'นครราชสีมา'],
	['อุบล', 'อุบลราชธานี'],
]);

const SERVICE_FAMILIES = [
	{ key: 'NOTEBOOK', terms: ['โน๊ตบุ๊ค','โน้ตบุ๊ค','notebook','laptop'], label: 'รับซื้อโน๊ตบุ๊คมือสอง', hubPath: '/rab-sue-notebook/' },
	{ key: 'MACBOOK', terms: ['macbook','imac','mac mini'], label: 'รับซื้อ MacBook และอุปกรณ์ Apple', hubPath: '/rab-sue-macbook/' },
	{ key: 'IPHONE', terms: ['iphone','ไอโฟน'], label: 'รับซื้อ iPhone มือสอง', hubPath: '/rab-sue-iphone/' },
	{ key: 'IPAD', terms: ['ipad','ไอแพด'], label: 'รับซื้อ iPad มือสอง', hubPath: '/rab-sue-ipad/' },
	{ key: 'CAMERA', terms: ['กล้อง','camera','เลนส์','lens'], label: 'รับซื้อกล้องและเลนส์มือสอง', hubPath: '/rab-sue-klong/' },
	{ key: 'COMPUTER', terms: ['คอมพิวเตอร์','คอม','computer','desktop','pc','การ์ดจอ','gpu','cpu','ram','ssd','ฮาร์ดดิสก์'], label: 'รับซื้อคอมพิวเตอร์และอุปกรณ์ไอที', hubPath: '/rab-sue-com/' },
	{ key: 'PHONE', terms: ['มือถือ','โทรศัพท์','smartphone'], label: 'รับซื้อมือถือมือสอง', hubPath: '/rab-sue-iphone/' },
];

function htmlToText(value = '') {
	return String(value)
		.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
		.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;|&#160;/gi, ' ')
		.replace(/&amp;/gi, '&')
		.replace(/\s+/g, ' ')
		.trim();
}

function getTitle(post) {
	return htmlToText(post?.title?.rendered ?? '');
}

function combinedText(post) {
	return `${post?.slug ?? ''} ${getTitle(post)}`.toLocaleLowerCase('th');
}

function hasServiceSignal(post) {
	const title = getTitle(post).trim();
	const slug = String(post?.slug ?? '').trim();
	return SERVICE_TITLE_PREFIXES.some((pattern) => pattern.test(title)) || SERVICE_SLUG_PREFIXES.some((pattern) => pattern.test(slug));
}

function hasGuideSignal(post) {
	const text = combinedText(post);
	return GUIDE_TERMS.some((term) => text.includes(term));
}

export function inferLocationLabel(post) {
	const text = combinedText(post);
	for (const location of LOCATIONS) {
		if (!text.includes(location.toLocaleLowerCase('th'))) continue;
		return LOCATION_ALIASES.get(location) ?? location;
	}

	const title = getTitle(post);
	const marker = title.match(/(เขต|อำเภอ|อําเภอ|จังหวัด)\s*([ก-๙A-Za-z0-9-]{2,30})/i);
	if (marker) return `${marker[1]}${marker[2]}`;
	return undefined;
}

export function inferServiceFamily(post) {
	const text = combinedText(post);
	for (const family of SERVICE_FAMILIES) {
		if (family.terms.some((term) => text.includes(term.toLocaleLowerCase('th')))) return family;
	}
	return { key: 'GENERAL', terms: [], label: 'บริการประเมินและรับซื้อสินค้าไอทีมือสอง', hubPath: '/evaluate-price/' };
}

export function classifyPostPageIntent(post) {
	if (hasServiceSignal(post)) {
		const locationLabel = inferLocationLabel(post);
		const family = inferServiceFamily(post);
		return {
			kind: locationLabel ? 'LOCAL_SERVICE' : 'SERVICE',
			isEditorial: false,
			locationLabel,
			familyKey: family.key,
			serviceType: family.label,
			hubPath: family.hubPath,
		};
	}

	if (hasGuideSignal(post)) {
		return {
			kind: 'GUIDE',
			isEditorial: true,
		};
	}

	return {
		kind: 'ARTICLE',
		isEditorial: true,
	};
}

export function isEditorialIntent(intent) {
	return intent?.kind === 'GUIDE' || intent?.kind === 'ARTICLE';
}

function orgIdForSite(site) {
	return `${String(site).replace(/\/+$/, '')}/#organization`;
}

function webPageIdForUrl(url) {
	return `${url}#webpage`;
}

function buildBreadcrumb(site, url, title, intent) {
	const home = String(site).replace(/\/+$/, '') + '/';
	const items = [
		{ '@type': 'ListItem', position: 1, name: 'หน้าแรก', item: home },
	];

	if (isEditorialIntent(intent)) {
		items.push({ '@type': 'ListItem', position: 2, name: 'บทความ', item: `${home}blog/` });
		items.push({ '@type': 'ListItem', position: 3, name: title, item: url });
	} else {
		items.push({ '@type': 'ListItem', position: 2, name: title, item: url });
	}

	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items,
	};
}

export function buildPostStructuredData({ post, intent, title, description, url, site, featuredUrl, tags = [] }) {
	const orgId = orgIdForSite(site);
	let primary;

	if (isEditorialIntent(intent)) {
		primary = {
			'@context': 'https://schema.org',
			'@type': intent.kind === 'GUIDE' ? 'TechArticle' : 'Article',
			headline: title,
			description,
			mainEntityOfPage: { '@id': webPageIdForUrl(url) },
			datePublished: post.date,
			dateModified: post.modified ?? post.date,
			author: { '@id': orgId },
			publisher: { '@id': orgId },
			image: featuredUrl ? [new URL(featuredUrl, site).toString()] : undefined,
			inLanguage: 'th-TH',
			isAccessibleForFree: true,
			articleSection: intent.kind === 'GUIDE' ? 'คู่มือและความรู้' : 'บทความ',
			...(tags.length > 0 && { keywords: tags.join(', ') }),
		};
	} else {
		primary = {
			'@context': 'https://schema.org',
			'@type': 'Service',
			'@id': `${url}#service`,
			name: title,
			description,
			url,
			serviceType: intent.serviceType ?? 'บริการประเมินและรับซื้อสินค้าไอทีมือสอง',
			provider: { '@id': orgId },
			mainEntityOfPage: { '@id': webPageIdForUrl(url) },
			areaServed: intent.locationLabel
				? { '@type': 'AdministrativeArea', name: intent.locationLabel }
				: { '@type': 'Country', name: 'ประเทศไทย' },
		};
	}

	return [primary, buildBreadcrumb(site, url, title, intent)];
}
