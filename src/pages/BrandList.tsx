/**
 * Raventik — Brand List (/brands)
 *
 * 24+ 真实品牌 3D 玻璃卡格栅,点击进 /brands/:slug 详情。
 * 数据源: GET /api/brands
 * 设计稿: ~/Downloads/raventik_brands.jsx
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { listBrands } from "../api/brands";
import type { BrandSummary } from "../api/types";

const hd = "'Instrument Serif','Noto Serif SC',serif";
const bd = "'Barlow','Noto Sans SC',sans-serif";
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function BrandList() {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [activeLetter, setActiveLetter] = useState<string>("ALL");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listBrands()
      .then(r => setBrands(r.items ?? []))
      .catch(() => setErr("品牌列表加载失败"))
      .finally(() => setLoading(false));
  }, []);

  const filteredBrands = activeLetter === "ALL"
    ? brands
    : brands.filter(b => (b.name?.[0] || "").toUpperCase() === activeLetter);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollRef.current) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY * 2;
    }
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: bd }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Barlow:wght@300;400;500;600&family=Noto+Serif+SC:wght@400;600;700&family=Noto+Sans+SC:wght@300;400;500&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        .brand-card-wrapper{perspective:800px;cursor:pointer}
        .brand-card{position:relative;border-radius:18px;transition:all 0.5s cubic-bezier(0.16,1,0.3,1);transform:rotateX(2deg) rotateY(-2deg);transform-style:preserve-3d}
        .brand-card:hover{transform:rotateX(0deg) rotateY(0deg) translateY(-6px)}
        .card-front{position:relative;background:rgba(255,255,255,0.06);background-blend-mode:luminosity;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:18px;overflow:hidden;z-index:2;box-shadow:inset 0 1px 1px rgba(255,255,255,0.18),inset 0 -1px 1px rgba(255,255,255,0.04)}
        .card-front::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1.2px;background:linear-gradient(165deg,rgba(255,255,255,0.45) 0%,rgba(255,255,255,0.15) 20%,rgba(255,255,255,0) 45%,rgba(255,255,255,0) 55%,rgba(255,255,255,0.1) 80%,rgba(255,255,255,0.3) 100%);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none;z-index:3}
        .card-front::after{content:'';position:absolute;top:-60%;left:-30%;width:160%;height:160%;background:radial-gradient(ellipse at 35% 25%,rgba(255,255,255,0.07) 0%,transparent 50%);pointer-events:none;z-index:1}
        .card-depth-bottom{position:absolute;bottom:-8px;left:6px;right:-2px;height:12px;background:linear-gradient(to bottom,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.01) 100%);border-radius:0 0 16px 16px;transform:skewX(-2deg);z-index:1;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);transition:all 0.5s cubic-bezier(0.16,1,0.3,1);box-shadow:0 2px 8px rgba(0,0,0,0.3)}
        .brand-card:hover .card-depth-bottom{bottom:-12px;height:14px;box-shadow:0 4px 16px rgba(0,0,0,0.4)}
        .card-depth-right{position:absolute;top:6px;right:-8px;bottom:-2px;width:12px;background:linear-gradient(to right,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0.008) 100%);border-radius:0 16px 16px 0;transform:skewY(-2deg);z-index:1;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);transition:all 0.5s cubic-bezier(0.16,1,0.3,1)}
        .brand-card:hover .card-depth-right{right:-12px;width:14px}
        .card-shadow{position:absolute;inset:10px -4px -10px 10px;background:rgba(0,0,0,0.25);border-radius:18px;filter:blur(16px);z-index:0;transition:all 0.5s cubic-bezier(0.16,1,0.3,1)}
        .brand-card:hover .card-shadow{inset:14px -8px -18px 14px;background:rgba(0,0,0,0.35);filter:blur(24px)}
        .gp{background:rgba(255,255,255,0.08);background-blend-mode:luminosity;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:9999px;box-shadow:inset 0 1px 1px rgba(255,255,255,0.15),0 2px 12px rgba(0,0,0,0.08);position:relative;overflow:hidden}
        .gp::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1px;background:linear-gradient(180deg,rgba(255,255,255,0.35) 0%,rgba(255,255,255,0.1) 30%,rgba(255,255,255,0) 50%,rgba(255,255,255,0.1) 70%,rgba(255,255,255,0.35) 100%);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
        .explore-link{display:flex;align-items:center;gap:4px;font-size:12px;color:rgba(255,255,255,0.3);transition:all 0.3s ease}
        .brand-card:hover .explore-link{color:rgba(255,255,255,0.7);transform:translateX(3px)}
        ::selection{background:rgba(255,255,255,0.2);color:#fff}
        .alpha-scroll{-ms-overflow-style:none;scrollbar-width:none}
        .alpha-scroll::-webkit-scrollbar{display:none}
      `}</style>

      {/* ═══ NAV ═══ */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:50,padding:"12px 40px",background:"rgba(10,10,10,0.6)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{maxWidth:"1280px",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <Link to="/" style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <img src="/logo/raventik_logo_nav_32.png" width={32} height={32} style={{borderRadius:"8px",objectFit:"contain"}} alt="Raventik"/>
            <span style={{fontFamily:hd,fontStyle:"italic",fontSize:"20px",color:"#fff",letterSpacing:"-0.5px"}}>Raventik</span>
          </Link>
          <div className="gp" style={{display:"flex",alignItems:"center",gap:"2px",padding:"4px 6px"}}>
            {[
              { to: "/", label: "首页" },
              { to: "/brands", label: "品牌列表" },
              { to: "/config", label: "配置表" },
              { to: "/watchlist", label: "关注列表" },
            ].map(item => {
              const active = item.to === "/brands";
              return (
                <Link key={item.to} to={item.to} style={{
                  padding: "6px 12px", fontSize: "12px", fontWeight: 400,
                  borderRadius: "9999px",
                  color: active ? "#fff" : "rgba(255,255,255,0.7)",
                  background: active ? "rgba(255,255,255,0.08)" : "transparent",
                  textDecoration: "none", fontFamily: bd, transition: "all 0.2s",
                }}>{item.label}</Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Ambient orbs */}
      <div style={{position:"fixed",top:"5%",left:"10%",width:"600px",height:"500px",background:"radial-gradient(ellipse,rgba(80,120,200,0.06) 0%,transparent 60%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",bottom:"10%",right:"0",width:"500px",height:"400px",background:"radial-gradient(ellipse,rgba(140,100,200,0.04) 0%,transparent 60%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"700px",height:"500px",background:"radial-gradient(ellipse,rgba(100,160,140,0.03) 0%,transparent 55%)",pointerEvents:"none",zIndex:0}}/>

      {/* ═══ MAIN ═══ */}
      <main style={{maxWidth:"1280px",margin:"0 auto",padding:"100px 40px 60px",position:"relative",zIndex:1}}>
        {/* Header */}
        <div style={{marginBottom:"36px"}}>
          <div style={{marginBottom:"16px"}}>
            <div className="gp" style={{display:"inline-flex",padding:"4px 14px",fontSize:"11px",fontWeight:500,color:"rgba(255,255,255,0.6)",marginBottom:"16px",letterSpacing:"1px",fontFamily:bd}}>品牌</div>
            <h1 style={{fontFamily:"'Noto Serif SC',serif",fontSize:"clamp(32px,4vw,46px)",color:"#fff",letterSpacing:"-1px",lineHeight:1.1,fontWeight:700,marginBottom:"8px"}}>按品牌探索</h1>
          </div>

          {/* Subtitle + Alphabet filter — same line */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"20px"}}>
            <p style={{fontSize:"14px",fontWeight:300,color:"rgba(255,255,255,0.4)",fontFamily:bd}}>
              {loading ? "加载中..." : err ? err : `覆盖 ${brands.length} 个主流品牌,跨平台历史交易数据聚合。`}
            </p>

            {!loading && !err && brands.length > 0 && (
              <div style={{display:"flex",alignItems:"center",gap:"10px",flexShrink:0}}>
                {/* ALL — always visible */}
                <button onClick={() => setActiveLetter("ALL")} style={{
                  padding: "6px 14px", borderRadius: "8px", border: "none", cursor: "pointer",
                  background: activeLetter === "ALL" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.04)",
                  color: activeLetter === "ALL" ? "#fff" : "rgba(255,255,255,0.5)",
                  fontSize: "12px", fontWeight: 600, fontFamily: hd, fontStyle: "italic",
                  transition: "all 0.2s", flexShrink: 0,
                  boxShadow: activeLetter === "ALL" ? "inset 0 1px 0 rgba(255,255,255,0.1)" : "none",
                }}
                onMouseEnter={e => { if (activeLetter !== "ALL") (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)"; }}
                onMouseLeave={e => { if (activeLetter !== "ALL") (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; }}
                >ALL</button>

                <div style={{width:"1px",height:"20px",background:"rgba(255,255,255,0.1)",flexShrink:0}}/>

                {/* A-Z carousel */}
                <div style={{position:"relative",width:"340px",flexShrink:0}}>
                  <div style={{position:"absolute",left:0,top:0,bottom:0,width:"28px",zIndex:2,background:"linear-gradient(to right,rgba(10,10,10,1) 0%,rgba(10,10,10,0.8) 40%,transparent 100%)",pointerEvents:"none",borderRadius:"10px 0 0 10px"}}/>
                  <div style={{position:"absolute",right:0,top:0,bottom:0,width:"28px",zIndex:2,background:"linear-gradient(to left,rgba(10,10,10,1) 0%,rgba(10,10,10,0.8) 40%,transparent 100%)",pointerEvents:"none",borderRadius:"0 10px 10px 0"}}/>
                  <div ref={scrollRef} onWheel={handleWheel} className="alpha-scroll" style={{
                    display:"flex",alignItems:"center",gap:"1px",
                    overflowX:"auto",scrollBehavior:"smooth",
                    padding:"5px 24px",
                    WebkitOverflowScrolling:"touch",
                    background:"rgba(255,255,255,0.03)",borderRadius:"10px",
                    border:"1px solid rgba(255,255,255,0.06)",
                    boxShadow:"inset 0 1px 2px rgba(0,0,0,0.2),inset 0 -1px 1px rgba(255,255,255,0.04)",
                  }}>
                    {LETTERS.map(l => {
                      const active = activeLetter === l;
                      return (
                        <button key={l} onClick={() => setActiveLetter(l)} style={{
                          padding: "5px 0", borderRadius: "5px", border: "none", cursor: "pointer",
                          background: active ? "rgba(255,255,255,0.15)" : "transparent",
                          color: active ? "#fff" : "rgba(255,255,255,0.45)",
                          fontSize: "13px", fontWeight: 600, fontFamily: hd, fontStyle: "italic",
                          transition: "all 0.15s", width: "30px", textAlign: "center",
                          flexShrink: 0,
                          boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,0.1)" : "none",
                        }}
                        onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; } }}
                        onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; (e.currentTarget as HTMLElement).style.background = "transparent"; } }}
                        >{l}</button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active filter indicator */}
          {activeLetter !== "ALL" && (
            <div style={{fontSize:"13px",fontWeight:300,color:"rgba(255,255,255,0.4)",fontFamily:bd,marginTop:"12px"}}>
              "{activeLetter}" 开头 · {filteredBrands.length} 个品牌
            </div>
          )}
        </div>

        {!loading && !err && filteredBrands.length > 0 && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"28px 24px"}}>
            {filteredBrands.map((brand) => {
              const nameLen = brand.name.length;
              const nameSize = nameLen > 16 ? "20px" : nameLen > 10 ? "24px" : "28px";
              return (
                <div key={brand.slug} className="brand-card-wrapper" onClick={() => navigate(`/brands/${brand.slug}`)}>
                  <div className="brand-card">
                    <div className="card-shadow"/>
                    <div className="card-depth-bottom"/>
                    <div className="card-depth-right"/>
                    <div className="card-front" style={{padding:"28px 24px",height:"190px",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
                      <div style={{position:"relative",zIndex:2,height:"80px"}}>
                        <div style={{fontFamily:hd,fontStyle:"italic",fontSize:nameSize,color:"#fff",letterSpacing:"-0.5px",lineHeight:1.15,marginBottom:"4px"}}>{brand.name}</div>
                        {brand.nameCn && (
                          <div style={{fontSize:"13px",fontWeight:400,color:"rgba(255,255,255,0.4)",fontFamily:"'Noto Sans SC',sans-serif"}}>{brand.nameCn}</div>
                        )}
                      </div>
                      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",position:"relative",zIndex:2,marginTop:"20px"}}>
                        <div>
                          <div style={{fontSize:"11px",fontWeight:300,color:"rgba(255,255,255,0.25)",fontFamily:bd,marginBottom:"2px"}}>
                            <span style={{fontWeight:600,color:"rgba(255,255,255,0.65)",fontSize:"13px",fontFamily:bd}}>{brand.modelCount.toLocaleString()}</span> 个型号
                          </div>
                          <div style={{fontSize:"11px",fontWeight:300,color:"rgba(255,255,255,0.25)",fontFamily:bd}}>
                            <span style={{fontWeight:600,color:"rgba(255,255,255,0.65)",fontSize:"13px",fontFamily:bd}}>{(brand.totalTransactions ?? 0).toLocaleString()}</span> 条交易
                          </div>
                        </div>
                        <div className="explore-link">探索<ChevronRight size={14}/></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !err && brands.length > 0 && filteredBrands.length === 0 && (
          <div style={{padding:"60px 20px",textAlign:"center",color:"rgba(255,255,255,0.4)",fontFamily:bd,fontSize:"13px"}}>
            没有以 "{activeLetter}" 开头的品牌
          </div>
        )}
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer style={{padding:"40px 40px 28px",borderTop:"1px solid rgba(255,255,255,0.06)",marginTop:"40px"}}>
        <div style={{maxWidth:"1280px",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
            <span style={{fontFamily:hd,fontStyle:"italic",fontSize:"16px",color:"rgba(255,255,255,0.5)"}}>Raventik</span>
            <span style={{fontSize:"11px",fontWeight:300,color:"rgba(255,255,255,0.25)",fontFamily:bd}}>© 2026 谕鸦科技 Ravacle Inc.</span>
          </div>
          <div style={{display:"flex",gap:"20px"}}>
            {["隐私政策","服务条款","联系我们"].map((link,i) => (
              <a key={i} href="#" style={{fontSize:"11px",fontWeight:400,color:"rgba(255,255,255,0.3)",textDecoration:"none",fontFamily:bd}}>{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
