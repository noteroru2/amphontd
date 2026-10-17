import assert from 'node:assert/strict';
import fs from 'node:fs';

const slug = 'รับซื้อสินค้าค้างสต๊อก';
const html = fs.readFileSync(`dist/${slug}/index.html`, 'utf8');
assert.equal((html.match(/<h1\b/g) || []).length, 1);
assert.ok(html.includes('ส่งรายการสินค้า ยี่ห้อหรือรุ่น จำนวน สภาพ รูปตัวอย่าง'));
assert.ok(html.includes('href="/rab-sue-klong/"'));
assert.ok(!html.includes('href="/serve"'));
assert.ok(!/<meta[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(html));
assert.ok(!html.includes('การทำความสะอาดพื้นที่ให้พร้อมใช้งาน'));
assert.ok(!html.includes('มีระบบการจัดเก็บและทำลายข้อมูลที่เหมาะสม'));
const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1];
assert.equal(decodeURI(canonical || ''), `https://amphontd.com/${slug}/`);
const redirects = fs.readFileSync('dist/_redirects', 'utf8');
for (const suffix of ['-2', '-3']) {
  for (const slash of ['', '/']) {
    assert.ok(redirects.includes(`${encodeURI(`/${slug}${suffix}${slash}`)} ${encodeURI(`/${slug}/`)} 301`));
  }
}
const sitemaps = fs.readdirSync('dist').filter(name => /^sitemap.*\.xml$/.test(name)).map(name => fs.readFileSync(`dist/${name}`, 'utf8')).join('\n');
assert.ok(decodeURI(sitemaps).includes(`https://amphontd.com/${slug}/`));
assert.ok(!decodeURI(sitemaps).includes(`https://amphontd.com/${slug}-2/`));
assert.ok(!decodeURI(sitemaps).includes(`https://amphontd.com/${slug}-3/`));
console.log('STOCK_LOT_CONTENT_ROUTING_PASS');
