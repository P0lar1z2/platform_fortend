/**
 * ============================================================
 * Raventik — Watchlist (关注列表)
 * ============================================================
 * 
 * Route: /watchlist
 * 
 * SHARED CARD COMPONENT:
 *   Identical card to brand models page and search results page.
 *   All items here are followed (filled bookmark). Click to unfollow.
 * 
 * ENGINEER NOTES:
 *   - API: GET /api/watchlist?page=&brand=&sort= → returns followed watches
 *   - Unfollow: DELETE /api/watchlist/:ref → removes from list, card fades out
 *   - Empty state: show when watchlist is empty
 *   - Brand filter: dynamic from user's followed watches (not all brands)
 * ============================================================
 */

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { Search, Clock, Grid3X3, List, ChevronLeft, ChevronRight, ArrowRight, Bookmark, SlidersHorizontal, X, Plus } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { LoginPageGate } from "../components/LoginGate";
import { useWatchlist, type WatchlistEntry } from "../hooks/useWatchlist";
import { useViewPreference } from "../hooks/useViewPreference";
import { useToast } from "../components/Toast";
import AppHeader from "../components/AppHeader";
import Footer from "../components/Footer";
import { WATCHLIST_CAPACITY, WATCHLIST_WARN_THRESHOLD } from "../lib/constants";
import { buildPageList } from "../utils/pagination";
import { getWatchHref } from "../lib/watchRoutes";
import { getWatchIdentity } from "../lib/watchIdentity";

const PER_PAGE = 12;

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

