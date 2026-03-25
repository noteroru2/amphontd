import { parse, type HTMLElement, type Node as HtmlNode, TextNode } from 'node-html-parser';

export type AutoLinkRule = {
  /** words/phrases to match (case-insensitive for latin) */
  patterns: Array<string | RegExp>;
  href: string;
  title?: string;
};

const SKIP_TAGS = new Set(['A', 'SCRIPT', 'STYLE', 'CODE', 'PRE', 'NOSCRIPT', 'TEXTAREA']);

function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function makeLinkHtml(text: string, href: string, title?: string): string {
  const safeHref = escapeHtmlAttr(href);
  const safeTitle = title ? escapeHtmlAttr(title) : '';
  const titleAttr = title ? ` title="${safeTitle}"` : '';
  return `<a href="${safeHref}"${titleAttr}>${text}</a>`;
}

function findFirstMatch(text: string, patterns: Array<string | RegExp>) {
  for (const p of patterns) {
    if (typeof p === 'string') {
      const idx = text.toLowerCase().indexOf(p.toLowerCase());
      if (idx !== -1) return { start: idx, end: idx + p.length, matched: text.slice(idx, idx + p.length) };
    } else {
      const m = text.match(p);
      if (m && typeof m.index === 'number') {
        return { start: m.index, end: m.index + m[0].length, matched: m[0] };
      }
    }
  }
  return null;
}

function walk(node: HtmlNode, cb: (n: HtmlNode) => void) {
  cb(node);
  // @ts-expect-error node-html-parser types are loose
  const childNodes: HtmlNode[] | undefined = node.childNodes;
  if (!childNodes) return;
  for (const child of childNodes) walk(child, cb);
}

/**
 * Auto-link keyword mentions in HTML, avoiding existing links and code blocks.
 *
 * - Links at most `maxLinksTotal` times per document.
 * - Links at most once per `href` to prevent spammy repeated anchors.
 */
export function autoLinkHtml(
  html: string,
  rules: AutoLinkRule[],
  opts?: { maxLinksTotal?: number; maxPerHref?: number },
): string {
  const maxLinksTotal = opts?.maxLinksTotal ?? 10;
  const maxPerHref = opts?.maxPerHref ?? 1;
  if (!html || rules.length === 0) return html;

  const root = parse(html, {
    lowerCaseTagName: false,
    comment: false,
    blockTextElements: {
      script: true,
      style: true,
      pre: true,
      code: true,
    },
  });

  const perHrefCount = new Map<string, number>();
  let total = 0;

  walk(root as unknown as HtmlNode, (n) => {
    if (total >= maxLinksTotal) return;

    // Skip non-text nodes quickly
    if (!(n instanceof TextNode)) return;

    // node-html-parser TextNode has parentNode
    const parent = (n as unknown as { parentNode?: HTMLElement }).parentNode;
    if (!parent) return;

    // Skip if inside forbidden tags
    let p: HTMLElement | undefined = parent;
    while (p) {
      const tag = p.tagName?.toUpperCase?.();
      if (tag && SKIP_TAGS.has(tag)) return;
      p = (p as unknown as { parentNode?: HTMLElement }).parentNode;
    }

    const text = n.rawText ?? '';
    if (!text || !text.trim()) return;

    for (const rule of rules) {
      if (total >= maxLinksTotal) break;
      const used = perHrefCount.get(rule.href) ?? 0;
      if (used >= maxPerHref) continue;

      const match = findFirstMatch(text, rule.patterns);
      if (!match) continue;

      const before = text.slice(0, match.start);
      const middle = match.matched;
      const after = text.slice(match.end);

      const replacement = `${before}${makeLinkHtml(middle, rule.href, rule.title)}${after}`;

      // Replace the text node with HTML
      const fragment = parse(replacement);
      // @ts-expect-error node-html-parser typing
      parent.exchangeChild(n as unknown as HtmlNode, fragment);

      perHrefCount.set(rule.href, used + 1);
      total += 1;
      break; // only one replacement per original text node
    }
  });

  return root.toString();
}

