/**
 * ============================================================
 * Raventik — Brand Watch Models Page
 * ============================================================
 * 
 * Route: /brands/:slug (e.g. /brands/rolex)
 * 
 * SHARED CARD COMPONENT:
 *   This page's watch card is identical to search results page,
 *   with bookmark icon on the Ref line. Watchlist page reuses
 *   the same card — only data source and header differ.
 * 
 * ENGINEER NOTES:
 *   - Extract the watch card into a shared component
 *   - Bookmark state: API GET /api/watchlist → returns array of followed refs
 *   - Toggle: POST /api/watchlist/:ref (add) / DELETE /api/watchlist/:ref (remove)
 *   - Brand data: GET /api/brands/:slug/watches?page=&family=
 * ============================================================
 */

import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Clock, Grid3X3, List, ChevronLeft, ChevronRight, ArrowRight, Bookmark, SlidersHorizontal, X, CornerDownRight } from "lucide-react";
import { useViewPreference } from "../hooks/useViewPreference";
import WatchlistToggle from "../components/WatchlistToggle";
import AppHeader from "../components/AppHeader";
import { getBrand } from "../api/brands";
import type { BrandDetail, WatchListItem } from "../api/types";
import { buildPageList } from "../utils/pagination";
import { getWatchHref } from "../lib/watchRoutes";

// ─── MOCK DATA ───────────────────────────────────────────
const BRAND = {
  name: "Rolex",
  nameCn: "劳力士",
  slug: "rolex",
  logoUrl: null, // BRAND_LOGO_PLACEHOLDER: 100x28px
  totalModels: 142,
  totalTransactions: 12400,
};

const WATCHES = [
  { id: 1, ref: "126610LN", brand: "Rolex", family: "Submariner", name: "Submariner Date", dialColor: "Black", material: "Oystersteel", transactions: 342, followed: true },
  { id: 2, ref: "126710BLRO", brand: "Rolex", family: "GMT-Master II", name: "GMT-Master II Pepsi", dialColor: "Black", material: "Oystersteel", transactions: 287, followed: false },
  { id: 3, ref: "126500LN", brand: "Rolex", family: "Daytona", name: "Cosmograph Daytona", dialColor: "White", material: "Oystersteel", transactions: 198, followed: true },
  { id: 4, ref: "124300", brand: "Rolex", family: "Oyster Perpetual", name: "Oyster Perpetual 41", dialColor: "Green", material: "Oystersteel", transactions: 156, followed: false },
  { id: 5, ref: "126234", brand: "Rolex", family: "Datejust", name: "Datejust 36", dialColor: "Blue", material: "Steel / White Gold", transactions: 423, followed: false },
  { id: 6, ref: "228235", brand: "Rolex", family: "Day-Date", name: "Day-Date 40", dialColor: "Olive Green", material: "Everose Gold", transactions: 89, followed: false },
  { id: 7, ref: "326934", brand: "Rolex", family: "Sky-Dweller", name: "Sky-Dweller", dialColor: "Blue", material: "Steel / White Gold", transactions: 134, followed: true },
  { id: 8, ref: "226570", brand: "Rolex", family: "Explorer II", name: "Explorer II", dialColor: "White", material: "Oystersteel", transactions: 201, followed: false },
  { id: 9, ref: "126610LV", brand: "Rolex", family: "Submariner", name: "Submariner Date Starbucks", dialColor: "Black", material: "Oystersteel", transactions: 278, followed: false },
  { id: 10, ref: "126711CHNR", brand: "Rolex", family: "GMT-Master II", name: "GMT-Master II Rootbeer", dialColor: "Black", material: "Steel / Everose Gold", transactions: 165, followed: false },
  { id: 11, ref: "116500LN", brand: "Rolex", family: "Daytona", name: "Cosmograph Daytona (Prev.)", dialColor: "White", material: "Oystersteel", transactions: 312, followed: false },
  { id: 12, ref: "126900", brand: "Rolex", family: "Air-King", name: "Air-King", dialColor: "Black", material: "Oystersteel", transactions: 98, followed: false },
];

