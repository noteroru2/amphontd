import { getSiteOrigin } from '../lib/site';

const site = getSiteOrigin();

export function GET() {
	const body = `User-agent: *
Allow: /
Disallow: /api/

User-agent: GPTBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: CCBot
Allow: /

User-agent: anthropic-ai
Allow: /

Sitemap: ${site}/sitemap-index.xml

# AI Discovery: ${site}/llms.txt
`;
	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
		},
	});
}