export default function Watchlist() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const gated = !authLoading && !user;
  const { list, count, isNearLimit, isFull, remove } = useWatchlist();
  const toast = useToast();
  const [viewMode, setViewMode] = useViewPreference<"card" | "list">("watchlist-view", "card");
  const [currentPage, setCurrentPage] = useState(1);
  const [brandFilter, setBrandFilter] = useState("全部");
  const [showFilters, setShowFilters] = useState(false);
  const [removingIdentity, setRemovingIdentity] = useState<string | null>(null);

  const hd = "'Instrument Serif','Noto Serif SC',serif";
  const bd = "'Barlow','Noto Sans SC',sans-serif";

  const watches = list;

  // 用户已关注的品牌（动态）
  const brands = useMemo(() => ["全部", ...Array.from(new Set(watches.map(w => w.brand).filter(Boolean) as string[]))], [watches]);

  const filtered = useMemo(() => {
    if (brandFilter === "全部") return watches;
    return watches.filter(w => w.brand === brandFilter);
  }, [brandFilter, watches]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const pageData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const unfollow = (entry: WatchlistEntry) => {
    const identity = getWatchIdentity(entry.ref, entry.catalogId);
    setRemovingIdentity(identity);
    setTimeout(() => {
      remove(entry.ref, entry.catalogId);
      toast.push("已取消关注", "info");
      setRemovingIdentity(null);
    }, 300);
  };

  const goPage = (p: number) => { setCurrentPage(Math.max(1, Math.min(p, totalPages))); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: bd, ...(gated ? { filter: "blur(4px)", pointerEvents: "none" as const, userSelect: "none" as const } : null) }}>
      {gated && createPortal(
        <LoginPageGate onClose={() => navigate("/")} />,
        document.body,
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Barlow:wght@300;400;500;600&family=Noto+Serif+SC:wght@400;600;700&family=Noto+Sans+SC:wght@300;400;500&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}

        .gc{background:rgba(255,255,255,0.06);background-blend-mode:luminosity;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:none;border-radius:20px;box-shadow:inset 0 1px 1px rgba(255,255,255,0.15),inset 0 -1px 1px rgba(255,255,255,0.05),0 4px 30px rgba(0,0,0,0.12);position:relative;overflow:hidden}
        .gc::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1.4px;background:linear-gradient(180deg,rgba(255,255,255,0.4) 0%,rgba(255,255,255,0.15) 20%,rgba(255,255,255,0) 40%,rgba(255,255,255,0) 60%,rgba(255,255,255,0.15) 80%,rgba(255,255,255,0.4) 100%);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
        .gc::after{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(ellipse at 30% 20%,rgba(255,255,255,0.05) 0%,transparent 50%);pointer-events:none}

        .gp{background:rgba(255,255,255,0.08);background-blend-mode:luminosity;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:none;border-radius:9999px;box-shadow:inset 0 1px 1px rgba(255,255,255,0.15),0 2px 12px rgba(0,0,0,0.08);position:relative;overflow:hidden}
        .gp::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1px;background:linear-gradient(180deg,rgba(255,255,255,0.35) 0%,rgba(255,255,255,0.1) 30%,rgba(255,255,255,0) 50%,rgba(255,255,255,0.1) 70%,rgba(255,255,255,0.35) 100%);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}

        .gs{background:rgba(255,255,255,0.06);background-blend-mode:luminosity;backdrop-filter:blur(50px);-webkit-backdrop-filter:blur(50px);border:none;border-radius:9999px;box-shadow:4px 4px 4px rgba(0,0,0,0.05),inset 0 1px 1px rgba(255,255,255,0.2);position:relative;overflow:hidden}

        .watch-card{transition:all 0.3s cubic-bezier(0.16,1,0.3,1);cursor:pointer}
        .watch-card:hover{background:rgba(255,255,255,0.1);transform:translateY(-3px);box-shadow:inset 0 1px 1px rgba(255,255,255,0.2),0 12px 40px rgba(0,0,0,0.3)}
        .watch-card.removing{opacity:0;transform:scale(0.95) translateY(8px);pointer-events:none}

        .watch-row{transition:all 0.3s ease;cursor:pointer}
        .watch-row:hover{background:rgba(255,255,255,0.06)}
        .watch-row.removing{opacity:0;height:0;padding:0;overflow:hidden}

        .bk-btn{transition:all 0.2s ease;cursor:pointer;border:none;background:none;padding:4px;display:flex;align-items:center;border-radius:6px}
        .bk-btn:hover{background:rgba(255,255,255,0.1)}

        .mode-btn{transition:all 0.2s ease;cursor:pointer;display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;border:none;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
        .mode-btn:hover{background:rgba(255,255,255,0.12)}

        .filter-chip{transition:all 0.2s ease;cursor:pointer;border:none;padding:6px 14px;border-radius:9999px;font-size:12px;font-weight:400;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
        .filter-chip:hover{background:rgba(255,255,255,0.14)}

        .tag{display:inline-flex;align-items:center;padding:3px 10px;border-radius:8px;font-size:11px;font-weight:400;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.5);white-space:nowrap;box-shadow:inset 0 1px 0 rgba(255,255,255,0.08)}

        .pg-btn{transition:all 0.2s ease;cursor:pointer;display:flex;align-items:center;justify-content:center;min-width:32px;height:32px;border-radius:8px;border:none;font-size:12px}
        .pg-btn:hover{background:rgba(255,255,255,0.12)}

        .sc{transition:all 0.4s cubic-bezier(0.16,1,0.3,1);background:rgba(255,255,255,0.05);background-blend-mode:luminosity;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:none;box-shadow:inset 0 1px 1px rgba(255,255,255,0.1);position:relative;overflow:hidden}
        .sc::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1px;background:linear-gradient(180deg,rgba(255,255,255,0.25) 0%,rgba(255,255,255,0.08) 30%,rgba(255,255,255,0) 50%,rgba(255,255,255,0.08) 70%,rgba(255,255,255,0.25) 100%);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
        .sc:focus-within{box-shadow:inset 0 1px 1px rgba(255,255,255,0.15),0 0 0 1px rgba(255,255,255,0.15),0 8px 40px rgba(0,0,0,0.3)}

        ::selection{background:rgba(255,255,255,0.2);color:#fff}
      `}</style>

      <AppHeader showSearch />

      {/* Ambient */}
      <div style={{position:"fixed",top:0,left:"15%",width:"600px",height:"500px",background:"radial-gradient(ellipse,rgba(80,120,200,0.07) 0%,transparent 60%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",bottom:"10%",right:"5%",width:"500px",height:"400px",background:"radial-gradient(ellipse,rgba(140,100,200,0.05) 0%,transparent 60%)",pointerEvents:"none",zIndex:0}}/>

      <main style={{maxWidth:"1280px",margin:"0 auto",padding:"88px 40px 60px",position:"relative",zIndex:1}}>

        {/* ── Header ── */}
        <div className="mobile-page-heading mobile-stack" style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:"32px",paddingTop:"12px"}}>
          <div>
            <div className="gp" style={{display:"inline-flex",padding:"4px 14px",fontSize:"11px",fontWeight:500,color:"rgba(255,255,255,0.6)",marginBottom:"14px",letterSpacing:"1px",fontFamily:bd}}>关注列表</div>
            <h1 style={{fontFamily:"'Noto Serif SC',serif",fontSize:"32px",color:"#fff",letterSpacing:"-1px",lineHeight:1.1,fontWeight:700}}>我的关注</h1>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
            {/* PDF v1.1 Header 上限提示 —— 25+ 警告色，满 30 全站禁用关注按钮（WatchlistToggle 已处理） */}
            <div style={{textAlign:"right"}}>
              <div style={{display:"flex",alignItems:"baseline",gap:"4px"}}>
                <span style={{fontSize:"22px",fontWeight:600,color:isNearLimit?"#f59e0b":"#fff",fontFamily:bd}}>{count}</span>
                <span style={{fontSize:"14px",fontWeight:300,color:"rgba(255,255,255,0.3)",fontFamily:bd}}>/ {WATCHLIST_CAPACITY}</span>
              </div>
              <span style={{fontSize:"11px",fontWeight:300,color:isFull?"#f59e0b":"rgba(255,255,255,0.35)",fontFamily:bd}}>
                {isFull ? "已达上限" : isNearLimit ? "接近上限" : "个关注"}
              </span>
            </div>
            <div style={{width:"80px",height:"4px",borderRadius:"2px",background:"rgba(255,255,255,0.06)"}}>
              <div style={{width:`${(count/WATCHLIST_CAPACITY)*100}%`,height:"100%",borderRadius:"2px",background:isNearLimit?"#f59e0b":"rgba(255,255,255,0.25)",transition:"all 0.3s ease"}}/>
            </div>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="mobile-toolbar" style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"24px"}}>
          <p style={{fontSize:"13px",fontWeight:300,color:"rgba(255,255,255,0.4)",fontFamily:bd}}>
            {brandFilter==="全部" ? `共 ${filtered.length} 个关注表款` : `${brandFilter} · ${filtered.length} 个表款`}
          </p>
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

        {/* ── Brand Filter (from user's followed brands) ── */}
        {showFilters && (
          <div className="gc" style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"24px",padding:"16px 20px",borderRadius:"16px"}}>
            <span style={{fontSize:"11px",color:"rgba(255,255,255,0.3)",lineHeight:"30px",marginRight:"4px",fontFamily:bd}}>品牌：</span>
            {brands.map((b,i)=>(
              <button key={i} className="filter-chip" onClick={()=>{setBrandFilter(b);setCurrentPage(1)}} style={{
                background:brandFilter===b?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.04)",
                color:brandFilter===b?"#fff":"rgba(255,255,255,0.5)",fontFamily:bd,
              }}>{b}</button>
            ))}
          </div>
        )}

        {/* ═══ EMPTY STATE ═══ */}
        {watches.length === 0 && (
          <div style={{textAlign:"center",padding:"80px 20px"}}>
            <div style={{width:"80px",height:"80px",borderRadius:"20px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
              <Bookmark size={32} color="rgba(255,255,255,0.12)" strokeWidth={1}/>
            </div>
            <h3 style={{fontFamily:"'Noto Serif SC',serif",fontSize:"22px",fontWeight:700,color:"rgba(255,255,255,0.6)",marginBottom:"8px"}}>还没有关注的表款</h3>
            <p style={{fontSize:"13px",fontWeight:300,color:"rgba(255,255,255,0.35)",fontFamily:bd,marginBottom:"24px",maxWidth:"360px",margin:"0 auto 24px",lineHeight:1.6}}>
              浏览表款时点击书签图标即可添加关注，方便随时追踪价格变动。
            </p>
            <Link to="/search" style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"10px 22px",borderRadius:"9999px",background:"rgba(255,255,255,0.08)",color:"#fff",fontSize:"13px",fontWeight:500,textDecoration:"none",fontFamily:bd,transition:"all 0.2s"}}>
              <Search size={14}/> 开始探索
            </Link>
          </div>
        )}

        {/* ═══ CARD VIEW ═══ */}
        {watches.length > 0 && viewMode === "card" && (
          <div className="mobile-card-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"16px"}}>
            {pageData.map(w => (
              <div key={getWatchIdentity(w.ref, w.catalogId)}
                   onClick={() => navigate(getWatchHref(w.ref, w.catalogId))}
                   className={`gc watch-card mobile-card ${removingIdentity===getWatchIdentity(w.ref, w.catalogId)?"removing":""}`}
                   style={{padding:0,display:"flex",flexDirection:"column"}}>
                <div className="mobile-card-image" style={{width:"100%",aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.02)",borderBottom:"1px solid rgba(255,255,255,0.06)",overflow:"hidden"}}>
                  {w.thumbUrl ? <img src={w.thumbUrl} alt={w.name||w.ref} style={{width:160,height:160,objectFit:"contain"}}/> : <WatchPlaceholder size={160}/>}
                </div>
                <div className="mobile-card-body" style={{padding:"16px 18px 18px",flex:1,display:"flex",flexDirection:"column"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"6px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                      <span style={{fontSize:"11px",fontWeight:500,color:"rgba(255,255,255,0.4)",fontFamily:bd,textTransform:"uppercase",letterSpacing:"0.8px"}}>{w.brand || "—"}</span>
                    </div>
                    {/* PDF v1.1 卡片"监控中"绿点 —— 表示后台正在定期搜索 */}
                    <div style={{display:"flex",alignItems:"center",gap:"4px"}}>
                      <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 6px rgba(34,197,94,0.4)"}}/>
                      <span style={{fontSize:"10px",fontWeight:400,color:"rgba(34,197,94,0.6)",fontFamily:bd}}>监控中</span>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"3px"}}>
                    <h3 style={{fontSize:"15px",fontWeight:600,color:"#fff",fontFamily:bd,letterSpacing:"0.3px",lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0}}>Ref. {w.ref}</h3>
                    <button className="bk-btn" onClick={(e)=>{e.stopPropagation();unfollow(w)}} title="取消关注">
                      <Bookmark size={16} color="#f59e0b" fill="#f59e0b" strokeWidth={1.5}/>
                    </button>
                  </div>
                  <p style={{fontSize:"12px",fontWeight:300,color:"rgba(255,255,255,0.4)",fontFamily:bd,marginBottom:"12px"}}>{w.name || "—"}</p>
                  {w.price && (
                    <div style={{display:"flex",flexWrap:"wrap",gap:"4px",marginBottom:"14px"}}>
                      <span className="tag">{w.price}</span>
                    </div>
                  )}
                  <div style={{marginTop:"auto",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:"11px",fontWeight:300,color:"rgba(255,255,255,0.35)",fontFamily:bd}}>
                      加入于 {new Date(w.addedAt).toLocaleDateString("zh-CN")}
                    </span>
                    <ArrowRight size={14} color="rgba(255,255,255,0.25)"/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ LIST VIEW ═══ */}
        {watches.length > 0 && viewMode === "list" && (
          <div className="gc mobile-list-shell" style={{padding:0,overflow:"hidden"}}>
            {/* Header */}
            <div className="mobile-list-header" style={{display:"grid",gridTemplateColumns:"48px 1fr 130px 130px 90px 36px 32px",padding:"12px 20px",gap:"12px",borderBottom:"1px solid rgba(255,255,255,0.06)",alignItems:"center"}}>
              {["","Ref / 型号","价格","加入时间","状态","",""].map((h,i)=>(
                <span key={i} style={{fontSize:"10px",fontWeight:500,color:"rgba(255,255,255,0.3)",letterSpacing:"0.8px",fontFamily:bd,whiteSpace:"nowrap"}}>{h}</span>
              ))}
            </div>
            {/* Rows */}
            {pageData.map((w,i)=>(
              <div key={getWatchIdentity(w.ref, w.catalogId)}
                   onClick={() => navigate(getWatchHref(w.ref, w.catalogId))}
                   className={`watch-row mobile-list-row ${removingIdentity===getWatchIdentity(w.ref, w.catalogId)?"removing":""}`}
                   style={{
                     display:"grid",gridTemplateColumns:"48px 1fr 130px 130px 90px 36px 32px",
                     padding:"10px 20px",gap:"12px",
                     borderBottom:i<pageData.length-1?"1px solid rgba(255,255,255,0.04)":"none",
                     alignItems:"center",transition:"all 0.3s ease",
                   }}>
                <div className="mobile-list-thumb" style={{width:"42px",height:"42px",borderRadius:"8px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                  {w.thumbUrl ? <img src={w.thumbUrl} alt="" style={{width:36,height:36,objectFit:"contain"}}/> : <WatchPlaceholder size={36}/>}
                </div>
                <div className="mobile-list-main" style={{display:"flex",alignItems:"center",gap:"8px",overflow:"hidden",minWidth:0}}>
                  <span style={{fontSize:"13px",fontWeight:600,color:"#fff",fontFamily:bd,letterSpacing:"0.3px",whiteSpace:"nowrap",flexShrink:0}}>{w.ref}</span>
                  <span style={{fontSize:"11px",color:"rgba(255,255,255,0.15)",flexShrink:0}}>|</span>
                  <span style={{fontSize:"12px",fontWeight:400,color:"rgba(255,255,255,0.4)",fontFamily:bd,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",minWidth:0}}>{[w.brand, w.name].filter(Boolean).join(" ") || "—"}</span>
                </div>
                <span className="mobile-list-secondary" style={{fontSize:"12px",fontWeight:400,color:"rgba(255,255,255,0.5)",fontFamily:bd,whiteSpace:"nowrap"}}>{w.price || "—"}</span>
                <span className="mobile-list-secondary" style={{fontSize:"11px",fontWeight:300,color:"rgba(255,255,255,0.4)",fontFamily:bd,whiteSpace:"nowrap"}}>加入于 {new Date(w.addedAt).toLocaleDateString("zh-CN")}</span>
                <div className="mobile-list-count" style={{display:"flex",alignItems:"center",gap:"6px"}}>
                  <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#22c55e",flexShrink:0,boxShadow:"0 0 6px rgba(34,197,94,0.4)"}}/>
                  <span style={{fontSize:"11px",fontWeight:500,color:"rgba(34,197,94,0.7)",fontFamily:bd}}>监控中</span>
                </div>
                <div className="mobile-list-action">
                  <button className="bk-btn" onClick={(e)=>{e.stopPropagation();unfollow(w)}} title="取消关注">
                    <Bookmark size={15} color="#f59e0b" fill="#f59e0b" strokeWidth={1.5}/>
                  </button>
                </div>
                <div className="mobile-list-arrow" style={{display:"flex",justifyContent:"center"}}><ChevronRight size={15} color="rgba(255,255,255,0.2)"/></div>
              </div>
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {watches.length > 0 && totalPages > 1 && (
          <div className="mobile-pagination" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"4px",marginTop:"32px"}}>
            <button className="pg-btn" onClick={()=>goPage(page-1)} disabled={page===1} style={{background:"rgba(255,255,255,0.04)",color:page===1?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.6)"}}><ChevronLeft size={16}/></button>
            {buildPageList(page, totalPages).map((p,i)=>(
              p === "..."
                ? <span key={`e${i}`} className="pg-btn" style={{cursor:"default",color:"rgba(255,255,255,0.3)",fontFamily:bd}}>…</span>
                : <button key={p} className="pg-btn" onClick={()=>goPage(p)} style={{background:p===page?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.04)",color:p===page?"#fff":"rgba(255,255,255,0.5)",fontFamily:bd}}>{p}</button>
            ))}
            <button className="pg-btn" onClick={()=>goPage(page+1)} disabled={page===totalPages} style={{background:"rgba(255,255,255,0.04)",color:page===totalPages?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.6)"}}><ChevronRight size={16}/></button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
