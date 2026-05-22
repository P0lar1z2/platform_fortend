/**
 * ============================================================
 * Raventik — Watch Model Detail Page (v2)
 * ============================================================
 * 
 * PAGE STRUCTURE:
 *   Section A — Watch Identity Card (pure Watchbase specs, no price data)
 *   Section B — Market Data (global time filter, per-source breakdown, chart/list toggle)
 *   Section C — Trading Expectations (alerts, no login required)
 * 
 * ENGINEER NOTES:
 *   - Search "API:" for all data integration points
 *   - Search "LOGO_PLACEHOLDER" for logo image slots (100x28px)
 *   - All prices in JPY. Convert at API layer if multi-currency needed
 *   - Global timeWindow state controls all Section B queries
 *   - DATA_SOURCES array auto-expands UI when new sources added
 * ============================================================
 */

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Clock, ChevronRight, ChevronLeft, Bookmark, Target, ExternalLink, Zap, Check, BarChart3, List, ArrowUpRight, Bell, Search } from "lucide-react";
import WatchlistToggle from "../components/WatchlistToggle";
import { DATA_SOURCES as SHARED_DATA_SOURCES, DATA_SOURCE_BY_KEY } from "../lib/constants";
import { decisionMeta, valuationLevelLabel } from "../lib/labels";
import { fetchPriceRange, postValuation } from "../api/valuations";
import { fetchWatch, fetchMarket } from "../api/watches";
import type { ValuationResponse, WatchInfo, MarketResponse, Period } from "../api/types";

// 数据源集中配置在 lib/constants.ts，新增源只改那里
const DATA_SOURCES = SHARED_DATA_SOURCES;
const SOURCE_COLORS: Record<string, string> = Object.fromEntries(
  SHARED_DATA_SOURCES.map(s => [s.key, s.color])
);
void DATA_SOURCE_BY_KEY;

const TIME_WINDOWS: Period[] = ["1M", "3M", "6M", "1Y", "All"];

/* ─── COMPONENTS ────────────────────────────────────────── */

function WatchPlaceholder() {
  return (
    <svg viewBox="0 0 400 400" style={{ width: "100%", height: "100%", maxHeight: "420px" }}>
      <rect width="400" height="400" fill="rgba(255,255,255,0.02)" rx="16" />
      <circle cx="200" cy="190" r="100" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
      <circle cx="200" cy="190" r="82" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
      <line x1="200" y1="190" x2="200" y2="135" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="200" y1="190" x2="240" y2="190" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="200" cy="190" r="4" fill="rgba(255,255,255,0.15)" />
      <text x="200" y="370" textAnchor="middle" fill="rgba(255,255,255,0.12)" fontSize="12" fontFamily="Barlow, sans-serif">WATCH IMAGE</text>
    </svg>
  );
}

