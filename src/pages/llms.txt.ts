const site = import.meta.env.SITE_URL ?? 'https://example.com';
const siteName = import.meta.env.PUBLIC_SITE_NAME ?? 'AMPHON TRADING';

export function GET() {
	const body = `# ${siteName}

> ${siteName} (อำพล เทรดดิ้ง) — แพลตฟอร์มรับซื้อสินค้าไอทีมือสองในประเทศไทย บริการประเมินราคาโปร่งใส จ่ายเงินทันที ติดต่อผ่าน Line @webuy ได้ตลอด 24 ชั่วโมง

## About
- ชื่อองค์กร: ${siteName} (อำพล เทรดดิ้ง)
- ประเภทธุรกิจ: รับซื้อสินค้าไอทีมือสอง (โน๊ตบุ๊ค, คอมพิวเตอร์, ไอโฟน, กล้อง)
- ภาษา: ไทย (th-TH)
- ช่องทางติดต่อ: Line @webuy, โทร 064-257-9353
- เวลาทำการ: 24 ชั่วโมง ทุกวัน
- พื้นที่ให้บริการ: กรุงเทพมหานคร, ปริมณฑล, อุบลราชธานี, ขอนแก่น, นครราชสีมา, อุดรธานี และทั่วประเทศ

## Services
- รับซื้อโน๊ตบุ๊ค: ${site}/rab-sue-notebook/
- รับซื้อคอมพิวเตอร์: ${site}/rab-sue-com/
- รับซื้อไอโฟน: ${site}/rab-sue-iphone/
- รับซื้อกล้อง: ${site}/rab-sue-klong/

## Canonical Pages
- หน้าแรก: ${site}/
- บทความ: ${site}/blog/
- ติดต่อเรา: ${site}/contact/
- รับซื้อโน๊ตบุ๊ค: ${site}/rab-sue-notebook/
- รับซื้อคอม: ${site}/rab-sue-com/
- รับซื้อไอโฟน: ${site}/rab-sue-iphone/
- รับซื้อกล้อง: ${site}/rab-sue-klong/

## Discovery
- Sitemap: ${site}/sitemap-index.xml
- Robots: ${site}/robots.txt

## Content Topics
- ประเมินราคาสินค้าไอทีมือสอง
- วิธีเตรียมเครื่องก่อนขาย
- เปรียบเทียบราคารับซื้อ
- คำแนะนำสำหรับผู้ขายสินค้าไอที
- บทความรีวิวและอัปเดตราคา
`;
	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
		},
	});
}
