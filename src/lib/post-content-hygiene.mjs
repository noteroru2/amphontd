export function countContentH1(html = '') {
	const matches = String(html).match(/<h1\b[^>]*>/gi);
	return matches?.length ?? 0;
}

export function demoteContentH1(html = '') {
	return String(html)
		.replace(/<h1\b/gi, '<h2')
		.replace(/<\/h1\s*>/gi, '</h2>');
}

export function sanitizePostContentHtml(html = '') {
	return demoteContentH1(html);
}
