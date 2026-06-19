import { type ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Search, X } from "lucide-react";
import { useWatchlist } from "../hooks/useWatchlist";
import UserMenu from "./UserMenu";

const bd = "'Barlow','Noto Sans SC',sans-serif";
const hd = "'Instrument Serif','Noto Serif SC',serif";

const NAV = [
  { to: "/", label: "首页" },
  { to: "/brands", label: "品牌列表" },
  { to: "/config", label: "配置表" },
  { to: "/goofish-subscriptions", label: "闲鱼后台" },
  { to: "/watchlist", label: "关注列表" },
];

interface AppHeaderProps {
  showSearch?: boolean;
  searchValue?: string;
  searchPlaceholder?: string;
  searchLeading?: ReactNode;
  onSearch?: (query: string) => void;
}

export default function AppHeader({
  showSearch = false,
  searchValue = "",
  searchPlaceholder = "搜索品牌、型号或 Ref Number...",
  searchLeading,
  onSearch,
}: AppHeaderProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [hover, setHover] = useState(false);
  const [query, setQuery] = useState(searchValue);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { count, capacity, isNearLimit, isFull } = useWatchlist();

  useEffect(() => {
    setQuery(searchValue);
  }, [searchValue]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("has-header-search", showSearch);
    return () => document.body.classList.remove("has-header-search");
  }, [showSearch]);

  const isActive = (to: string) => to === "/" ? pathname === "/" : pathname.startsWith(to);
  const submitSearch = (nextQuery: string) => {
    const q = nextQuery.trim();
    if (onSearch) {
      onSearch(q);
      return;
    }
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className={`app-header${showSearch ? " has-search" : ""}`}>
      <style>{`
        .app-header{position:fixed;top:0;left:0;right:0;z-index:50;padding:12px 40px;background:rgba(10,10,10,.68);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-bottom:1px solid rgba(255,255,255,.06);box-shadow:inset 0 -1px 0 rgba(255,255,255,.035);font-family:${bd}}
        .app-header-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;gap:20px}
        .app-header-logo{display:flex;align-items:center;gap:10px;flex-shrink:0;color:#fff;text-decoration:none}
        .app-header-brand{font-family:${hd};font-style:italic;font-size:20px;color:#fff}
        .app-header-search{flex:1;max-width:560px;display:flex;align-items:center;gap:8px;padding:4px 4px 4px 16px;border-radius:9999px;background:rgba(255,255,255,.05);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:inset 0 1px 1px rgba(255,255,255,.1);position:relative;overflow:visible}
        .app-header-search::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1px;background:linear-gradient(180deg,rgba(255,255,255,.25) 0%,rgba(255,255,255,.08) 30%,rgba(255,255,255,0) 50%,rgba(255,255,255,.08) 70%,rgba(255,255,255,.25) 100%);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
        .app-header-search:focus-within{box-shadow:inset 0 1px 1px rgba(255,255,255,.15),0 0 0 1px rgba(255,255,255,.15),0 8px 40px rgba(0,0,0,.3)}
        .app-header-input{min-width:70px;flex:1;background:transparent;border:0;outline:0;font-size:13px;font-weight:300;color:#fff;font-family:${bd}}
        .app-header-clear{display:flex;align-items:center;border:0;background:transparent;padding:4px;cursor:pointer;color:rgba(255,255,255,.4)}
        .app-header-submit{display:flex;align-items:center;gap:4px;padding:7px 16px;border:0;border-radius:9999px;background:rgba(255,255,255,.07);color:#fff;font-size:12px;font-weight:500;font-family:${bd};cursor:pointer;box-shadow:inset 0 1px 1px rgba(255,255,255,.18)}
        .app-header-nav{margin-left:auto;display:flex;align-items:center;gap:4px;flex-shrink:0}
        .app-header-menu-toggle{display:none;width:40px;height:40px;align-items:center;justify-content:center;border:0;border-radius:10px;background:rgba(255,255,255,.06);color:#fff;cursor:pointer}
        .app-header-mobile-menu{display:none}
        .app-header-link{position:relative;padding:6px 12px;border-radius:9999px;color:rgba(255,255,255,.6);text-decoration:none;font-size:12px;font-weight:400;white-space:nowrap}
        .app-header-link.active{background:rgba(255,255,255,.08);color:#fff}
        .app-header-link:hover{color:#fff;background:rgba(255,255,255,.065)}
        .app-header-badge{margin-left:6px;padding:1px 7px;border-radius:9999px;font-size:11px;font-weight:600}
        @media (max-width:1120px){.app-header{padding:12px 24px}.app-header-nav{gap:2px}.app-header-link{padding:6px 9px}.app-header-search{max-width:420px}}
        @media (max-width:900px){.app-header-inner{gap:12px}.app-header-nav .app-header-link{display:none}.app-header-search{max-width:none}.app-header-submit{padding:7px 12px}}
        @media (max-width:620px){
          .app-header{padding:10px 14px}
          .app-header-inner{display:grid;grid-template-columns:auto 1fr auto;gap:10px}
          .app-header-logo{min-width:0}
          .app-header-brand{display:block;font-size:18px}
          .app-header-nav{grid-column:2;margin-left:auto}
          .app-header-nav>div{max-width:132px}
          .app-header-menu-toggle{display:flex;grid-column:3}
          .app-header-search{grid-column:1/-1;grid-row:2;width:100%;max-width:none;padding-left:10px;gap:6px}
          .app-header-search .app-header-submit{min-width:44px;min-height:36px;padding:7px 11px}
          .app-header-input{min-width:0;font-size:16px}
          .app-header-mobile-menu{position:fixed;top:61px;left:12px;right:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(18,18,18,.98);box-shadow:0 24px 70px rgba(0,0,0,.55);z-index:60}
          .app-header.has-search .app-header-mobile-menu{top:112px}
          .app-header-mobile-link{display:flex;align-items:center;justify-content:space-between;min-height:44px;padding:0 14px;border-radius:9px;background:rgba(255,255,255,.04);color:rgba(255,255,255,.72);font-size:13px;text-decoration:none}
          .app-header-mobile-link.active{background:rgba(255,255,255,.12);color:#fff}
        }
      `}</style>

      <div className="app-header-inner">
        <Link className="app-header-logo" to="/"
              onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
          <img
            src={hover
              ? "/logo-hover/raventik_holographic_smoke_chrome_64x64.png"
              : "/logo/raventik_logo_nav_32.png"}
            width={32} height={32}
            style={{ borderRadius: 8, objectFit: "contain", transition: "opacity 200ms" }}
            alt="Raventik"
          />
          <span className="app-header-brand">Raventik</span>
        </Link>

        {showSearch && (
          <form className="app-header-search" onSubmit={e => { e.preventDefault(); submitSearch(query); }}>
            {searchLeading}
            <Search size={16} color="rgba(255,255,255,0.35)" />
            <input
              className="app-header-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
            />
            {query && (
              <button type="button" className="app-header-clear" onClick={() => { setQuery(""); submitSearch(""); }}>
                <X size={14} />
              </button>
            )}
            <button className="app-header-submit" type="submit">搜索</button>
          </form>
        )}

        <nav className="app-header-nav">
        {NAV.map(item => {
          const active = isActive(item.to);
          const isWatchlist = item.to === "/watchlist";
          return (
            <Link key={item.to} to={item.to} className={`app-header-link${active ? " active" : ""}`}>
              {item.label}
              {isWatchlist && count > 0 && (
                <span className="app-header-badge" style={{
                  background: isFull ? "rgba(239,68,68,0.18)" : isNearLimit ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.08)",
                  color: isFull ? "#ef4444" : isNearLimit ? "#f59e0b" : "rgba(255,255,255,0.7)",
                }}>
                  {count}/{capacity}
                </span>
              )}
            </Link>
          );
        })}
          <UserMenu variant="filled" />
        </nav>
        <button
          type="button"
          className="app-header-menu-toggle"
          aria-label={mobileMenuOpen ? "关闭导航菜单" : "打开导航菜单"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(value => !value)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {mobileMenuOpen && (
        <nav className="app-header-mobile-menu" aria-label="移动端导航">
          {NAV.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`app-header-mobile-link${isActive(item.to) ? " active" : ""}`}
            >
              <span>{item.label}</span>
              {item.to === "/watchlist" && count > 0 && <span>{count}/{capacity}</span>}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
