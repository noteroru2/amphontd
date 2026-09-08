export const MONEY_OWNERSHIP_HOLD_SLUGS = new Map([
	['รับซื้อเมืองเลย', 'money_query_owner_conflict'],
]);

export function applyMoneyOwnershipOverrides(policy) {
	const next = new Map(policy);

	for (const [slug, reason] of MONEY_OWNERSHIP_HOLD_SLUGS.entries()) {
		if (!next.has(slug)) continue;
		next.set(slug, {
			lifecycle: 'HOLD_NOINDEX',
			reason,
		});
	}

	return next;
}
