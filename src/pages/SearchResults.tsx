import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, ArrowUpRight, Clock, Grid3X3, List, ChevronLeft, ChevronRight, ArrowRight, ExternalLink, SlidersHorizontal, X, Bookmark, TrendingUp, CornerDownRight, Eye, EyeOff } from "lucide-react";
import { useSearchHistory } from "../hooks/useSearchHistory";
import { useViewPreference } from "../hooks/useViewPreference";
import { useWatchlist } from "../hooks/useWatchlist";
import WatchlistToggle from "../components/WatchlistToggle";
import SearchEmptyState from "../components/SearchEmptyState";
import BrandSelect from "../components/BrandSelect";
import AppHeader from "../components/AppHeader";
import Footer from "../components/Footer";
import { WATCHLIST_CAPACITY } from "../lib/constants";
import { searchWatches } from "../api/search";
import { listBrands } from "../api/brands";
import { buildPageList } from "../utils/pagination";
import { getWatchHref } from "../lib/watchRoutes";
import type { WatchListItem } from "../api/types";

// ─── MOCK DATA (24 watches) ─────────────────────────────
const WATCHES = [
  { id: 1, ref: "126610LN", brand: "Rolex", family: "Submariner", name: "Submariner Date", dialColor: "Black", material: "Stainless Steel (Oystersteel)", listings: 342, image: "https://cdn.watchbase.com/watch/lg/rolex/submariner/126610ln-0001-8c.jpg" },
  { id: 2, ref: "126710BLRO", brand: "Rolex", family: "GMT-Master II", name: "GMT-Master II Pepsi", dialColor: "Black", material: "Stainless Steel (Oystersteel)", listings: 287, image: "https://cdn.watchbase.com/watch/lg/rolex/gmt-master-ii/126710blro-0001-c4.jpg" },
  { id: 3, ref: "126500LN", brand: "Rolex", family: "Daytona", name: "Cosmograph Daytona", dialColor: "White", material: "Stainless Steel (Oystersteel)", listings: 198, image: "https://cdn.watchbase.com/watch/lg/rolex/daytona/126500ln-0001-7b.jpg" },
  { id: 4, ref: "124300", brand: "Rolex", family: "Oyster Perpetual", name: "Oyster Perpetual 41", dialColor: "Green", material: "Stainless Steel (Oystersteel)", listings: 156, image: "https://cdn.watchbase.com/watch/lg/rolex/oyster-perpetual/124300-0005-1c.jpg" },
  { id: 5, ref: "126234", brand: "Rolex", family: "Datejust", name: "Datejust 36", dialColor: "Blue", material: "Stainless Steel / White Gold", listings: 423, image: "https://cdn.watchbase.com/watch/lg/rolex/datejust/126234-0057-c6.jpg" },
  { id: 6, ref: "228235", brand: "Rolex", family: "Day-Date", name: "Day-Date 40", dialColor: "Olive Green", material: "Everose Gold", listings: 89, image: "https://cdn.watchbase.com/watch/lg/rolex/day-date/228235-0025-72.jpg" },
  { id: 7, ref: "326934", brand: "Rolex", family: "Sky-Dweller", name: "Sky-Dweller", dialColor: "Blue", material: "Stainless Steel / White Gold", listings: 134, image: "https://cdn.watchbase.com/watch/lg/rolex/sky-dweller/326934-0003-fb.jpg" },
  { id: 8, ref: "226570", brand: "Rolex", family: "Explorer II", name: "Explorer II", dialColor: "White", material: "Stainless Steel (Oystersteel)", listings: 201, image: "https://cdn.watchbase.com/watch/lg/rolex/explorer-ii/226570-0001-f0.jpg" },
  { id: 9, ref: "15500ST.OO.1220ST.01", brand: "Audemars Piguet", family: "Royal Oak", name: "Royal Oak Selfwinding", dialColor: "Blue", material: "Stainless Steel", listings: 167, image: "https://cdn.watchbase.com/watch/lg/audemars-piguet/royal-oak/15500st-oo-1220st-01-db.jpg" },
  { id: 10, ref: "26331ST.OO.1220ST.01", brand: "Audemars Piguet", family: "Royal Oak", name: "Royal Oak Chronograph", dialColor: "Blue", material: "Stainless Steel", listings: 112, image: "https://cdn.watchbase.com/watch/lg/audemars-piguet/royal-oak/26331st-oo-1220st-01-c9.jpg" },
  { id: 11, ref: "15202ST.OO.1240ST.01", brand: "Audemars Piguet", family: "Royal Oak", name: 'Royal Oak "Jumbo" Extra-Thin', dialColor: "Blue", material: "Stainless Steel", listings: 45, image: "https://cdn.watchbase.com/watch/lg/audemars-piguet/royal-oak/15202st-oo-1240st-01-7e.jpg" },
  { id: 12, ref: "26238ST.OO.2000ST.01", brand: "Audemars Piguet", family: "Royal Oak", name: "Royal Oak Selfwinding Chronograph", dialColor: "Black", material: "Stainless Steel", listings: 78, image: "https://cdn.watchbase.com/watch/lg/audemars-piguet/royal-oak/15500st-oo-1220st-01-db.jpg" },
  { id: 13, ref: "5711/1A-010", brand: "Patek Philippe", family: "Nautilus", name: "Nautilus", dialColor: "Blue", material: "Stainless Steel", listings: 34, image: "https://cdn.watchbase.com/watch/lg/patek-philippe/nautilus/5711-1a-010-2a.jpg" },
  { id: 14, ref: "5167A-001", brand: "Patek Philippe", family: "Aquanaut", name: "Aquanaut", dialColor: "Black", material: "Stainless Steel", listings: 56, image: "https://cdn.watchbase.com/watch/lg/patek-philippe/aquanaut/5167a-001-1c.jpg" },
  { id: 15, ref: "5196G-001", brand: "Patek Philippe", family: "Calatrava", name: "Calatrava", dialColor: "Silver", material: "White Gold", listings: 28, image: "https://cdn.watchbase.com/watch/lg/patek-philippe/calatrava/5196g-001-71.jpg" },
  { id: 16, ref: "310.30.42.50.01.002", brand: "Omega", family: "Speedmaster", name: "Speedmaster Professional Moonwatch", dialColor: "Black", material: "Stainless Steel", listings: 512, image: "https://cdn.watchbase.com/watch/lg/omega/speedmaster/310-30-42-50-01-002-3f.jpg" },
  { id: 17, ref: "210.30.42.20.03.001", brand: "Omega", family: "Seamaster", name: "Seamaster Diver 300M", dialColor: "Blue", material: "Stainless Steel", listings: 389, image: "https://cdn.watchbase.com/watch/lg/omega/seamaster/210-30-42-20-03-001-48.jpg" },
  { id: 18, ref: "131.33.41.21.06.001", brand: "Omega", family: "Constellation", name: "Constellation Globemaster", dialColor: "Grey", material: "Stainless Steel", listings: 95, image: "https://cdn.watchbase.com/watch/lg/omega/constellation/131-33-41-21-06-001-d3.jpg" },
  { id: 19, ref: "WSSA0018", brand: "Cartier", family: "Santos", name: "Santos de Cartier Medium", dialColor: "Silver", material: "Stainless Steel", listings: 234, image: "https://cdn.watchbase.com/watch/lg/cartier/santos/wssa0018-a3.jpg" },
  { id: 20, ref: "WSBB0015", brand: "Cartier", family: "Ballon Bleu", name: "Ballon Bleu de Cartier 36mm", dialColor: "Silver", material: "Stainless Steel", listings: 178, image: "https://cdn.watchbase.com/watch/lg/cartier/ballon-bleu/wsbb0015-ee.jpg" },
  { id: 21, ref: "M79030N-0001", brand: "Tudor", family: "Black Bay", name: "Black Bay Fifty-Eight", dialColor: "Black", material: "Stainless Steel", listings: 267, image: "https://cdn.watchbase.com/watch/lg/tudor/black-bay/m79030n-0001-94.jpg" },
  { id: 22, ref: "M79360N-0002", brand: "Tudor", family: "Black Bay", name: "Black Bay Chrono", dialColor: "Black", material: "Stainless Steel", listings: 143, image: "https://cdn.watchbase.com/watch/lg/tudor/black-bay/m79360n-0002-0b.jpg" },
  { id: 23, ref: "SBGA211", brand: "Grand Seiko", family: "Heritage", name: 'Heritage "Snowflake"', dialColor: "White", material: "Titanium", listings: 189, image: "https://cdn.watchbase.com/watch/lg/grand-seiko/heritage/sbga211-9c.jpg" },
  { id: 24, ref: "SLGH005", brand: "Grand Seiko", family: "Heritage", name: 'Heritage "White Birch"', dialColor: "White", material: "Stainless Steel", listings: 97, image: "https://cdn.watchbase.com/watch/lg/grand-seiko/heritage/slgh005-59.jpg" },
];

