export const MONEY_OWNERSHIP_REDIRECT_SLUGS = new Map([
	// GSC 2026-09-11..15 still assigns the generic iPhone money query to this
	// legacy WordPress slug instead of the dedicated static money owner.
	['webuy-iphone', '/rab-sue-iphone/'],
]);

export const MONEY_OWNERSHIP_HOLD_SLUGS = new Map([
	// Broad city page repeatedly competes with national iPad/MacBook/iPhone
	// queries without satisfying the product intent. Keep it crawlable for now,
	// but remove it from the index while the dedicated owners recover.
	['รับซื้อเมืองเลย', 'money_query_owner_conflict'],
]);

export function applyMoneyOwnershipOverrides(policy) {
	const next = new Map(policy);

	for (const [slug, ownerPath] of MONEY_OWNERSHIP_REDIRECT_SLUGS.entries()) {
		if (!next.has(slug)) continue;
		next.set(slug, {
			lifecycle: 'REDIRECT',
			reason: 'money_query_legacy_owner',
			ownerPath,
		});
	}

	for (const [slug, reason] of MONEY_OWNERSHIP_HOLD_SLUGS.entries()) {
		if (!next.has(slug)) continue;
		next.set(slug, {
			lifecycle: 'HOLD_NOINDEX',
			reason,
		});
	}

	return next;
}
