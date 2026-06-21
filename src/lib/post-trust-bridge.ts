export interface TrustBridgeLink {
	href: string;
	label: string;
}

type TrustBridgePart = string | TrustBridgeLink;

const TRUST_BRIDGES: Record<string, TrustBridgePart[]> = {
	'fixmobile-ubon': [
		'บริการซ่อมมือถือดำเนินการโดยทีมงานของ ',
		{ href: 'https://amphon.co.th/', label: 'ร้านอำพล เทรดดิ้ง อุบลราชธานี' },
		' หากเครื่องซ่อมไม่คุ้มหรืออยากเปลี่ยนรุ่นใหม่ สามารถดูแนวทางประเมินราคาได้ที่ ',
		{ href: 'https://ร้านรับซื้อไอโฟน.com/', label: 'ร้านรับซื้อไอโฟน.com' },
		'.',
	],
	'fix-notebook-ubon': [
		'หากต้องการดูบริการอื่นของ ',
		{ href: 'https://amphon.co.th/', label: 'AMPHON TRADING' },
		' หรือแนวทางประเมินโน๊ตบุ๊คก่อนขายแบบละเอียด ดูได้ที่ ',
		{ href: 'https://ร้านรับซื้อโน๊ตบุ๊ค.com/', label: 'ร้านรับซื้อโน๊ตบุ๊ค.com' },
		'.',
	],
};

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function renderLink(link: TrustBridgeLink): string {
	return `<a href="${link.href}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`;
}

function renderTrustBridge(parts: TrustBridgePart[]): string {
	const body = parts
		.map((part) => (typeof part === 'string' ? escapeHtml(part) : renderLink(part)))
		.join('');

	return `<p class="trust-bridge">${body}</p>`;
}

export function appendTrustBridge(slug: string, html: string): string {
	const parts = TRUST_BRIDGES[slug];
	if (!parts) return html;
	if (html.includes('class="trust-bridge"')) return html;
	return `${html.trim()}\n${renderTrustBridge(parts)}`;
}

export function getTrustBridgeLinks(slug: string): TrustBridgeLink[] {
	return (TRUST_BRIDGES[slug] ?? []).filter(
		(part): part is TrustBridgeLink => typeof part !== 'string',
	);
}