const PER_PAGE = 12;

// ─── PLACEHOLDER ─────────────────────────────────────────
function WatchPlaceholder({ size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <rect width="120" height="120" fill="rgba(255,255,255,0.03)" />
      <circle cx="60" cy="56" r="32" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" fill="none" />
      <circle cx="60" cy="56" r="26" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none" />
      <line x1="60" y1="56" x2="60" y2="38" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="60" y1="56" x2="72" y2="56" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="60" cy="56" r="2" fill="rgba(255,255,255,0.2)" />
    </svg>
  );
}

function WatchImage({ src, alt, size = 120 }: { src?: string | null; alt?: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (err || !src) return <WatchPlaceholder size={size} />;
  return (
    <img src={src} alt={alt} onError={() => setErr(true)}
         style={{ width: size, height: size, objectFit: "contain", display: "block" }} />
  );
}

// ─── MAIN ────────────────────────────────────────────────
export default function BrandModels() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [viewMode, setViewMode] = useViewPreference<"card" | "list">("brand-view", "card");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageJump, setPageJump] = useState("1");
  const [familyFilter, setFamilyFilter] = useState("全部");
  const [showFilters, setShowFilters] = useState(false);

  const hd = "'Instrument Serif','Noto Serif SC',serif";
  const bd = "'Barlow','Noto Sans SC',sans-serif";

  // 没有 slug 时 App.tsx 已把 /brands 路由到 BrandList,这里只兜底防御
  const effectiveSlug = slug ?? "";

  // Phase 11.F.2 —— 品牌信息 + 表款列表由 GET /api/brands/:slug 拉
  const [detail, setDetail] = useState<BrandDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getBrand(effectiveSlug, {
      family: familyFilter === "全部" ? undefined : familyFilter,
      page: currentPage,
      size: PER_PAGE,
      sort_by: "transactions",
      sort_dir: "desc",
    })
      .then(d => setDetail(d))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [effectiveSlug, familyFilter, currentPage]);

  const families = ["全部", ...(detail?.families ?? [])];
  const total = detail?.watches.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const pageData: WatchListItem[] = useMemo(
    () => [...(detail?.watches.items ?? [])].sort((a, b) => {
      const byTransactions = (b.transactions ?? 0) - (a.transactions ?? 0);
      return byTransactions || a.ref.localeCompare(b.ref);
    }),
    [detail?.watches.items],
  );

  const goPage = (p: number) => { setCurrentPage(Math.max(1, Math.min(p, totalPages))); window.scrollTo({ top: 0, behavior: "smooth" }); };

  useEffect(() => { setPageJump(String(page)); }, [page]);

  const submitPageJump = () => {
    const requestedPage = Number(pageJump);
    if (!Number.isFinite(requestedPage)) return;
    goPage(Math.trunc(requestedPage));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: bd }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Barlow:wght@300;400;500;600&family=Noto+Serif+SC:wght@400;600;700&family=Noto+Sans+SC:wght@300;400;500&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}

        .gc{background:rgba(255,255,255,0.06);background-blend-mode:luminosity;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:none;border-radius:20px;box-shadow:inset 0 1px 1px rgba(255,255,255,0.15),inset 0 -1px 1px rgba(255,255,255,0.05),0 4px 30px rgba(0,0,0,0.12);position:relative;overflow:hidden}
        .gc::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1.4px;background:linear-gradient(180deg,rgba(255,255,255,0.4) 0%,rgba(255,255,255,0.15) 20%,rgba(255,255,255,0) 40%,rgba(255,255,255,0) 60%,rgba(255,255,255,0.15) 80%,rgba(255,255,255,0.4) 100%);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
        .gc::after{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(ellipse at 30% 20%,rgba(255,255,255,0.05) 0%,transparent 50%);pointer-events:none}

        .gp{background:rgba(255,255,255,0.08);background-blend-mode:luminosity;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:none;border-radius:9999px;box-shadow:inset 0 1px 1px rgba(255,255,255,0.15),0 2px 12px rgba(0,0,0,0.08);position:relative;overflow:hidden}
        .gp::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1px;background:linear-gradient(180deg,rgba(255,255,255,0.35) 0%,rgba(255,255,255,0.1) 30%,rgba(255,255,255,0) 50%,rgba(255,255,255,0.1) 70%,rgba(255,255,255,0.35) 100%);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}

        .watch-card{transition:all 0.3s cubic-bezier(0.16,1,0.3,1);cursor:pointer}
        .watch-card:hover{background:rgba(255,255,255,0.1);transform:translateY(-3px);box-shadow:inset 0 1px 1px rgba(255,255,255,0.2),0 12px 40px rgba(0,0,0,0.3)}

        .watch-row{transition:all 0.2s ease;cursor:pointer}
        .watch-row:hover{background:rgba(255,255,255,0.06)}

        .bk-btn{transition:all 0.2s ease;cursor:pointer;border:none;background:none;padding:4px;display:flex;align-items:center;border-radius:6px}
        .bk-btn:hover{background:rgba(255,255,255,0.1)}

        .mode-btn{transition:all 0.2s ease;cursor:pointer;display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;border:none;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
        .mode-btn:hover{background:rgba(255,255,255,0.12);box-shadow:inset 0 1px 0 rgba(255,255,255,0.1)}

        .filter-chip{transition:all 0.2s ease;cursor:pointer;border:none;padding:6px 14px;border-radius:9999px;font-size:12px;font-weight:400;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
        .filter-chip:hover{background:rgba(255,255,255,0.14)}

        .tag{display:inline-flex;align-items:center;padding:3px 10px;border-radius:8px;font-size:11px;font-weight:400;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.5);white-space:nowrap;box-shadow:inset 0 1px 0 rgba(255,255,255,0.08)}

        .pg-btn{transition:all 0.2s ease;cursor:pointer;display:flex;align-items:center;justify-content:center;min-width:32px;height:32px;border-radius:8px;border:none;font-size:12px}
        .pg-btn:hover{background:rgba(255,255,255,0.12)}
        .page-jump-input{-moz-appearance:textfield}
        .page-jump-input::-webkit-inner-spin-button,.page-jump-input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}

        ::selection{background:rgba(255,255,255,0.2);color:#fff}
      `}</style>

      <AppHeader />

      {/* Ambient */}
      <div style={{position:"fixed",top:0,left:"15%",width:"600px",height:"500px",background:"radial-gradient(ellipse,rgba(80,120,200,0.07) 0%,transparent 60%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",bottom:"10%",right:"5%",width:"500px",height:"400px",background:"radial-gradient(ellipse,rgba(140,100,200,0.05) 0%,transparent 60%)",pointerEvents:"none",zIndex:0}}/>

      <main style={{maxWidth:"1280px",margin:"0 auto",padding:"88px 40px 60px",position:"relative",zIndex:1}}>

        {/* ── Brand Header ── */}
        {/* API: GET /api/brands/:slug */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"32px",paddingTop:"12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
            {/* BRAND_LOGO_PLACEHOLDER: Replace with <img src={brand.logoUrl} height={36} /> */}
            <div style={{width:"48px",height:"48px",borderRadius:"12px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:"18px",fontWeight:600,color:"rgba(255,255,255,0.3)",fontFamily:bd}}>{(detail?.brand.name ?? effectiveSlug).charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 style={{fontFamily:hd,fontStyle:"italic",fontSize:"32px",color:"#fff",letterSpacing:"-1px",lineHeight:1}}>{detail?.brand.name ?? effectiveSlug}</h1>
              {detail?.brand.nameCn && <span style={{fontSize:"13px",fontWeight:400,color:"rgba(255,255,255,0.4)",fontFamily:"'Noto Sans SC',sans-serif"}}>{detail.brand.nameCn}</span>}
            </div>
          </div>
          <div style={{display:"flex",gap:"20px"}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:"20px",fontWeight:600,color:"#fff",fontFamily:bd}}>{detail?.brand.modelCount ?? "—"}</div>
              <div style={{fontSize:"11px",fontWeight:300,color:"rgba(255,255,255,0.35)",fontFamily:bd}}>型号</div>
            </div>
            <div style={{width:"1px",background:"rgba(255,255,255,0.08)"}}/>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:"20px",fontWeight:600,color:"#fff",fontFamily:bd}}>{detail?.brand.totalTransactions?.toLocaleString() ?? "—"}</div>
              <div style={{fontSize:"11px",fontWeight:300,color:"rgba(255,255,255,0.35)",fontFamily:bd}}>交易记录</div>
            </div>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"24px"}}>
          <p style={{fontSize:"13px",fontWeight:300,color:"rgba(255,255,255,0.4)",fontFamily:bd}}>{loading ? "加载中..." : `共 ${total} 个型号`}</p>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <button className="mode-btn" onClick={()=>setShowFilters(!showFilters)} style={{background:showFilters?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.04)"}}>
              <SlidersHorizontal size={16} color={showFilters?"#fff":"rgba(255,255,255,0.5)"}/>
            </button>
            <div style={{width:"1px",height:"20px",background:"rgba(255,255,255,0.1)"}}/>
            <button className="mode-btn" onClick={()=>setViewMode("card")} style={{background:viewMode==="card"?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.04)"}}>
              <Grid3X3 size={16} color={viewMode==="card"?"#fff":"rgba(255,255,255,0.4)"}/>
            </button>
            <button className="mode-btn" onClick={()=>setViewMode("list")} style={{background:viewMode==="list"?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.04)"}}>
              <List size={16} color={viewMode==="list"?"#fff":"rgba(255,255,255,0.4)"}/>
            </button>
          </div>
        </div>

        {/* ── Family Filter ── */}
        {showFilters && (
          <div className="gc" style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"24px",padding:"16px 20px",borderRadius:"16px"}}>
            <span style={{fontSize:"11px",color:"rgba(255,255,255,0.3)",lineHeight:"30px",marginRight:"4px",fontFamily:bd}}>系列：</span>
            {families.map((f,i)=>(
              <button key={i} className="filter-chip" onClick={()=>{setFamilyFilter(f);setCurrentPage(1)}} style={{
                background:familyFilter===f?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.04)",
                color:familyFilter===f?"#fff":"rgba(255,255,255,0.5)",fontFamily:bd,
              }}>{f}</button>
            ))}
          </div>
        )}

        {/* ═══ CARD VIEW ═══ */}
        {/* Shared card component — reuse for watchlist page
            Key difference from search results: bookmark icon on Ref line */}
        {viewMode === "card" && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"16px"}}>
            {pageData.map(w => {
              return (
                <div key={w.catalogId ?? w.ref} className="gc watch-card"
                     onClick={() => navigate(getWatchHref(w.ref, w.catalogId))}
                     style={{padding:0,display:"flex",flexDirection:"column"}}>
                  <div style={{width:"100%",aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.02)",borderBottom:"1px solid rgba(255,255,255,0.06)",overflow:"hidden"}}>
                    <WatchImage src={w.thumbUrl} alt={w.name} size={160}/>
                  </div>
                  <div style={{padding:"16px 18px 18px",flex:1,display:"flex",flexDirection:"column"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"6px"}}>
                      <span style={{fontSize:"11px",fontWeight:500,color:"rgba(255,255,255,0.4)",fontFamily:bd,textTransform:"uppercase",letterSpacing:"0.8px"}}>{w.brand}</span>
                      <span style={{fontSize:"11px",color:"rgba(255,255,255,0.2)"}}>·</span>
                      <span style={{fontSize:"11px",fontWeight:400,color:"rgba(255,255,255,0.35)",fontFamily:bd}}>{w.family}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"3px"}}>
                      <h3 style={{fontSize:"15px",fontWeight:600,color:"#fff",fontFamily:bd,letterSpacing:"0.3px",lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0}}>Ref. {w.ref}</h3>
                      <WatchlistToggle entry={{ catalogId: w.catalogId, ref: w.ref, brand: w.brand, name: w.name }} variant="icon" />
                    </div>
                    {/* Name */}
                    <p style={{fontSize:"12px",fontWeight:300,color:"rgba(255,255,255,0.4)",fontFamily:bd,marginBottom:"12px"}}>{w.name}</p>
                    {/* Tags */}
                    <div style={{display:"flex",flexWrap:"wrap",gap:"4px",marginBottom:"14px"}}>
                      {w.dialColor && <span className="tag">{w.dialColor}</span>}
                      {w.material && <span className="tag">{w.material.length>18?w.material.split(" ").slice(0,2).join(" "):w.material}</span>}
                    </div>
                    {/* Transaction count */}
                    <div style={{marginTop:"auto",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                        <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#22c55e"}}/>
                        <span style={{fontSize:"12px",fontWeight:400,color:"rgba(255,255,255,0.6)",fontFamily:bd}}>{w.transactions ?? 0} 条交易记录</span>
                      </div>
                      <ArrowRight size={14} color="rgba(255,255,255,0.25)"/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ LIST VIEW ═══ */}
        {viewMode === "list" && (
          <div className="gc" style={{padding:0,overflow:"hidden"}}>
            {/* Header */}
            <div style={{display:"grid",gridTemplateColumns:"48px 1fr 100px 90px 150px 90px 36px 36px",padding:"12px 20px",gap:"12px",borderBottom:"1px solid rgba(255,255,255,0.06)",alignItems:"center"}}>
              {["","Ref / 型号","系列","表盘颜色","材质","交易数","",""].map((h,i)=>(
                <span key={i} style={{fontSize:"10px",fontWeight:500,color:"rgba(255,255,255,0.3)",letterSpacing:"0.8px",fontFamily:bd,whiteSpace:"nowrap"}}>{h}</span>
              ))}
            </div>
            {/* Rows */}
            {pageData.map((w,i) => {
              return (
                <div key={w.catalogId ?? w.ref} className="watch-row"
                     onClick={() => navigate(getWatchHref(w.ref, w.catalogId))}
                     style={{display:"grid",gridTemplateColumns:"48px 1fr 100px 90px 150px 90px 36px 36px",padding:"10px 20px",gap:"12px",borderBottom:i<pageData.length-1?"1px solid rgba(255,255,255,0.04)":"none",alignItems:"center"}}>
                  {/* Thumbnail */}
                  <div style={{width:"42px",height:"42px",borderRadius:"8px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                    <WatchImage src={w.thumbUrl} alt={w.name} size={36}/>
                  </div>
                  {/* Ref + Name */}
                  <div style={{display:"flex",alignItems:"center",gap:"8px",overflow:"hidden",minWidth:0}}>
                    <span style={{fontSize:"13px",fontWeight:600,color:"#fff",fontFamily:bd,letterSpacing:"0.3px",whiteSpace:"nowrap",flexShrink:0}}>{w.ref}</span>
                    <span style={{fontSize:"11px",color:"rgba(255,255,255,0.15)",flexShrink:0}}>|</span>
                    <span style={{fontSize:"12px",fontWeight:400,color:"rgba(255,255,255,0.4)",fontFamily:bd,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",minWidth:0}}>{w.name}</span>
                  </div>
                  <span style={{fontSize:"12px",fontWeight:400,color:"rgba(255,255,255,0.45)",fontFamily:bd,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{w.family}</span>
                  <span style={{fontSize:"12px",fontWeight:400,color:"rgba(255,255,255,0.5)",fontFamily:bd}}>{w.dialColor ?? "—"}</span>
                  <span style={{fontSize:"12px",fontWeight:300,color:"rgba(255,255,255,0.4)",fontFamily:bd,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{w.material ?? "—"}</span>
                  <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                    <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#22c55e",flexShrink:0}}/>
                    <span style={{fontSize:"13px",fontWeight:500,color:"rgba(255,255,255,0.7)",fontFamily:bd}}>{w.transactions ?? 0} 条</span>
                  </div>
                  <WatchlistToggle entry={{ catalogId: w.catalogId, ref: w.ref, brand: w.brand, name: w.name }} variant="icon" />
                  <div style={{display:"flex",justifyContent:"center"}}><ChevronRight size={15} color="rgba(255,255,255,0.2)"/></div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"4px",marginTop:"32px"}}>
            <button className="pg-btn" onClick={()=>goPage(page-1)} disabled={page===1} style={{background:"rgba(255,255,255,0.04)",color:page===1?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.6)"}}><ChevronLeft size={16}/></button>
            {buildPageList(page, totalPages).map((p,i)=>(
              p === "..."
                ? <span key={`e${i}`} className="pg-btn" style={{cursor:"default",color:"rgba(255,255,255,0.3)",fontFamily:bd}}>…</span>
                : <button key={p} className="pg-btn" onClick={()=>goPage(p)} style={{background:p===page?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.04)",color:p===page?"#fff":"rgba(255,255,255,0.5)",fontFamily:bd}}>{p}</button>
            ))}
            <button className="pg-btn" onClick={()=>goPage(page+1)} disabled={page===totalPages} style={{background:"rgba(255,255,255,0.04)",color:page===totalPages?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.6)"}}><ChevronRight size={16}/></button>
            <form onSubmit={e=>{e.preventDefault();submitPageJump()}} style={{display:"flex",alignItems:"center",gap:"4px",marginLeft:"8px"}}>
              <input
                type="number"
                className="page-jump-input"
                min={1}
                value={pageJump}
                onChange={e=>setPageJump(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();submitPageJump()}}}
                aria-label="跳转页码"
                title={`输入页码，范围 1-${totalPages}`}
                style={{
                  width:"64px",height:"32px",padding:"0 8px",borderRadius:"8px",
                  border:"1px solid rgba(255,255,255,0.08)",outline:"none",
                  background:"rgba(255,255,255,0.04)",color:"#fff",fontFamily:bd,
                  fontSize:"12px",textAlign:"center",
                }}
              />
              <button type="submit" className="pg-btn" title="跳转到指定页" aria-label="跳转到指定页" style={{background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.6)"}}>
                <CornerDownRight size={15}/>
              </button>
            </form>
          </div>
        )}
      </main>

      {/* overflow modal removed — toast 已统一提示 */}

      {/* ═══ FOOTER ═══ */}
      <footer style={{padding:"32px 40px 24px",borderTop:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{maxWidth:"1280px",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
            <span style={{fontFamily:hd,fontStyle:"italic",fontSize:"16px",color:"rgba(255,255,255,0.5)"}}>Raventik</span>
            <span style={{fontSize:"11px",fontWeight:300,color:"rgba(255,255,255,0.25)",fontFamily:bd}}>© 2026 谕鸦科技 Ravacle Inc.</span>
          </div>
          <div style={{display:"flex",gap:"20px"}}>
            {["隐私政策","服务条款","联系我们"].map((l,i)=>(
              <a key={i} href="#" style={{fontSize:"11px",fontWeight:400,color:"rgba(255,255,255,0.3)",textDecoration:"none",transition:"color 0.2s",fontFamily:bd}}
                onMouseEnter={e=>{(e.target as HTMLElement).style.color="rgba(255,255,255,0.7)"}}
                onMouseLeave={e=>{(e.target as HTMLElement).style.color="rgba(255,255,255,0.3)"}}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