// LOGO_PLACEHOLDER component — replace inner content with <img> when logos ready
function SrcLogo({ source }) {
  return (
    <div style={{ width: source.logoWidth, height: source.logoHeight, borderRadius: "6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: "10px", fontWeight: 500, color: "rgba(255,255,255,0.3)", fontFamily: "'Barlow',sans-serif", letterSpacing: "0.5px" }}>{source.name}</span>
    </div>
  );
}

function PriceChart({ data, visible }) {
  const W = 720, H = 280, pX = 70, pY = 24;
  const cW = W - pX - 30, cH = H - pY * 2;
  const all = data.flatMap(d => visible.map(s => d[s]).filter(Boolean));
  if (!all.length) return null;
  const mn = Math.min(...all), mx = Math.max(...all), rng = mx - mn || 1;
  const x = (i) => pX + (i / Math.max(1, data.length - 1)) * cW;
  const y = (v) => pY + (1 - (v - mn) / rng) * cH;
  const gP = Array.from({ length: 5 }, (_, i) => mn + (rng / 4) * i);
  const dI = [0, Math.floor(data.length * 0.25), Math.floor(data.length * 0.5), Math.floor(data.length * 0.75), data.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      {gP.map((p, i) => (<g key={i}><line x1={pX} y1={y(p)} x2={W - 30} y2={y(p)} stroke="rgba(255,255,255,0.05)" /><text x={pX - 10} y={y(p) + 4} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="Barlow,sans-serif">¥{(p / 10000).toFixed(0)}万</text></g>))}
      {dI.map((idx, i) => (<text key={i} x={x(idx)} y={H - 4} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="Barlow,sans-serif">{data[idx]?.date.slice(0, 7)}</text>))}
      {visible.map(s => { const pts = data.map((d, i) => d[s] ? `${x(i)},${y(d[s])}` : null).filter(Boolean).join(" "); return <polyline key={s} points={pts} fill="none" stroke={SOURCE_COLORS[s] || "#888"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />; })}
    </svg>
  );
}

/* ─── MAIN ──────────────────────────────────────────────── */

export default function WatchDetail() {
  const navigate = useNavigate();
  const { ref: routeRef } = useParams<{ ref: string }>();
  void navigate;

  // PDF 4.1/4.2: Section A 表款信息 + Section B 市场数据 走 API
  const ref = routeRef ?? "126610LN";
  const [watch, setWatch] = useState<WatchInfo | null>(null);
  const [watchError, setWatchError] = useState<string | null>(null);
  const [market, setMarket] = useState<MarketResponse | null>(null);
  const [marketLoading, setMarketLoading] = useState(true);

  const [tw, setTw] = useState<Period>("3M");
  const [vm, setVm] = useState("chart");
  const [visSrc, setVisSrc] = useState(DATA_SOURCES.map(s => s.key));
  const [txPg, setTxPg] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    setWatch(null); setWatchError(null);
    fetchWatch(ref).then(setWatch).catch(err => {
      setWatchError(err?.response?.status === 404 ? "未找到该型号" : "加载失败");
    });
  }, [ref]);

  useEffect(() => {
    setMarketLoading(true);
    fetchMarket(ref, tw)
      .then(m => { setMarket(m); setTxPg(1); })
      .catch(() => setMarket(null))
      .finally(() => setMarketLoading(false));
  }, [ref, tw]);

  // ── Section C: Trading Valuation ──
  const [inputMode, setInputMode] = useState("price");    // "price" = input buy price, "margin" = input target margin
  const [buyPrice, setBuyPrice] = useState("");            // 预期买入价 (JPY string)
  const [targetMargin, setTargetMargin] = useState("");    // 目标利润率 (% string)
  const [valuationSource, setValuationSource] = useState("全部");
  const [condition, setCondition] = useState("A");
  const [showMoreConds, setShowMoreConds] = useState(false);
  const [hasBox, setHasBox] = useState(false);
  const [hasCard, setHasCard] = useState(false);
  const [warrantyRegion, setWarrantyRegion] = useState("");
  const [warrantyYear, setWarrantyYear] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [expandedRoutes, setExpandedRoutes] = useState<Record<string, boolean>>({});
  const [priceRange, setPriceRange] = useState<{ p5: number; p95: number } | null>(null);
  const [valuationResult, setValuationResult] = useState<ValuationResponse | null>(null);
  const [valuationLoading, setValuationLoading] = useState(false);
  const [valuationError, setValuationError] = useState<string | null>(null);

  const numericInput = inputMode === "price" ? Number(buyPrice) : Number(targetMargin);
  const canRunValuation = Number.isFinite(numericInput) && numericInput > 0;

  useEffect(() => {
    fetchPriceRange(ref).then(setPriceRange).catch(() => setPriceRange(null));
  }, [ref]);

  const hd = "'Instrument Serif','Noto Serif SC',serif";
  const bd = "'Barlow','Noto Sans SC',sans-serif";

  // PDF 4.2 Section B 数据全部由 market 驱动（period 切换触发联动刷新）
  const oStats: any = market?.overall ?? { avg: 0, max: 0, min: 0, count: 0 };
  const srcStats = DATA_SOURCES.map(cfg => {
    const ps = market?.perSource?.find(p => p.key === cfg.key);
    return {
      key: cfg.key,
      name: cfg.name,
      logoUrl: cfg.logoUrl,
      logoWidth: cfg.logoWidth,
      logoHeight: cfg.logoHeight,
      s: {
        avg: ps?.avg ?? 0, max: ps?.max ?? 0, min: ps?.min ?? 0, count: ps?.count ?? 0,
        maxTx: ps?.maxTx, minTx: ps?.minTx,
      },
    };
  });
  const pData = market?.chart?.points ?? [];
  const fTx = market?.transactions ?? [];

  const txPP = 10;
  const txTP = Math.max(1, Math.ceil(fTx.length / txPP));
  const txPD = fTx.slice((txPg - 1) * txPP, txPg * txPP);

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
        .gs{background:rgba(255,255,255,0.06);background-blend-mode:luminosity;backdrop-filter:blur(50px);-webkit-backdrop-filter:blur(50px);border:none;border-radius:9999px;box-shadow:4px 4px 4px rgba(0,0,0,0.05),inset 0 1px 1px rgba(255,255,255,0.2);position:relative;overflow:hidden}
        .gs::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1.4px;background:linear-gradient(180deg,rgba(255,255,255,0.5) 0%,rgba(255,255,255,0.2) 20%,rgba(255,255,255,0) 40%,rgba(255,255,255,0) 60%,rgba(255,255,255,0.2) 80%,rgba(255,255,255,0.5) 100%);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
        .tr{transition:background 0.2s ease;cursor:pointer}.tr:hover{background:rgba(255,255,255,0.04)}
        .tw{transition:all 0.2s ease;cursor:pointer;border:none;padding:5px 12px;border-radius:9px;font-size:12px;font-weight:500}.tw:hover{background:rgba(255,255,255,0.1)}
        .sr{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)}.sr:last-child{border-bottom:none}
        .mb{transition:all 0.2s ease;cursor:pointer;display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;border:none;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}.mb:hover{background:rgba(255,255,255,0.12)}
        .sb{transition:all 0.2s ease;cursor:pointer;border:none;padding:4px 14px;border-radius:9999px;font-size:11px}.sb:hover{opacity:0.9}
        .pb{transition:all 0.2s ease;cursor:pointer;display:flex;align-items:center;justify-content:center;min-width:32px;height:32px;border-radius:8px;border:none;font-size:12px}.pb:hover{background:rgba(255,255,255,0.12)}
        .ct{transition:all 0.2s ease;cursor:pointer;border:none;padding:5px 12px;border-radius:9999px;font-size:12px;font-weight:400;display:flex;align-items:center;gap:4px}.ct:hover{background:rgba(255,255,255,0.12)}
        .bl{display:inline-flex;align-items:center;gap:4px;text-decoration:none;transition:all 0.2s ease;padding:3px 10px;border-radius:8px;background:rgba(255,255,255,0.04)}.bl:hover{background:rgba(255,255,255,0.1);transform:translateX(2px)}
        .sl{cursor:pointer;transition:color 0.2s ease;text-decoration:none}.sl:hover{color:#fff !important;text-decoration:underline;text-underline-offset:3px}
        .cb{transition:all 0.3s cubic-bezier(0.16,1,0.3,1)}.cb:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(255,255,255,0.1)}
        ::selection{background:rgba(255,255,255,0.2);color:#fff}
      `}</style>

      {/* ═══ NAV ═══ */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:50,padding:"12px 40px",background:"rgba(10,10,10,0.6)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{maxWidth:"1280px",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <Link to="/" style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <img src="/logo/raventik_logo_nav_32.png" width={32} height={32}
                 style={{borderRadius:"8px",objectFit:"contain"}} alt="Raventik"/>
            <span style={{fontFamily:hd,fontStyle:"italic",fontSize:"20px",color:"#fff",letterSpacing:"-0.5px"}}>Raventik</span>
          </Link>
          <div className="gp" style={{display:"flex",alignItems:"center",gap:"2px",padding:"4px 6px"}}>
            {[
              { to: "/", label: "首页" },
              { to: "/brands", label: "品牌列表" },
              { to: "/config", label: "配置表" },
              { to: "/watchlist", label: "关注列表" },
            ].map(item => (
              <Link key={item.to} to={item.to} style={{padding:"6px 12px",fontSize:"12px",fontWeight:400,color:"rgba(255,255,255,0.7)",textDecoration:"none",borderRadius:"9999px",fontFamily:bd}}>{item.label}</Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Ambient */}
      <div style={{position:"fixed",top:0,left:"10%",width:"600px",height:"500px",background:"radial-gradient(ellipse,rgba(80,120,200,0.06) 0%,transparent 60%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",bottom:"10%",right:0,width:"500px",height:"400px",background:"radial-gradient(ellipse,rgba(140,100,200,0.04) 0%,transparent 60%)",pointerEvents:"none",zIndex:0}}/>

      <main style={{maxWidth:"1280px",margin:"0 auto",padding:"80px 40px 60px",position:"relative",zIndex:1}}>

        {/* ═══ SECTION A — WATCH IDENTITY CARD ═══
            Image + specs in ONE glass card, same visual container.
            API: GET /api/watches/:ref → watchbase data */}
        <section style={{marginBottom:"60px",paddingTop:"12px"}}>
          {/* Unified glass card — image left, info right, same height */}
          <div className="gc" style={{display:"grid",gridTemplateColumns:"420px 1fr",borderRadius:"24px",overflow:"hidden"}}>
            {/* Left — Image area (compact layout) */}
            {/* API: WATCH.images[] — first = main, rest = gallery */}
            <div style={{background:"rgba(255,255,255,0.02)",borderRight:"1px solid rgba(255,255,255,0.04)",display:"flex",flexDirection:"column",padding:"20px"}}>
              {/* Main image — constrained height */}
              <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",maxHeight:"360px",marginBottom:"12px"}}>
                {watch && watch.images && watch.images.length > 0 ? (
                  <img
                    src={watch.images[Math.min(imgIdx, watch.images.length-1)]}
                    alt={watch.name || watch.ref}
                    style={{maxWidth:"100%",maxHeight:"360px",objectFit:"contain",borderRadius:"8px"}}
                    onError={(e)=>{(e.target as HTMLImageElement).style.display="none"}}
                  />
                ) : (
                  <WatchPlaceholder/>
                )}
              </div>
              {/* Thumbnail strip */}
              <div style={{display:"flex",gap:"6px",justifyContent:"center"}}>
                {(watch?.images ?? []).slice(0,4).map((src,i)=>(
                  <div key={i} onClick={()=>setImgIdx(i)} style={{width:"52px",height:"52px",borderRadius:"8px",background:"rgba(255,255,255,0.03)",border:i===imgIdx?"1px solid rgba(255,255,255,0.3)":"1px solid rgba(255,255,255,0.06)",overflow:"hidden",cursor:"pointer",transition:"all 0.2s ease"}}>
                    <img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={(e)=>{(e.target as HTMLImageElement).style.display="none"}}/>
                  </div>
                ))}
                {(watch?.images ?? []).length === 0 && [0,1,2,3].map(i=>(<div key={i} style={{width:"52px",height:"52px",borderRadius:"8px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}/>))}
              </div>
            </div>

            {/* Right — Identity info + specs */}
            <div style={{padding:"32px 36px",display:"flex",flexDirection:"column"}}>
              {/* PDF 4.1 表款信息区 —— 全部由 GET /api/watches/:ref 驱动 */}
              <h1 style={{fontFamily:hd,fontStyle:"italic",fontSize:"40px",color:"#fff",letterSpacing:"-1.5px",lineHeight:1,marginBottom:"10px"}}>Ref. {watch?.ref ?? ref}</h1>

              <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"6px"}}>
                {watch && (
                  <Link to={`/brands/${watch.brandSlug}`} className="bl" style={{display:"inline-flex"}}>
                    <span style={{fontSize:"13px",fontWeight:600,color:"rgba(255,255,255,0.7)",textTransform:"uppercase",letterSpacing:"1px",fontFamily:bd}}>{watch.brand}</span>
                    <ArrowUpRight size={13} color="rgba(255,255,255,0.4)"/>
                  </Link>
                )}
              </div>

              <p style={{fontSize:"15px",fontWeight:300,color:"rgba(255,255,255,0.45)",fontFamily:bd,marginBottom:"24px"}}>{watch?.name ?? (watchError ? watchError : "加载中…")}</p>

              <div style={{flex:1}}>
                <div style={{fontSize:"11px",fontWeight:500,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"1.2px",marginBottom:"10px",fontFamily:bd}}>规格参数</div>
                {/* PDF 4.1 缺字段显示 —，不要隐藏行 */}
                {(watch?.fields ?? []).map((f, i) => (
                  <div key={i} className="sr">
                    <span style={{fontSize:"12px",fontWeight:400,color:"rgba(255,255,255,0.4)",fontFamily:bd}}>{f.label}</span>
                    <span style={{fontSize:"12px",fontWeight:500,color: f.value ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)",fontFamily:bd}}>{f.value ?? "—"}</span>
                  </div>
                ))}
                {!watch && !watchError && [..."abcdef"].map(k => (
                  <div key={k} className="sr"><span style={{height:14,width:50,background:"rgba(255,255,255,0.06)",borderRadius:4}}/><span style={{height:14,width:120,background:"rgba(255,255,255,0.06)",borderRadius:4}}/></div>
                ))}
              </div>
            </div>
          </div>

          {/* PDF 4.1 按钮 - 设置关注 + 设置交易预期 */}
          <div style={{display:"flex",gap:"10px",justifyContent:"center",marginTop:"20px"}}>
            <WatchlistToggle
              entry={{ ref: watch?.ref ?? ref, brand: watch?.brand, name: watch?.name }}
              variant="wide"
            />
            <button className="gs cb" onClick={()=>document.getElementById('trading-section')?.scrollIntoView({behavior:'smooth'})} style={{padding:"11px 20px",fontSize:"13px",fontWeight:500,color:"#fff",cursor:"pointer",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"9999px",background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",gap:"6px",fontFamily:bd}}><Target size={14}/> 设置交易预期</button>
          </div>
        </section>

        {/* ═══ SECTION B — MARKET DATA ═══
            Global timeWindow controls everything below.
            API endpoints:
              GET /api/watches/:ref/stats?period={tw}
              GET /api/watches/:ref/stats?period={tw}&source={key}
              GET /api/watches/:ref/price-history?period={tw}
              GET /api/watches/:ref/transactions?period={tw}&page=&limit= */}
        <section style={{marginBottom:"60px"}}>
          {/* Header + Global Time Window */}
          <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:"24px"}}>
            <div>
              <div className="gp" style={{display:"inline-flex",padding:"4px 14px",fontSize:"11px",fontWeight:500,color:"rgba(255,255,255,0.6)",marginBottom:"14px",letterSpacing:"1px",fontFamily:bd}}>市场数据</div>
              <h2 style={{fontFamily:"'Noto Serif SC',serif",fontSize:"32px",color:"#fff",letterSpacing:"-1px",lineHeight:1.1,fontWeight:700}}>价格走势与交易记录</h2>
            </div>
            {/* Time window — controls ALL Section B data */}
            <div style={{display:"flex",gap:"2px",background:"rgba(255,255,255,0.04)",borderRadius:"12px",padding:"3px"}}>
              {TIME_WINDOWS.map(t=>(<button key={t} className="tw" onClick={()=>{setTw(t);setTxPg(1)}} style={{background:tw===t?"rgba(255,255,255,0.12)":"transparent",color:tw===t?"#fff":"rgba(255,255,255,0.4)",fontFamily:bd}}>{t}</button>))}
            </div>
          </div>

          {/* B-Top: Overview Stats — API: aggregated from all sources */}
          <div className="gc" style={{padding:"24px 28px",borderRadius:"18px",marginBottom:"16px"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"20px"}}>
              <div>
                <div style={{fontSize:"10px",fontWeight:500,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"4px",fontFamily:bd}}>近期均价</div>
                <div style={{fontSize:"24px",fontWeight:600,color:"#fff",fontFamily:bd}}>¥{(oStats.avg ?? 0).toLocaleString()}</div>
              </div>
              {/* Highest — clickable, links to that listing */}
              <div>
                <div style={{fontSize:"10px",fontWeight:500,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"4px",fontFamily:bd}}>最高价</div>
                <a href={oStats.maxTx?.listingUrl||"#"} target="_blank" rel="noopener noreferrer" className="sl" style={{fontSize:"24px",fontWeight:600,color:"#22c55e",fontFamily:bd,display:"flex",alignItems:"center",gap:"4px"}}>¥{(oStats.max ?? 0).toLocaleString()}<ExternalLink size={13} color="rgba(34,197,94,0.5)"/></a>
                {oStats.maxTx&&<div style={{fontSize:"10px",color:"rgba(255,255,255,0.25)",fontFamily:bd,marginTop:"2px"}}>{oStats.maxTx.date} · {oStats.maxTx.sourceName}</div>}
              </div>
              {/* Lowest — clickable */}
              <div>
                <div style={{fontSize:"10px",fontWeight:500,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"4px",fontFamily:bd}}>最低价</div>
                <a href={oStats.minTx?.listingUrl||"#"} target="_blank" rel="noopener noreferrer" className="sl" style={{fontSize:"24px",fontWeight:600,color:"#f59e0b",fontFamily:bd,display:"flex",alignItems:"center",gap:"4px"}}>¥{(oStats.min ?? 0).toLocaleString()}<ExternalLink size={13} color="rgba(245,158,11,0.5)"/></a>
                {oStats.minTx&&<div style={{fontSize:"10px",color:"rgba(255,255,255,0.25)",fontFamily:bd,marginTop:"2px"}}>{oStats.minTx.date} · {oStats.minTx.sourceName}</div>}
              </div>
              <div>
                <div style={{fontSize:"10px",fontWeight:500,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"4px",fontFamily:bd}}>交易记录</div>
                <div style={{fontSize:"24px",fontWeight:600,color:"#fff",fontFamily:bd}}>{oStats.count}</div>
                <div style={{fontSize:"10px",color:"rgba(255,255,255,0.25)",fontFamily:bd,marginTop:"2px"}}>笔成交</div>
              </div>
            </div>
          </div>

          {/* B-Mid: Per-Source Breakdown
              API: computed per source key. Auto-expands when DATA_SOURCES grows.
              LOGO_PLACEHOLDER: replace SrcLogo inner <span> with <img src={source.logoUrl} width={source.logoWidth} height={source.logoHeight} /> */}
          <div style={{display:"grid",gridTemplateColumns:`repeat(${DATA_SOURCES.length},1fr)`,gap:"12px",marginBottom:"24px"}}>
            {srcStats.map(src=>(
              <div key={src.key} className="gc" style={{padding:"20px",borderRadius:"16px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
                  <SrcLogo source={src}/>
                  <span style={{fontSize:"11px",fontWeight:400,color:"rgba(255,255,255,0.3)",fontFamily:bd}}>{src.s.count} 笔</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
                  {[{l:"均价",v:src.s.avg},{l:"最高",v:src.s.max,lk:src.s.maxTx?.listingUrl},{l:"最低",v:src.s.min,lk:src.s.minTx?.listingUrl}].map((it,i)=>(
                    <div key={i}>
                      <div style={{fontSize:"9px",fontWeight:500,color:"rgba(255,255,255,0.25)",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:"3px",fontFamily:bd}}>{it.l}</div>
                      {it.lk?(<a href={it.lk} target="_blank" rel="noopener noreferrer" className="sl" style={{fontSize:"14px",fontWeight:600,color:"rgba(255,255,255,0.8)",fontFamily:bd}}>¥{(it.v ?? 0).toLocaleString()}</a>):(<div style={{fontSize:"14px",fontWeight:600,color:"rgba(255,255,255,0.8)",fontFamily:bd}}>¥{(it.v ?? 0).toLocaleString()}</div>)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* B-Bottom: Chart / List Toggle */}
          <div className="gc" style={{padding:0,borderRadius:"20px",overflow:"hidden"}}>
            {/* Toolbar */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 24px",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                {vm==="chart"?(<>
                  <span style={{fontSize:"11px",color:"rgba(255,255,255,0.3)",fontFamily:bd,marginRight:"4px"}}>数据源：</span>
                  {DATA_SOURCES.map(s=>(<button key={s.key} className="sb" onClick={()=>setVisSrc(p=>p.includes(s.key)?p.filter(x=>x!==s.key):[...p,s.key])} style={{background:visSrc.includes(s.key)?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.02)",color:visSrc.includes(s.key)?(SOURCE_COLORS[s.key]||"#888"):"rgba(255,255,255,0.2)",fontFamily:bd,boxShadow:visSrc.includes(s.key)?`inset 0 0 0 1px ${SOURCE_COLORS[s.key]}33`:"none"}}>
                    <span style={{display:"inline-block",width:"7px",height:"7px",borderRadius:"50%",background:visSrc.includes(s.key)?(SOURCE_COLORS[s.key]||"#888"):"rgba(255,255,255,0.1)",marginRight:"5px"}}/>{s.name}
                  </button>))}
                </>):(<span style={{fontSize:"12px",fontWeight:400,color:"rgba(255,255,255,0.5)",fontFamily:bd}}>共 {fTx.length} 笔交易记录</span>)}
              </div>
              <div style={{display:"flex",gap:"4px"}}>
                <button className="mb" onClick={()=>setVm("chart")} style={{background:vm==="chart"?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.04)"}}><BarChart3 size={16} color={vm==="chart"?"#fff":"rgba(255,255,255,0.4)"}/></button>
                <button className="mb" onClick={()=>{setVm("list");setTxPg(1)}} style={{background:vm==="list"?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.04)"}}><List size={16} color={vm==="list"?"#fff":"rgba(255,255,255,0.4)"}/></button>
              </div>
            </div>

            {/* Chart view */}
            {vm==="chart"&&<div style={{padding:"20px 24px 24px"}}><PriceChart data={pData} visible={visSrc}/></div>}

            {/* List view — matches screenshot: 图/来源/日期/成交价/成色/配件/材质/表盘色/Ref/链接 */}
            {/* API: GET /api/watches/:ref/transactions?period={tw}&page=&limit= */}
            {vm==="list"&&(<>
              <div style={{display:"grid",gridTemplateColumns:"36px 90px 120px 110px 50px 80px 55px 65px 90px 1fr",padding:"10px 24px",gap:"8px",borderBottom:"1px solid rgba(255,255,255,0.06)",alignItems:"center"}}>
                {["","来源","拍卖日期","成交价 (JPY)","成色","配件","材质","表盘色","Ref",""].map((h,i)=>(<span key={i} style={{fontSize:"10px",fontWeight:500,color:"rgba(255,255,255,0.3)",letterSpacing:"0.8px",fontFamily:bd,whiteSpace:"nowrap"}}>{h}</span>))}
              </div>
              {txPD.map((tx,i)=>(
                <div key={tx.id} className="tr" style={{display:"grid",gridTemplateColumns:"36px 90px 120px 110px 50px 80px 55px 65px 90px 1fr",padding:"12px 24px",gap:"8px",borderBottom:i<txPD.length-1?"1px solid rgba(255,255,255,0.04)":"none",alignItems:"center"}}>
                  {/* Thumbnail — tx.thumbUrl (mongo product_image_url) */}
                  <div style={{width:"32px",height:"32px",borderRadius:"6px",overflow:"hidden",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {tx.thumbUrl
                      ? <img src={tx.thumbUrl} alt="" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
                      : <span style={{fontSize:"9px",color:"rgba(255,255,255,0.2)",fontFamily:bd}}>—</span>}
                  </div>
                  {/* Source badge — colored per source */}
                  <span style={{display:"inline-flex",alignItems:"center",padding:"2px 10px",borderRadius:"6px",fontSize:"11px",fontWeight:500,background:`${SOURCE_COLORS[tx.source]}18`,color:SOURCE_COLORS[tx.source]||"#888",fontFamily:bd,width:"fit-content"}}>{tx.sourceName}</span>
                  <span style={{fontSize:"12px",fontWeight:400,color:"rgba(255,255,255,0.5)",fontFamily:bd}}>{tx.date ?? tx.dateTime ?? "—"}</span>
                  <span style={{fontSize:"13px",fontWeight:600,color:"#fff",fontFamily:bd}}>¥{(tx.price ?? 0).toLocaleString()}</span>
                  <span style={{fontSize:"12px",fontWeight:400,color:"rgba(255,255,255,0.5)",fontFamily:bd}}>{tx.condition}</span>
                  {/* Accessories — Box/Card badges matching screenshot style */}
                  <div style={{display:"flex",gap:"4px"}}>
                    {tx.hasBox&&<span style={{fontSize:"10px",padding:"2px 8px",borderRadius:"5px",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.5)",border:"1px solid rgba(255,255,255,0.08)"}}>Box</span>}
                    {tx.hasCard&&<span style={{fontSize:"10px",padding:"2px 8px",borderRadius:"5px",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.5)",border:"1px solid rgba(255,255,255,0.08)"}}>Card</span>}
                    {!tx.hasBox&&!tx.hasCard&&<span style={{fontSize:"11px",color:"rgba(255,255,255,0.2)"}}>—</span>}
                  </div>
                  <span style={{fontSize:"12px",fontWeight:400,color:"rgba(255,255,255,0.45)",fontFamily:bd}}>{tx.material}</span>
                  <span style={{fontSize:"12px",fontWeight:400,color:"rgba(255,255,255,0.45)",fontFamily:bd}}>{tx.dialColor}</span>
                  <span style={{fontSize:"11px",fontWeight:400,color:"rgba(255,255,255,0.35)",fontFamily:bd}}>{tx.ref}</span>
                  {/* Link to original listing — API: tx.listingUrl */}
                  <div style={{display:"flex",justifyContent:"flex-end"}}><a href={tx.listingUrl} target="_blank" rel="noopener noreferrer" style={{fontSize:"12px",color:"rgba(100,130,200,0.7)",textDecoration:"none",fontFamily:bd,display:"flex",alignItems:"center",gap:"3px"}}>查看<ExternalLink size={11}/></a></div>
                </div>
              ))}
              {txTP>1&&(<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"4px",padding:"16px"}}>
                <button className="pb" onClick={()=>setTxPg(p=>Math.max(1,p-1))} style={{background:"rgba(255,255,255,0.04)",color:txPg===1?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.6)"}}><ChevronLeft size={14}/></button>
                {Array.from({length:txTP},(_,i)=>i+1).map(p=>(<button key={p} className="pb" onClick={()=>setTxPg(p)} style={{background:p===txPg?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.04)",color:p===txPg?"#fff":"rgba(255,255,255,0.5)",fontFamily:bd}}>{p}</button>))}
                <button className="pb" onClick={()=>setTxPg(p=>Math.min(txTP,p+1))} style={{background:"rgba(255,255,255,0.04)",color:txPg===txTP?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.6)"}}><ChevronRight size={14}/></button>
              </div>)}
            </>)}
          </div>
        </section>


        {/* ═══════════════════════════════════════════════════
            SECTION C — TRADING VALUATION (交易估值)
            
            INPUT:
              - Mode tab: "预期买入价" | "目标利润率" (pill toggle)
              - Single value field based on mode
              - Expandable conditions: rank, accessories, warranty
              - No data source selection here — sources appear in results
            
            RESULTS:
              - Summary card: best combo (route × platform) with key metrics
              - Route table: collapsed = avg across platforms, expanded = per-platform detail
              - Each route (jp_domestic, cn_to_jp) can expand to show StarBuyer / EcoAuc breakdown
            
            API: POST /api/valuations {
              mode: "price" | "margin", value, ref, condition,
              accessories: { box, card }, warrantyRegion, warrantyYear
            }
            Returns: { routes: [{ key, label, platforms: [{ name, revenue, fee, net, margin }], avgMargin, cost }] }
        ═══════════════════════════════════════════════════ */}
        <section id="trading-section" style={{marginBottom:"60px"}}>
          <div style={{marginBottom:"28px"}}>
            <div className="gp" style={{display:"inline-flex",padding:"4px 14px",fontSize:"11px",fontWeight:500,color:"rgba(255,255,255,0.6)",marginBottom:"14px",letterSpacing:"1px",fontFamily:bd}}>交易估值</div>
            <h2 style={{fontFamily:"'Noto Serif SC',serif",fontSize:"32px",color:"#fff",letterSpacing:"-1px",lineHeight:1.1,fontWeight:700}}>评估交易机会</h2>
            <p style={{fontSize:"13px",fontWeight:300,color:"rgba(255,255,255,0.4)",marginTop:"8px",fontFamily:bd}}>基于 Ref. {ref} 的历史成交数据，评估不同交易路径与平台的利润空间。</p>
          </div>

          {/* ── Input Panel ── */}
          <div className="gc" style={{padding:"28px 32px",borderRadius:"20px",marginBottom:"20px"}}>

            {/* Mode tab: pill toggle between 预期买入价 and 目标利润率 */}
            <div style={{display:"flex",gap:"3px",background:"rgba(255,255,255,0.04)",borderRadius:"10px",padding:"3px",marginBottom:"20px",width:"fit-content"}}>
              {[{key:"price",label:"预期买入价"},{key:"margin",label:"目标利润率"}].map(m=>(
                <button key={m.key} className="tw" onClick={()=>{setInputMode(m.key);setShowResults(false)}} style={{
                  background:inputMode===m.key?"rgba(255,255,255,0.12)":"transparent",
                  color:inputMode===m.key?"#fff":"rgba(255,255,255,0.4)",
                  fontFamily:bd,fontSize:"12px",padding:"6px 16px",
                }}>{m.label}</button>
              ))}
            </div>

            {/* Input field based on mode */}
            <div style={{marginBottom:"20px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                {inputMode==="price" ? (<>
                  <span style={{fontSize:"14px",fontWeight:500,color:"rgba(255,255,255,0.4)",fontFamily:bd}}>¥</span>
                  <input type="text" placeholder="输入预期买入价格" value={buyPrice}
                    onChange={e=>{setBuyPrice(e.target.value.replace(/[^0-9]/g,""));setShowResults(false)}}
                    style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"12px",padding:"12px 16px",fontSize:"16px",fontWeight:500,color:"#fff",fontFamily:bd,outline:"none"}}/>
                </>) : (<>
                  <input type="text" placeholder="输入目标利润率" value={targetMargin}
                    onChange={e=>{setTargetMargin(e.target.value.replace(/[^0-9.]/g,""));setShowResults(false)}}
                    style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"12px",padding:"12px 16px",fontSize:"16px",fontWeight:500,color:"#fff",fontFamily:bd,outline:"none"}}/>
                  <span style={{fontSize:"14px",fontWeight:500,color:"rgba(255,255,255,0.4)",fontFamily:bd}}>%</span>
                </>)}
              </div>
              {/* Quick margin presets */}
              {inputMode==="margin"&&(
                <div style={{display:"flex",gap:"4px",marginTop:"10px"}}>
                  {[5,10,15,20,25,30].map(m=>(
                    <button key={m} onClick={()=>{setTargetMargin(String(m));setShowResults(false)}} style={{
                      flex:1,padding:"5px 0",borderRadius:"8px",border:"none",cursor:"pointer",
                      background:targetMargin===String(m)?"rgba(34,197,94,0.12)":"rgba(255,255,255,0.03)",
                      color:targetMargin===String(m)?"#22c55e":"rgba(255,255,255,0.3)",
                      fontSize:"11px",fontWeight:500,fontFamily:bd,transition:"all 0.2s ease",
                    }}>{m}%</button>
                  ))}
                </div>
              )}
              {/* PDF 4.3 价格校验 —— 输入 < P5 / > P95 显示黄条 警示但不阻断 */}
              {inputMode==="price" && buyPrice && priceRange && (() => {
                const ip = parseInt(buyPrice);
                if (ip <= 0) return null;
                if (ip < priceRange.p5) {
                  return (
                    <div style={{display:"flex",alignItems:"flex-start",gap:"6px",marginTop:"10px",padding:"8px 12px",borderRadius:"10px",background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.12)"}}>
                      <span style={{fontSize:"13px",lineHeight:"16px",flexShrink:0}}>⚠️</span>
                      <span style={{fontSize:"11px",fontWeight:300,color:"rgba(245,158,11,0.8)",fontFamily:bd,lineHeight:1.5}}>近期最低成交价约 ¥{(priceRange.p5 ?? 0).toLocaleString()}，当前输入显著偏低，结果仅供参考</span>
                    </div>
                  );
                }
                if (ip > priceRange.p95) {
                  return (
                    <div style={{display:"flex",alignItems:"flex-start",gap:"6px",marginTop:"10px",padding:"8px 12px",borderRadius:"10px",background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.12)"}}>
                      <span style={{fontSize:"13px",lineHeight:"16px",flexShrink:0}}>⚠️</span>
                      <span style={{fontSize:"11px",fontWeight:300,color:"rgba(245,158,11,0.8)",fontFamily:bd,lineHeight:1.5}}>近期最高成交价约 ¥{(priceRange.p95 ?? 0).toLocaleString()}，当前输入显著偏高，结果仅供参考</span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Expandable conditions: rank, accessories, warranty */}
            <div style={{marginBottom:"20px"}}>
              <button onClick={()=>setShowMoreConds(!showMoreConds)} style={{
                background:"none",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:400,
                color:"rgba(255,255,255,0.35)",fontFamily:bd,display:"flex",alignItems:"center",gap:"4px",padding:"4px 0",transition:"color 0.2s",
              }}
              onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,0.6)"}
              onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.35)"}
              >
                <ChevronRight size={13} style={{transform:showMoreConds?"rotate(90deg)":"none",transition:"transform 0.2s"}}/> 更多条件（成色、附件、保修等）
              </button>
              {showMoreConds&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginTop:"12px",padding:"16px 20px",borderRadius:"14px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.04)"}}>
                  <div>
                    <span style={{fontSize:"11px",fontWeight:400,color:"rgba(255,255,255,0.4)",fontFamily:bd,display:"block",marginBottom:"8px"}}>成色 (Rank)</span>
                    <select value={condition} onChange={e=>setCondition(e.target.value)} style={{
                      width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"8px",
                      color:"#fff",padding:"7px 12px",fontSize:"12px",fontFamily:bd,cursor:"pointer",outline:"none",
                      appearance:"none",WebkitAppearance:"none",paddingRight:"28px",
                      backgroundImage:`url("data:image/svg+xml,%3Csvg width='10' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0l5 6 5-6' fill='rgba(255,255,255,0.3)' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                      backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center",
                    }}>
                      {["S","A","B","C","J"].map(r=>(<option key={r} value={r} style={{background:"#1a1a1a"}}>{r}</option>))}
                    </select>
                  </div>
                  <div>
                    <span style={{fontSize:"11px",fontWeight:400,color:"rgba(255,255,255,0.4)",fontFamily:bd,display:"block",marginBottom:"8px"}}>附件</span>
                    <div style={{display:"flex",gap:"8px"}}>
                      {[{k:"box",l:"Box（盒子）",s:hasBox,f:setHasBox},{k:"card",l:"Card（保卡）",s:hasCard,f:setHasCard}].map(a=>(
                        <button key={a.k} onClick={()=>a.f(!a.s)} style={{display:"flex",alignItems:"center",gap:"5px",padding:"6px 12px",borderRadius:"8px",border:"none",cursor:"pointer",background:a.s?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.03)",color:a.s?"#fff":"rgba(255,255,255,0.4)",fontSize:"12px",fontFamily:bd,transition:"all 0.2s",boxShadow:a.s?"inset 0 0 0 1px rgba(255,255,255,0.15)":"none"}}>{a.s&&<Check size={12}/>}{a.l}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span style={{fontSize:"11px",fontWeight:400,color:"rgba(255,255,255,0.4)",fontFamily:bd,display:"block",marginBottom:"8px"}}>保修地</span>
                    <input type="text" placeholder="例：Japan" value={warrantyRegion} onChange={e=>setWarrantyRegion(e.target.value)}
                      style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"8px",padding:"7px 12px",fontSize:"12px",color:"#fff",fontFamily:bd,outline:"none"}}/>
                  </div>
                  <div>
                    <span style={{fontSize:"11px",fontWeight:400,color:"rgba(255,255,255,0.4)",fontFamily:bd,display:"block",marginBottom:"8px"}}>保修年份</span>
                    <input type="text" placeholder="例：2023（可选）" value={warrantyYear} onChange={e=>setWarrantyYear(e.target.value.replace(/[^0-9]/g,""))}
                      style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"8px",padding:"7px 12px",fontSize:"12px",color:"#fff",fontFamily:bd,outline:"none"}}/>
                  </div>
                </div>
              )}
            </div>

            {/* PDF 4.3 运行估值 —— POST /api/valuations */}
            <button className="cb" disabled={valuationLoading || !canRunValuation}
              onClick={async () => {
                setShowResults(true); setExpandedRoutes({}); setValuationLoading(true); setValuationError(null);
                try {
                  const result = await postValuation({
                    ref,
                    mode: inputMode === "price" ? "price" : "margin",
                    value: numericInput,
                    source: valuationSource === "全部" ? "all" : (valuationSource as any),
                    condition: condition as "S" | "A" | "B" | "C" | "J",
                    accessories: { box: hasBox, card: hasCard },
                    warrantyRegion: warrantyRegion || undefined,
                    warrantyYear: warrantyYear ? Number(warrantyYear) : null,
                  });
                  setValuationResult(result);
                } catch (e: any) {
                  const msg = e?.response?.data?.error?.message
                    || e?.message
                    || "估值失败,请稍后重试";
                  setValuationError(msg);
                  setValuationResult(null);
                } finally { setValuationLoading(false); }
              }}
              style={{
                width:"100%",padding:"13px",borderRadius:"12px",border:"none",
                cursor: (valuationLoading || !canRunValuation) ? "not-allowed" : "pointer",
                background:"linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.08))",
                boxShadow:"inset 0 0 0 1px rgba(34,197,94,0.25), inset 0 1px 1px rgba(255,255,255,0.1)",
                color:"#22c55e",fontSize:"14px",fontWeight:600,fontFamily:bd,
                display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",transition:"all 0.3s ease",
                opacity: (valuationLoading || !canRunValuation) ? 0.5 : 1,
              }}><Zap size={15}/> {valuationLoading ? "估值中..." : "运行估值"}</button>
          </div>

          {/* 估值失败时的错误提示(不阻塞页面渲染) */}
          {showResults && valuationError && (
            <div className="gc" style={{padding:"16px 20px",borderRadius:"14px",marginBottom:"16px",border:"1px solid rgba(239,68,68,0.2)",background:"rgba(239,68,68,0.06)"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:"10px"}}>
                <span style={{fontSize:"14px",lineHeight:"16px"}}>⚠️</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:"13px",fontWeight:500,color:"#ef4444",fontFamily:bd,marginBottom:"3px"}}>估值未完成</div>
                  <div style={{fontSize:"12px",fontWeight:300,color:"rgba(255,255,255,0.55)",fontFamily:bd,lineHeight:1.5}}>{valuationError}</div>
                </div>
              </div>
            </div>
          )}

          {/* ── Results Area —— 全部由 valuationResult (POST /api/valuations 返回) 驱动 ── */}
          {showResults && valuationResult && (() => {
            const v = valuationResult;
            const bestDec = decisionMeta(v.bestCombo.decision);
            const bestPlatformName = DATA_SOURCE_BY_KEY[v.bestCombo.platform]?.name ?? v.bestCombo.platform;
            const bestRouteLabel = v.routes.find(r => r.key === v.bestCombo.route)?.label ?? v.bestCombo.route;
            // margin 模式优先用 backend 反解出的 inputPrice;否则按 cost 粗略反推。
            const inputPrice =
              v.inputPrice && v.inputPrice > 0
                ? v.inputPrice
                : inputMode === "price"
                ? Number(buyPrice || 0)
                : Math.round(v.bestCombo.cost / 1.155);

            return (<div>
              {/* ── 摘要卡片 (PDF 4.3 结果展示结构) ── */}
              <div className="gc" style={{padding:"28px 32px",borderRadius:"20px",marginBottom:"16px",boxShadow:`inset 0 0 0 1px ${bestDec.color}22,inset 0 1px 1px rgba(255,255,255,0.15),0 4px 30px rgba(0,0,0,0.12)`}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"18px",flexWrap:"wrap"}}>
                  <span style={{fontSize:"11px",fontWeight:500,color:"rgba(255,255,255,0.35)",fontFamily:bd,textTransform:"uppercase",letterSpacing:"1px"}}>最优组合</span>
                  <span style={{fontSize:"13px",fontWeight:600,color:"#fff",fontFamily:bd}}>{bestRouteLabel}</span>
                  <span style={{fontSize:"12px",color:"rgba(255,255,255,0.3)",fontFamily:bd}}>→</span>
                  <span style={{fontSize:"13px",fontWeight:500,color:"rgba(255,255,255,0.7)",fontFamily:bd}}>{bestPlatformName}</span>
                  <span style={{display:"inline-flex",alignItems:"center",gap:"3px",padding:"3px 12px",borderRadius:"8px",fontSize:"12px",fontWeight:600,background:bestDec.bg,color:bestDec.color,fontFamily:bd}}>{bestDec.label}</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"14px"}}>
                  <div style={{padding:"18px 20px",borderRadius:"14px",background:"rgba(255,255,255,0.03)",border:`1px solid ${bestDec.color}15`}}>
                    <div style={{fontSize:"10px",fontWeight:500,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"6px",fontFamily:bd}}>利润率</div>
                    <div style={{fontSize:"34px",fontWeight:700,color:bestDec.color,fontFamily:bd,letterSpacing:"-1px",lineHeight:1}}>{(v.bestCombo.margin ?? 0)>0?"+":""}{(v.bestCombo.margin ?? 0).toFixed(1)}%</div>
                  </div>
                  <div style={{padding:"18px 20px",borderRadius:"14px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)"}}>
                    <div style={{fontSize:"10px",fontWeight:500,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"6px",fontFamily:bd}}>预估净回款</div>
                    <div style={{fontSize:"26px",fontWeight:600,color:"#fff",fontFamily:bd,letterSpacing:"-0.5px"}}>¥{(v.bestCombo.net ?? 0).toLocaleString()}</div>
                  </div>
                  <div style={{padding:"18px 20px",borderRadius:"14px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)"}}>
                    <div style={{fontSize:"10px",fontWeight:500,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"6px",fontFamily:bd}}>总成本</div>
                    <div style={{fontSize:"26px",fontWeight:600,color:"rgba(255,255,255,0.7)",fontFamily:bd,letterSpacing:"-0.5px"}}>¥{(v.bestCombo.cost ?? 0).toLocaleString()}</div>
                  </div>
                </div>
                {/* PDF 估价级别映射 —— 摘要卡片底部小字 */}
                <div style={{marginTop:"14px",fontSize:"11px",color:"rgba(255,255,255,0.25)",fontFamily:bd}}>
                  {valuationLevelLabel(v.level)} · {v.samples ?? 0}条样本 · 近{v.windowDays ?? 30}天 · 预期买入价 ¥{(inputPrice ?? 0).toLocaleString()}
                </div>
              </div>

              {/* ── 明细表 收起态/展开态 ── */}
              <div className="gc" style={{padding:0,borderRadius:"18px",overflow:"hidden"}}>
                <div style={{display:"grid",gridTemplateColumns:"140px 110px 120px 120px 120px 1fr",padding:"12px 24px",gap:"12px",borderBottom:"1px solid rgba(255,255,255,0.06)",alignItems:"center"}}>
                  {["交易路径","决策","预期买入价","总成本","平均净回款","平均利润率"].map((h,i)=>(
                    <span key={i} style={{fontSize:"10px",fontWeight:500,color:"rgba(255,255,255,0.3)",letterSpacing:"0.8px",fontFamily:bd,whiteSpace:"nowrap"}}>{h}</span>
                  ))}
                </div>

                {v.routes.map((r, ri) => {
                  // 路径决策标签 = 该路径下最优平台决策 (avg-based 也可由后端给定)
                  const bestInRoute = r.platforms.reduce<any>((acc, p) => !acc || p.margin > acc.margin ? p : acc, null);
                  const routeDec = decisionMeta(bestInRoute?.decision);
                  const isOpen = !!expandedRoutes[r.key];
                  return (
                    <div key={r.key}>
                      <div onClick={()=>setExpandedRoutes(prev=>({...prev,[r.key]:!prev[r.key]}))} className="tr" style={{
                        display:"grid",gridTemplateColumns:"140px 110px 120px 120px 120px 1fr",
                        padding:"16px 24px",gap:"12px",alignItems:"center",
                        borderBottom: !isOpen && ri < v.routes.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      }}>
                        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                          <ChevronRight size={14} color="rgba(255,255,255,0.3)" style={{transform:isOpen?"rotate(90deg)":"none",transition:"transform 0.2s",flexShrink:0}}/>
                          <div style={{fontSize:"13px",fontWeight:500,color:"#fff",fontFamily:bd}}>{r.label}</div>
                        </div>
                        <span style={{display:"inline-flex",alignItems:"center",gap:"3px",padding:"4px 12px",borderRadius:"8px",fontSize:"12px",fontWeight:600,background:routeDec.bg,color:routeDec.color,fontFamily:bd,width:"fit-content"}}>{routeDec.label}</span>
                        <span style={{fontSize:"14px",fontWeight:500,color:"rgba(255,255,255,0.7)",fontFamily:bd}}>¥{(inputPrice ?? 0).toLocaleString()}</span>
                        <span style={{fontSize:"14px",fontWeight:500,color:"rgba(255,255,255,0.7)",fontFamily:bd}}>¥{(r.cost ?? 0).toLocaleString()}</span>
                        <span style={{fontSize:"14px",fontWeight:500,color:"rgba(255,255,255,0.7)",fontFamily:bd}}>¥{(r.avgRevenue ?? 0).toLocaleString()}</span>
                        <span style={{fontSize:"14px",fontWeight:700,color:routeDec.color,fontFamily:bd}}>{(r.avgMargin ?? 0)>0?"+":""}{(r.avgMargin ?? 0).toFixed(1)}%</span>
                      </div>

                      {isOpen && (
                        <div style={{background:"rgba(255,255,255,0.02)",borderBottom: ri < v.routes.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none"}}>
                          {/* PDF 明细表展开态列宽 60 100 100 90 90 100 80 1fr —— 含买入平台列 */}
                          <div style={{display:"grid",gridTemplateColumns:"60px 100px 100px 90px 90px 100px 80px 1fr",padding:"8px 24px 8px 60px",gap:"10px",alignItems:"center"}}>
                            {["","买入平台","卖出平台","决策","利润率","预估售价","手续费率","净回款"].map((h,i)=>(
                              <span key={i} style={{fontSize:"9px",fontWeight:500,color:"rgba(255,255,255,0.2)",letterSpacing:"0.8px",fontFamily:bd,whiteSpace:"nowrap"}}>{h}</span>
                            ))}
                          </div>
                          {r.platforms.map((sellP, pi) => {
                            const pDec = decisionMeta(sellP.decision);
                            const sellSource = DATA_SOURCE_BY_KEY[sellP.key];
                            // PDF v1.1 Section C: 当前不展开"买入平台"维度，路径已隐含买入侧；同平台买卖暂不支持
                            // Phase 8 会引入挂牌价平台作为 CN_TO_JP 买入侧
                            const buyPlatformLabel = r.key === "jp_domestic" ? "拍卖平台" : "挂牌价平台";
                            return (
                              <div key={sellP.key} style={{
                                display:"grid",gridTemplateColumns:"60px 100px 100px 90px 90px 100px 80px 1fr",
                                padding:"10px 24px 10px 60px",gap:"10px",alignItems:"center",
                                borderBottom: pi < r.platforms.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                              }}>
                                <span/>
                                <span style={{fontSize:"12px",fontWeight:400,color:"rgba(255,255,255,0.45)",fontFamily:bd}}>{buyPlatformLabel}</span>
                                <div style={{display:"flex",alignItems:"center",gap:"5px"}}>
                                  <span style={{width:"6px",height:"6px",borderRadius:"50%",background:sellSource?.color ?? "#888",flexShrink:0}}/>
                                  <span style={{fontSize:"12px",fontWeight:500,color:"rgba(255,255,255,0.6)",fontFamily:bd}}>{sellP.name}</span>
                                </div>
                                <span style={{display:"inline-flex",alignItems:"center",padding:"2px 8px",borderRadius:"6px",fontSize:"10px",fontWeight:600,background:pDec.bg,color:pDec.color,fontFamily:bd,width:"fit-content"}}>{pDec.label}</span>
                                <span style={{fontSize:"12px",fontWeight:600,color:pDec.color,fontFamily:bd}}>{(sellP.margin ?? 0)>0?"+":""}{(sellP.margin ?? 0).toFixed(1)}%</span>
                                <span style={{fontSize:"12px",fontWeight:400,color:"rgba(255,255,255,0.5)",fontFamily:bd}}>¥{(sellP.revenue ?? 0).toLocaleString()}</span>
                                <span style={{fontSize:"12px",fontWeight:400,color:"rgba(255,255,255,0.4)",fontFamily:bd}}>{((sellP.feeRate ?? 0)*100).toFixed(1)}%</span>
                                <span style={{fontSize:"12px",fontWeight:500,color:"rgba(255,255,255,0.7)",fontFamily:bd}}>¥{(sellP.net ?? 0).toLocaleString()}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>);
          })()}

          {/* PDF 4.4.4 可询价货源 —— 系统按预计买入价 × (1-下浮 ~ 1+上浮) 在挂牌价平台筛选 */}
          {showResults && valuationResult && valuationResult.sourcing && valuationResult.sourcing.length > 0 && (
            <div className="gc" style={{padding:0,borderRadius:"18px",overflow:"hidden",marginTop:"16px"}}>
              <div style={{padding:"16px 24px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:"13px",fontWeight:600,color:"#fff",fontFamily:bd}}>可询价货源</div>
                  <div style={{fontSize:"11px",fontWeight:300,color:"rgba(255,255,255,0.35)",fontFamily:bd,marginTop:"3px"}}>
                    按"价格接近 · 成色加分 · 附件加分"排序，仅作选购参考
                  </div>
                </div>
                <span style={{fontSize:"11px",fontWeight:400,color:"rgba(255,255,255,0.4)",fontFamily:bd}}>{valuationResult.sourcing.length} 条在售</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"100px 1fr 110px 70px 100px 70px",padding:"10px 24px",gap:"10px",borderBottom:"1px solid rgba(255,255,255,0.04)",alignItems:"center"}}>
                {["平台","标题","挂牌价","成色","附件",""].map((h,i)=>(
                  <span key={i} style={{fontSize:"10px",fontWeight:500,color:"rgba(255,255,255,0.3)",letterSpacing:"0.8px",fontFamily:bd,whiteSpace:"nowrap"}}>{h}</span>
                ))}
              </div>
              {valuationResult.sourcing.map((s, i) => (
                <div key={i} style={{
                  display:"grid",gridTemplateColumns:"100px 1fr 110px 70px 100px 70px",
                  padding:"12px 24px",gap:"10px",alignItems:"center",
                  borderBottom: i < valuationResult.sourcing!.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                }}>
                  <span style={{fontSize:"11px",fontWeight:500,color:"rgba(255,255,255,0.55)",fontFamily:bd,textTransform:"uppercase",letterSpacing:"0.5px"}}>{s.platform}</span>
                  <span style={{fontSize:"12px",fontWeight:400,color:"rgba(255,255,255,0.7)",fontFamily:bd,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.title}</span>
                  <span style={{fontSize:"13px",fontWeight:600,color:"#fff",fontFamily:bd}}>¥{(s.price ?? 0).toLocaleString()}</span>
                  <span style={{fontSize:"11px",fontWeight:500,color:"rgba(255,255,255,0.5)",fontFamily:bd}}>{s.condition || "—"}</span>
                  <div style={{display:"flex",gap:"4px"}}>
                    {s.accessories?.box && <span style={{fontSize:"10px",padding:"2px 7px",borderRadius:"5px",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.5)"}}>Box</span>}
                    {s.accessories?.card && <span style={{fontSize:"10px",padding:"2px 7px",borderRadius:"5px",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.5)"}}>Card</span>}
                    {!s.accessories?.box && !s.accessories?.card && <span style={{fontSize:"11px",color:"rgba(255,255,255,0.2)"}}>—</span>}
                  </div>
                  <a href={s.listingUrl} target="_blank" rel="noopener noreferrer" style={{fontSize:"12px",color:"rgba(100,130,200,0.8)",textDecoration:"none",fontFamily:bd,display:"flex",alignItems:"center",gap:"3px",justifySelf:"end"}}>
                    查看<ExternalLink size={11}/>
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* PDF v1.1 Section C 底部引导文案 + 共享关注按钮 */}
          <div style={{marginTop:"16px",padding:"16px 20px",borderRadius:"14px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.04)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px",flex:1}}>
              <Bell size={14} color="rgba(255,255,255,0.3)" style={{flexShrink:0}}/>
              <span style={{fontSize:"12px",fontWeight:300,color:"rgba(255,255,255,0.35)",fontFamily:bd}}>加入关注列表后，系统将每日监控各平台货源并通过飞书推送</span>
            </div>
            <WatchlistToggle entry={{ ref: watch?.ref ?? ref, brand: watch?.brand, name: watch?.name }} variant="button" />
          </div>
        </section>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer style={{padding:"32px 40px 24px",borderTop:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{maxWidth:"1280px",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:"16px"}}><span style={{fontFamily:hd,fontStyle:"italic",fontSize:"16px",color:"rgba(255,255,255,0.5)"}}>Raventik</span><span style={{fontSize:"11px",fontWeight:300,color:"rgba(255,255,255,0.25)",fontFamily:bd}}>© 2026 谕鸦科技 Ravacle Inc.</span></div>
          <div style={{display:"flex",gap:"20px"}}>{["隐私政策","服务条款","联系我们"].map((l,i)=>(<a key={i} href="#" style={{fontSize:"11px",fontWeight:400,color:"rgba(255,255,255,0.3)",textDecoration:"none",transition:"color 0.2s",fontFamily:bd}} onMouseEnter={e=>{(e.target as HTMLElement).style.color="rgba(255,255,255,0.7)"}} onMouseLeave={e=>{(e.target as HTMLElement).style.color="rgba(255,255,255,0.3)"}}>{l}</a>))}</div>
        </div>
      </footer>
    </div>
  );
}
