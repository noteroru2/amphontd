export function getSiteOrigin(): string {
  const env = import.meta.env as Record<string, unknown>;
  const siteUrl = typeof env.SITE_URL === 'string' ? env.SITE_URL : undefined;
  if (siteUrl) return siteUrl.replace(/\/+$/, '');

  const fqdn = typeof env.COOLIFY_FQDN === 'string' ? env.COOLIFY_FQDN : undefined;
  if (fqdn) return `https://${fqdn}`.replace(/\/+$/, '');

  const coolifyUrl = typeof env.COOLIFY_URL === 'string' ? env.COOLIFY_URL : undefined;
  if (coolifyUrl) return coolifyUrl.replace(/\/+$/, '');

  return 'https://example.com';
}

export function getSiteUrl(pathname: string): string {
  const base = getSiteOrigin();
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${base}${path}`;
}
