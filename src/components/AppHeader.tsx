import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useWatchlist } from "../hooks/useWatchlist";

const bd = "Inter, sans-serif";

const NAV = [
  { to: "/", label: "首页" },
  { to: "/brands", label: "品牌列表" },
  { to: "/config", label: "配置表" },
  { to: "/goofish-subscriptions", label: "闲鱼订阅" },
  { to: "/watchlist", label: "关注列表" },
];

export default function AppHeader() {
  const { pathname } = useLocation();
  const [hover, setHover] = useState(false);
  const { count, capacity, isNearLimit, isFull } = useWatchlist();

  const isActive = (to: string) => to === "/" ? pathname === "/" : pathname.startsWith(to);

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 40px",
      background: "rgba(10,10,10,0.85)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      fontFamily: bd,
    }}>
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10 }}
            onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <img
          src={hover
            ? "/logo-hover/raventik_holographic_smoke_chrome_64x64.png"
            : "/logo/raventik_logo_nav_32.png"}
          width={32} height={32}
          style={{ borderRadius: 8, objectFit: "contain", transition: "opacity 200ms" }}
          alt="Raventik"
        />
        <span style={{ fontSize: 18, fontWeight: 600, fontStyle: "italic", color: "#fff" }}>Raventik</span>
      </Link>

      <nav style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {NAV.map(item => {
          const active = isActive(item.to);
          const isWatchlist = item.to === "/watchlist";
          return (
            <Link key={item.to} to={item.to} style={{
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 500,
              color: active ? "#fff" : "rgba(255,255,255,0.55)",
              transition: "color 0.15s",
              position: "relative",
            }}>
              {item.label}
              {isWatchlist && count > 0 && (
                <span style={{
                  marginLeft: 6,
                  padding: "1px 7px",
                  fontSize: 11,
                  fontWeight: 600,
                  borderRadius: 9999,
                  background: isFull ? "rgba(239,68,68,0.18)" : isNearLimit ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.08)",
                  color: isFull ? "#ef4444" : isNearLimit ? "#f59e0b" : "rgba(255,255,255,0.7)",
                }}>
                  {count}/{capacity}
                </span>
              )}
            </Link>
          );
        })}
        <button style={{
          marginLeft: 8,
          padding: "8px 18px",
          borderRadius: 9999,
          background: "#fff",
          color: "#0a0a0a",
          border: "none",
          fontSize: 13,
          fontWeight: 600,
          display: "flex", alignItems: "center", gap: 4,
          cursor: "pointer",
        }}>
          登录 <ArrowUpRight size={14} />
        </button>
      </nav>
    </header>
  );
}
