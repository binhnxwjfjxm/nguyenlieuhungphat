export const DEFAULT_SITE_URL = "https://nguyenlieuhungphat.com";

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;
}

export function getAbsoluteUrl(pathname: string) {
  const baseUrl = getSiteUrl();
  return new URL(pathname, baseUrl).toString();
}

