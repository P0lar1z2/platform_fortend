import { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { getStarBuyersListingTarget } from "../lib/externalListings";

export default function ExternalListingRedirect() {
  const [searchParams] = useSearchParams();
  const target = getStarBuyersListingTarget(searchParams.get("url"));
  const redirected = useRef(false);
  const redirectTimer = useRef<number | null>(null);

  const redirect = useCallback(() => {
    if (!target || redirected.current) return;
    redirected.current = true;
    window.location.replace(target);
  }, [target]);

  useEffect(() => {
    if (!target) return;

    redirectTimer.current = window.setTimeout(redirect, 1200);
    return () => {
      if (redirectTimer.current !== null) window.clearTimeout(redirectTimer.current);
    };
  }, [redirect, target]);

  if (!target) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "rgba(255,255,255,0.6)" }}>
        无法打开该交易记录
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "rgba(255,255,255,0.6)" }}>
      正在打开交易记录...
      <iframe
        aria-hidden="true"
        sandbox=""
        src={target}
        title="listing-preload"
        onLoad={() => {
          if (redirectTimer.current !== null) window.clearTimeout(redirectTimer.current);
          redirectTimer.current = window.setTimeout(redirect, 120);
        }}
        style={{ display: "none" }}
      />
    </main>
  );
}
