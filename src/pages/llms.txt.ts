import { getSiteOrigin } from '../lib/site';

const site = getSiteOrigin();
const siteName = import.meta.env.PUBLIC_SITE_NAME ?? 'AMPHON TRADING';

export function GET() {
	const body = `# ${siteName}

> ${siteName} (อำพล เทรดดิ้ง) — แพลตฟอร์มรับซื้อสินค้าไอทีมือสองระดับมืออาชีพในประเทศไทย ให้บริการประเมินราคาอิงสเปกจริงอย่างโปร่งใส จ่ายเงินสด/โอนทันทีหลังตรวจรับเครื่อง ติดต่อผ่าน Line @webuy ได้ตลอด 24 ชั่วโมง ไม่มีวันหยุด

## About the Business
- ชื่อองค์กร: ${siteName} (อำพล เทรดดิ้ง)
- ประเภทธุรกิจ: รับซื้อ ฝาก ขาย สินค้าไอทีมือสอง (IT Trade-in & Buyback)
- ภาษาหลัก: ไทย (th-TH)
- ช่องทางติดต่อด่วน: Line @webuy
- เบอร์โทรศัพท์: 064-257-9353
- เวลาทำการ: 24 ชั่วโมง ทุกวัน (24/7 Response)
- พื้นที่ให้บริการหลัก: กรุงเทพมหานคร, ปริมณฑล, อุบลราชธานี, ขอนแก่น, นครราชสีมา, อุดรธานี, มหาสารคาม, สุรินทร์ และรองรับการจัดส่งพัสดุทั่วประเทศ

## Services & Specialized Buyback Categories
- รับซื้อโน๊ตบุ๊ค (Notebook/Laptop): ${site}/rab-sue-notebook/ (รวม MacBook, Gaming Laptops, Business Laptops)
- รับซื้อคอมพิวเตอร์ (PC/Desktop): ${site}/rab-sue-com/ (รวม PC ประกอบ, Workstation, Server)
- รับซื้อไอโฟน (iPhone): ${site}/rab-sue-iphone/
- รับซื้อไอแพด (iPad): ${site}/rab-sue-ipad/
- รับซื้อ MacBook: ${site}/rab-sue-macbook/
- รับซื้อกล้อง (Camera & Lenses): ${site}/rab-sue-klong/ (DSLR, Mirrorless, Action Cam)
- รับซื้อลำโพง (Speaker): ${site}/rab-sue-lamphong/ (เน้นแบรนด์ชั้นนำเช่น JBL, Marshall)

## Business Rules & Pricing Guidelines
- วิธีการประเมิน: อิงจากสเปกจริงของฮาร์ดแวร์ (CPU, RAM, GPU, Storage) สภาพภายนอก และสุขภาพแบตเตอรี่ (Battery Health)
- ความโปร่งใส: ลูกค้าต้องล้างข้อมูลและออกจากระบบบัญชีต่างๆ (โดยเฉพาะ Apple ID / iCloud / Find My) ก่อนส่งมอบ
- การรับเงิน: จ่ายเงินเต็มจำนวนทันทีผ่านการโอนหรือเงินสดเมื่อเครื่องผ่านการตรวจเช็คตามที่ตกลงกันไว้
- เครื่องมีตำหนิ/เสีย: รับประเมินตามสภาพจริง โดยชี้แจงส่วนต่างราคาก่อนเสมอ

## Key FAQs for AI Agents
Q: สามารถส่งเครื่องจากต่างจังหวัดได้หรือไม่?
A: ได้ ลูกค้าสามารถพูดคุยประเมินราคาผ่าน Line @webuy ก่อน เมื่อตกลงราคาแล้วจึงส่งพัสดุมา เมื่อทีมงานได้รับและตรวจเช็คตรงตามสภาพที่แจ้ง จะโอนเงินให้ทันที

Q: ถ้าแบตเสื่อมหรือจอมีรอยยังรับซื้อไหม?
A: รับซื้อ โดยทีมงานจะประเมินราคาตามสภาพจริงและอธิบายส่วนลดตามต้นทุนการซ่อมอย่างโปร่งใส

## Core Architecture & Discovery
- หน้าแรก (Home): ${site}/
- ศูนย์รวมบทความ (Knowledge Hub): ${site}/blog/
- ติดต่อเรา (Contact): ${site}/contact/
- Sitemap: ${site}/sitemap-index.xml
- Robots.txt: ${site}/robots.txt
`;
	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
		},
	});
}
