const STAR_BUYERS_HOST = "www.starbuyers-global-auction.com";
const STAR_BUYERS_MARKET_PATH = /^\/market_price\/\d+$/;

export function getExternalListingHref(href?: string): string | undefined {
  if (!href) return undefined;

  const target = getStarBuyersListingTarget(href);
  if (!target) return href;

  return `/external-listing?url=${encodeURIComponent(target)}`;
}

export function getStarBuyersListingTarget(href?: string | null): string | null {
  if (!href) return null;

  try {
    const target = new URL(href);
    if (
      target.protocol !== "https:"
      || target.hostname !== STAR_BUYERS_HOST
      || !STAR_BUYERS_MARKET_PATH.test(target.pathname)
    ) {
      return null;
    }

    return target.toString();
  } catch {
    return null;
  }
}