const PER_PAGE = 12;
const FALLBACK_BRAND_NAMES = ["Rolex", "Omega", "Patek Philippe", "Audemars Piguet", "Cartier", "IWC", "Tudor", "Grand Seiko"];

// ─── PLACEHOLDER IMAGE ──────────────────────────────────
function WatchPlaceholder({ size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" fill="rgba(255,255,255,0.03)" />
      <circle cx="60" cy="56" r="32" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" fill="none" />
      <circle cx="60" cy="56" r="26" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none" />
      <line x1="60" y1="56" x2="60" y2="38" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="60" y1="56" x2="72" y2="56" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="60" cy="56" r="2" fill="rgba(255,255,255,0.2)" />
      <rect x="56" y="24" width="8" height="6" rx="1" fill="rgba(255,255,255,0.08)" />
      <rect x="55" y="88" width="10" height="14" rx="2" fill="rgba(255,255,255,0.06)" />
      <rect x="55" y="18" width="10" height="8" rx="2" fill="rgba(255,255,255,0.06)" />
      <text x="60" y="108" textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="7" fontFamily="Barlow, sans-serif">NO IMAGE</text>
    </svg>
  );
}

// ─── WATCH IMAGE ─────────────────────────────────────────
function WatchImage({ src, alt, size = 120, className = "" }) {
  const [err, setErr] = useState(false);
  if (err || !src) return <WatchPlaceholder size={size} />;
  return (
    <img
      src={src} alt={alt}
      onError={() => setErr(true)}
      style={{ width: size, height: size, objectFit: "contain", display: "block" }}
    />
  );
}

// ─── MAIN ────────────────────────────────────────────────
export default function SearchResults() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { push: pushHistory } = useSearchHistory();

  // URL ?q=&page=&brand= 驱动状态，刷新可还原
  const urlQ = params.get("q") || "";
  const urlBrand = params.get("brand") || "全部";
  const urlPage = Math.max(1, Number(params.get("page") || 1));
  const urlSort = params.get("sort") || "tx_desc"; // 默认按成交数排序
  const showZeroTransactions = params.get("includeZero") === "1"; // 默认隐藏 0 交易型号

  const [searchValue, setSearchValue] = useState(urlQ);
  const [viewMode, setViewMode] = useViewPreference<"card" | "list">("search-view", "card");
  const [showFilters, setShowFilters] = useState(false);
  const [brandNames, setBrandNames] = useState<string[]>(FALLBACK_BRAND_NAMES);

  useEffect(() => { setSearchValue(urlQ); }, [urlQ]);

  useEffect(() => {
    let alive = true;
    listBrands()
      .then(r => {
        if (!alive || !r.items?.length) return;
        setBrandNames(r.items.map(b => b.name).sort((a, b) => a.localeCompare(b)));
      })
      .catch(() => undefined);
    return () => { alive = false; };
  }, []);

  function updateParams(patch: Record<string, string | number | null>) {
    const np = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "" || (k === "brand" && v === "全部") || (k === "page" && Number(v) === 1)) {
        np.delete(k);
      } else {
        np.set(k, String(v));
      }
    }
    setParams(np, { replace: true });
  }

  function submitSearch(q: string) {
    const term = q.trim();
    if (term) pushHistory(term);
    updateParams({ q: term, page: 1 });
  }

  // Phase 11.F.2 —— 列表数据从 GET /api/search 拉，分页 + 品牌过滤都由后端处理
  const [pageData, setPageData] = useState<WatchListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageJump, setPageJump] = useState(String(urlPage));

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setPageData([]); // 清掉上一次结果，避免新搜索加载时还显示旧卡片
    searchWatches({
      q: urlQ || undefined,
      brand: urlBrand === "全部" ? undefined : urlBrand,
      page: urlPage,
      size: PER_PAGE,
      sort: urlSort,
      include_zero: showZeroTransactions,
    })
      .then(r => { if (!alive) return; setPageData(r.items); setTotal(r.total); })
      .catch(() => { if (!alive) return; setPageData([]); setTotal(0); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; }; // 丢弃过期请求，避免旧结果覆盖新搜索
  }, [urlQ, urlBrand, urlPage, urlSort, showZeroTransactions]);

  const brands = ["全部", ...brandNames];

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(urlPage, totalPages);

  const heading = "'Instrument Serif','Noto Serif SC',serif";
  const body = "'Barlow','Noto Sans SC',sans-serif";

  const goPage = (p: number) => { updateParams({ page: Math.max(1, Math.min(p, totalPages)) }); window.scrollTo({ top: 0, behavior: "smooth" }); };

  useEffect(() => { setPageJump(String(page)); }, [page]);

  const submitPageJump = () => {
    const requestedPage = Number(pageJump);
    if (!Number.isFinite(requestedPage)) return;
    goPage(Math.trunc(requestedPage));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Barlow:wght@300;400;500;600&family=Noto+Serif+SC:wght@400;600;700&family=Noto+Sans+SC:wght@300;400;500&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }

        .gc {
          background: rgba(255,255,255,0.06);
          background-blend-mode: luminosity;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: none;
          border-radius: 20px;
          box-shadow:
            inset 0 1px 1px rgba(255,255,255,0.15),
            inset 0 -1px 1px rgba(255,255,255,0.05),
            0 4px 30px rgba(0,0,0,0.12);
          position: relative; overflow: hidden;
        }
        .gc::before {
          content:''; position:absolute; inset:0; border-radius:inherit; padding:1.4px;
          background: linear-gradient(
            180deg,
            rgba(255,255,255,0.4) 0%,
            rgba(255,255,255,0.15) 20%,
            rgba(255,255,255,0) 40%,
            rgba(255,255,255,0) 60%,
            rgba(255,255,255,0.15) 80%,
            rgba(255,255,255,0.4) 100%
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude; pointer-events:none;
        }
        .gc::after {
          content:''; position:absolute; top:-50%; left:-50%; width:200%; height:200%;
          background: radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.05) 0%, transparent 50%);
          pointer-events:none;
        }

        .gp {
          background: rgba(255,255,255,0.08);
          background-blend-mode: luminosity;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: none;
          border-radius: 9999px;
          box-shadow:
            inset 0 1px 1px rgba(255,255,255,0.15),
            0 2px 12px rgba(0,0,0,0.08);
          position: relative; overflow: hidden;
        }
        .gp::before {
          content:''; position:absolute; inset:0; border-radius:inherit; padding:1px;
          background: linear-gradient(
            180deg,
            rgba(255,255,255,0.35) 0%,
            rgba(255,255,255,0.1) 30%,
            rgba(255,255,255,0) 50%,
            rgba(255,255,255,0.1) 70%,
            rgba(255,255,255,0.35) 100%
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude; pointer-events:none;
        }

        .gs {
          background: rgba(255,255,255,0.06);
          background-blend-mode: luminosity;
          backdrop-filter: blur(50px);
          -webkit-backdrop-filter: blur(50px);
          border: none;
          border-radius: 9999px;
          box-shadow:
            4px 4px 4px rgba(0,0,0,0.05),
            inset 0 1px 1px rgba(255,255,255,0.2);
          position: relative; overflow: hidden;
        }
        .gs::before {
          content:''; position:absolute; inset:0; border-radius:inherit; padding:1.4px;
          background: linear-gradient(
            180deg,
            rgba(255,255,255,0.5) 0%,
            rgba(255,255,255,0.2) 20%,
            rgba(255,255,255,0) 40%,
            rgba(255,255,255,0) 60%,
            rgba(255,255,255,0.2) 80%,
            rgba(255,255,255,0.5) 100%
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude; pointer-events:none;
        }

        .watch-card {
          transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
          cursor: pointer;
        }
        .watch-card:hover {
          background: rgba(255,255,255,0.1);
          transform: translateY(-3px);
          box-shadow: inset 0 1px 1px rgba(255,255,255,0.2), 0 12px 40px rgba(0,0,0,0.3);
        }

        .watch-row {
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .watch-row:hover {
          background: rgba(255,255,255,0.06);
        }

        .sc {
          transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
          background: rgba(255,255,255,0.05);
          background-blend-mode: luminosity;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: none;
          box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);
          position: relative; overflow: hidden;
        }
        .sc::before {
          content:''; position:absolute; inset:0; border-radius:inherit; padding:1px;
          background: linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.08) 70%, rgba(255,255,255,0.25) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude; pointer-events:none;
        }
        .sc:focus-within { box-shadow: inset 0 1px 1px rgba(255,255,255,0.15), 0 0 0 1px rgba(255,255,255,0.15), 0 8px 40px rgba(0,0,0,0.3); }

        .mode-btn {
          transition: all 0.2s ease; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 10px; border: none;
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        }
        .mode-btn:hover { background: rgba(255,255,255,0.12); box-shadow: inset 0 1px 0 rgba(255,255,255,0.1); }

        .page-btn {
          transition: all 0.2s ease; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          min-width: 36px; height: 36px; border-radius: 10px; border: none;
          font-size: 13px; font-weight: 400;
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        }
        .page-btn:hover { background: rgba(255,255,255,0.12); box-shadow: inset 0 1px 0 rgba(255,255,255,0.1); }
        .page-jump-input { -moz-appearance: textfield; }
        .page-jump-input::-webkit-inner-spin-button,
        .page-jump-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

        .filter-chip {
          transition: all 0.2s ease; cursor: pointer; border: none;
          padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 400;
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .filter-chip:hover { background: rgba(255,255,255,0.14); box-shadow: inset 0 1px 0 rgba(255,255,255,0.12); }

        .tag {
          display: inline-flex; align-items: center;
          padding: 3px 10px; border-radius: 8px; font-size: 11px; font-weight: 400;
          background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5);
          white-space: nowrap;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
          backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
        }

        ::selection { background: rgba(255,255,255,0.2); color: #fff; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.15); border-radius:3px; }
      `}</style>

      <AppHeader
        showSearch
        searchValue={searchValue}
        onSearch={submitSearch}
        searchLeading={<BrandSelect value={urlBrand} onChange={brand => updateParams({ brand, page: 1 })} fontFamily={body} compact />}
      />

      {/* ═══ MAIN CONTENT ═══ */}
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "88px 40px 60px", position: "relative" }}>
        {/* Ambient gradient orbs */}
        <div style={{
          position: "fixed", top: "0", left: "15%",
          width: "600px", height: "500px",
          background: "radial-gradient(ellipse, rgba(80,120,200,0.07) 0%, transparent 60%)",
          pointerEvents: "none", zIndex: 0,
        }} />
        <div style={{
          position: "fixed", bottom: "10%", right: "5%",
          width: "500px", height: "400px",
          background: "radial-gradient(ellipse, rgba(140,100,200,0.05) 0%, transparent 60%)",
          pointerEvents: "none", zIndex: 0,
        }} />
        <div style={{
          position: "fixed", top: "40%", left: "-5%",
          width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(100,180,160,0.04) 0%, transparent 60%)",
          pointerEvents: "none", zIndex: 0,
        }} />

        {/* ─── Results header ─── */}
        <div className="mobile-page-heading mobile-stack" style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "24px", paddingTop: "12px",
        }}>
          <div>
            <h1 style={{
              fontFamily: "'Noto Serif SC', serif", fontSize: "28px", fontWeight: 700,
              color: "#fff", marginBottom: "4px",
            }}>
              {urlQ ? (urlBrand === "全部" ? `"${urlQ}" 的搜索结果` : `"${urlQ}" 在 ${urlBrand} 中的搜索结果`) : (urlBrand === "全部" ? "全部表款" : `${urlBrand} 表款`)}
            </h1>
            <p style={{ fontSize: "13px", fontWeight: 300, color: "rgba(255,255,255,0.4)", fontFamily: body }}>
              {loading ? "加载中..." : `${urlBrand === "全部" ? "" : `${urlBrand} · `}共找到 ${total} 个型号`}
            </p>
          </div>

          <div className="mobile-actions" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Sort toggle: 默认按成交数(tx_desc)，点击切回字母序(alpha) */}
            <button className="mode-btn" onClick={() => updateParams({ sort: urlSort === "tx_desc" ? "alpha" : null, page: 1 })} title={urlSort === "tx_desc" ? "当前：按成交数排序（点击切字母序）" : "当前：字母序（点击按成交数排序）"} style={{
              background: urlSort === "tx_desc" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
              color: "#fff", width: "auto", padding: "0 12px", display: "flex", alignItems: "center", gap: "6px",
            }}>
              <TrendingUp size={16} color={urlSort === "tx_desc" ? "#fff" : "rgba(255,255,255,0.5)"} />
              <span style={{ fontSize: "12px", fontWeight: 500, color: urlSort === "tx_desc" ? "#fff" : "rgba(255,255,255,0.5)" }}>成交</span>
            </button>

            {/* Zero-transaction toggle: 默认隐藏 0 交易型号，点击显示 */}
            <button className="mode-btn" onClick={() => updateParams({ includeZero: showZeroTransactions ? null : 1, page: 1 })} title={showZeroTransactions ? "隐藏 0 条交易记录的型号" : "显示 0 条交易记录的型号"} aria-pressed={showZeroTransactions} style={{
              background: showZeroTransactions ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
              color: "#fff", width: "auto", padding: "0 12px", display: "flex", alignItems: "center", gap: "6px",
            }}>
              {showZeroTransactions ? <Eye size={16} /> : <EyeOff size={16} color="rgba(255,255,255,0.5)" />}
              <span style={{ fontSize: "12px", fontWeight: 500, color: showZeroTransactions ? "#fff" : "rgba(255,255,255,0.5)" }}>0 条</span>
            </button>

            {/* Divider */}
            <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.1)" }} />

            {/* Filter toggle */}
            <button className="mode-btn" onClick={() => setShowFilters(!showFilters)} style={{
              background: showFilters ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
              color: "#fff",
            }}>
              <SlidersHorizontal size={16} color={showFilters ? "#fff" : "rgba(255,255,255,0.5)"} />
            </button>

            {/* Divider */}
            <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.1)" }} />

            {/* View toggle */}
            <button className="mode-btn" onClick={() => setViewMode("card")} style={{
              background: viewMode === "card" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
            }}>
              <Grid3X3 size={16} color={viewMode === "card" ? "#fff" : "rgba(255,255,255,0.4)"} />
            </button>
            <button className="mode-btn" onClick={() => setViewMode("list")} style={{
              background: viewMode === "list" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
            }}>
              <List size={16} color={viewMode === "list" ? "#fff" : "rgba(255,255,255,0.4)"} />
            </button>
          </div>
        </div>

        {/* ─── Filters bar ─── */}
        {showFilters && (
          <div className="gc" style={{
            display: "flex", flexWrap: "wrap", gap: "6px",
            marginBottom: "24px", padding: "16px 20px",
            borderRadius: "16px",
          }}>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", lineHeight: "30px", marginRight: "4px", fontFamily: body }}>品牌：</span>
            {brands.map((b, i) => (
              <button key={i} className="filter-chip" onClick={() => updateParams({ brand: b, page: 1 })} style={{
                background: urlBrand === b ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.04)",
                color: urlBrand === b ? "#fff" : "rgba(255,255,255,0.5)",
                fontFamily: body,
              }}>{b}</button>
            ))}
          </div>
        )}

        {/* ─── CARD VIEW ─── */}
        {viewMode === "card" && (
          <div className="mobile-card-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
          }}>
            {pageData.map((w) => (
              <div key={w.catalogId ?? w.ref} className="gc watch-card mobile-card"
                   onClick={() => navigate(getWatchHref(w.ref, w.catalogId))}
                   style={{ padding: 0, display: "flex", flexDirection: "column", cursor: "pointer" }}>
                {/* Image */}
                <div className="mobile-card-image" style={{
                  width: "100%", aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(255,255,255,0.02)",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  overflow: "hidden",
                }}>
                  <WatchImage src={w.thumbUrl} alt={w.name} size={160} />
                </div>

                {/* Info */}
                <div className="mobile-card-body" style={{ padding: "16px 18px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
                  {/* Brand + Family */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 500, color: "rgba(255,255,255,0.4)", fontFamily: body, textTransform: "uppercase", letterSpacing: "0.8px" }}>{w.brand}</span>
                    <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)" }}>·</span>
                    <span style={{ fontSize: "11px", fontWeight: 400, color: "rgba(255,255,255,0.35)", fontFamily: body }}>{w.family}</span>
                  </div>

                  {/* Ref + Bookmark — same line */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3px" }}>
                    <h3 style={{
                      fontSize: "15px", fontWeight: 600, color: "#fff",
                      fontFamily: body, lineHeight: 1.3, letterSpacing: "0.3px",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0,
                    }}>Ref. {w.ref}</h3>
                    <WatchlistToggle entry={{ catalogId: w.catalogId, ref: w.ref, brand: w.brand, name: w.name, thumbUrl: w.thumbUrl }} variant="icon" />

                  </div>

                  {/* Name — secondary */}
                  <p style={{ fontSize: "12px", fontWeight: 300, color: "rgba(255,255,255,0.4)", fontFamily: body, marginBottom: "12px" }}>
                    {w.name}
                  </p>

                  {/* Tags */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "14px" }}>
                    {w.dialColor && <span className="tag">{w.dialColor}</span>}
                    {w.material && <span className="tag">{w.material.length > 18 ? w.material.split(" ").slice(0,2).join(" ") : w.material}</span>}
                  </div>

                  {/* Transaction count — bottom */}
                  <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{
                        width: "6px", height: "6px", borderRadius: "50%",
                        background: "#22c55e",
                      }} />
                      <span style={{ fontSize: "12px", fontWeight: 400, color: "rgba(255,255,255,0.6)", fontFamily: body }}>
                        {w.transactions ?? 0} 条交易记录
                      </span>
                    </div>
                    <ArrowRight size={14} color="rgba(255,255,255,0.25)" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── LIST VIEW ─── */}
        {viewMode === "list" && (
          <div className="gc mobile-list-shell" style={{ padding: 0, overflow: "hidden" }}>
            {/* Table header */}
            <div className="mobile-list-header" style={{
              display: "grid",
              gridTemplateColumns: "48px 1fr 100px 90px 150px 90px 36px 32px",
              padding: "12px 20px", gap: "12px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              alignItems: "center",
            }}>
              {["", "Ref / 型号", "系列", "表盘颜色", "材质", "交易数", "", ""].map((h, i) => (
                <span key={i} style={{
                  fontSize: "10px", fontWeight: 500, color: "rgba(255,255,255,0.3)",
                  textTransform: "uppercase", letterSpacing: "1.2px", fontFamily: body,
                  whiteSpace: "nowrap",
                }}>{h}</span>
              ))}
            </div>

            {/* Rows */}
            {pageData.map((w, i) => (
              <div key={w.catalogId ?? w.ref} className="watch-row mobile-list-row"
                   onClick={() => navigate(getWatchHref(w.ref, w.catalogId))}
                   style={{
                     display: "grid",
                     gridTemplateColumns: "48px 1fr 100px 90px 150px 90px 36px 32px",
                     padding: "10px 20px", gap: "12px",
                     borderBottom: i < pageData.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                     alignItems: "center",
                     cursor: "pointer",
                   }}>
                {/* Thumbnail */}
                <div className="mobile-list-thumb" style={{
                  width: "42px", height: "42px", borderRadius: "8px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", flexShrink: 0,
                }}>
                  <WatchImage src={w.thumbUrl} alt={w.name} size={36} />
                </div>

                {/* Ref + Brand + Name — single column, horizontal */}
                <div className="mobile-list-main" style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden", minWidth: 0 }}>
                  <span style={{
                    fontSize: "13px", fontWeight: 600, color: "#fff", fontFamily: body,
                    letterSpacing: "0.3px", whiteSpace: "nowrap", flexShrink: 0,
                  }}>{w.ref}</span>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.15)", flexShrink: 0 }}>|</span>
                  <span style={{
                    fontSize: "12px", fontWeight: 400, color: "rgba(255,255,255,0.4)", fontFamily: body,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0,
                  }}>{w.brand} {w.name}</span>
                </div>

                {/* Family */}
                <span className="mobile-list-secondary" style={{
                  fontSize: "12px", fontWeight: 400, color: "rgba(255,255,255,0.45)", fontFamily: body,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>{w.family}</span>

                {/* Dial Color */}
                <div className="mobile-list-secondary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{
                    width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0,
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: w.dialColor === "Black" ? "#1a1a1a" :
                                w.dialColor === "Blue" ? "#1e3a5f" :
                                w.dialColor === "White" ? "#e8e8e8" :
                                w.dialColor === "Green" ? "#1a3a1a" :
                                w.dialColor === "Silver" ? "#b0b0b0" :
                                w.dialColor === "Grey" ? "#666" :
                                w.dialColor === "Olive Green" ? "#4a5a2a" : "#888",
                  }} />
                  <span style={{ fontSize: "12px", fontWeight: 400, color: "rgba(255,255,255,0.5)", fontFamily: body }}>{w.dialColor}</span>
                </div>

                {/* Material */}
                <span className="mobile-list-secondary" style={{
                  fontSize: "12px", fontWeight: 300, color: "rgba(255,255,255,0.4)", fontFamily: body,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>{w.material}</span>

                {/* Transaction count */}
                <div className="mobile-list-count" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "rgba(255,255,255,0.7)", fontFamily: body }}>{w.transactions ?? 0} 条</span>
                </div>

                <div className="mobile-list-action">
                  <WatchlistToggle entry={{ catalogId: w.catalogId, ref: w.ref, brand: w.brand, name: w.name, thumbUrl: w.thumbUrl }} variant="icon" />
                </div>


                {/* Arrow */}
                <div className="mobile-list-arrow" style={{ display: "flex", justifyContent: "center" }}>
                  <ChevronRight size={15} color="rgba(255,255,255,0.2)" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── PAGINATION ─── */}
        {totalPages > 1 && (
          <div className="mobile-pagination" style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "4px", marginTop: "32px",
          }}>
            <button className="page-btn" onClick={() => goPage(page - 1)}
              disabled={page === 1}
              style={{
                background: "rgba(255,255,255,0.04)",
                color: page === 1 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.6)",
                cursor: page === 1 ? "default" : "pointer",
              }}>
              <ChevronLeft size={16} />
            </button>

            {buildPageList(page, totalPages).map((p, i) => (
              p === "..."
                ? <span key={`e${i}`} className="page-btn" style={{cursor:"default",color:"rgba(255,255,255,0.3)",fontFamily:body}}>…</span>
                : <button key={p} className="page-btn" onClick={() => goPage(p)} style={{
                    background: p === page ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.04)",
                    color: p === page ? "#fff" : "rgba(255,255,255,0.5)",
                    fontFamily: body, fontWeight: p === page ? 500 : 400,
                  }}>{p}</button>
            ))}

            <button className="page-btn" onClick={() => goPage(page + 1)}
              disabled={page === totalPages}
              style={{
                background: "rgba(255,255,255,0.04)",
                color: page === totalPages ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.6)",
                cursor: page === totalPages ? "default" : "pointer",
              }}>
              <ChevronRight size={16} />
            </button>
            <form
              onSubmit={e => { e.preventDefault(); submitPageJump(); }}
              style={{ display: "flex", alignItems: "center", gap: "4px", marginLeft: "8px" }}
            >
              <input
                type="number"
                className="page-jump-input"
                min={1}
                max={totalPages}
                value={pageJump}
                onChange={e => setPageJump(e.target.value)}
                aria-label="跳转页码"
                title={`输入页码，范围 1-${totalPages}`}
                style={{
                  width: "64px", height: "36px", padding: "0 8px",
                  borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)",
                  outline: "none", background: "rgba(255,255,255,0.04)",
                  color: "#fff", fontFamily: body, fontSize: "13px", textAlign: "center",
                }}
              />
              <button
                type="submit"
                className="page-btn"
                title="跳转到指定页"
                aria-label="跳转到指定页"
                style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" }}
              >
                <CornerDownRight size={16} />
              </button>
            </form>
          </div>
        )}

        {/* ─── Empty state (PDF 3.1.1.8) ─── */}
        {!loading && total === 0 && <SearchEmptyState query={urlQ} />}
      </main>

      {/* overflow modal removed — toast 已统一提示（共享 WatchlistToggle 处理） */}

      <Footer />
    </div>
  );
}
