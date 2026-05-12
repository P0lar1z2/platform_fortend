import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowUpRight, TrendingUp, TrendingDown, ChevronRight, Eye, BarChart3, Globe, Database, Clock, Star, ArrowRight, X } from "lucide-react";
import { useSearchHistory } from "../hooks/useSearchHistory";
import { truncate20 } from "../lib/labels";

// ─── MOCK DATA ───────────────────────────────────────────
const STATS = [
  { value: "38,000+", label: "监控表款", icon: Database },
  { value: "124,500", label: "在售信息", icon: Globe },
  { value: "4", label: "数据平台", icon: Star },
  { value: "2.1M+", label: "历史价格点", icon: BarChart3 },
];

const BRANDS = [
  { name: "Rolex", nameCn: "劳力士", count: "12,400+" },
  { name: "Omega", nameCn: "欧米茄", count: "8,200+" },
  { name: "Patek Philippe", nameCn: "百达翡丽", count: "3,100+" },
  { name: "Audemars Piguet", nameCn: "爱彼", count: "2,800+" },
  { name: "Cartier", nameCn: "卡地亚", count: "4,500+" },
  { name: "IWC", nameCn: "万国", count: "3,900+" },
  { name: "Tudor", nameCn: "帝舵", count: "5,100+" },
  { name: "Grand Seiko", nameCn: "冠蓝狮", count: "2,200+" },
];

const MOVERS = [
  { rank: 1, name: "Submariner Date", nameCn: "潜航者日历型", ref: "126610LN", brand: "Rolex", price: "¥96,200", change: "+4.2%", direction: "up", sparkline: [40,42,41,43,45,44,48,52,55,58] },
  { rank: 2, name: "Speedmaster Pro", nameCn: "超霸专业版", ref: "310.30.42.50.01.002", brand: "Omega", price: "¥42,800", change: "-3.1%", direction: "down", sparkline: [60,58,55,57,53,50,48,47,45,44] },
  { rank: 3, name: "Royal Oak", nameCn: "皇家橡树", ref: "15500ST", brand: "AP", price: "¥279,500", change: "+6.8%", direction: "up", sparkline: [30,32,31,35,38,40,42,45,50,55] },
  { rank: 4, name: "Nautilus", nameCn: "鹦鹉螺", ref: "5711/1A-010", brand: "PP", price: "¥929,000", change: "+2.1%", direction: "up", sparkline: [45,46,44,47,48,46,49,50,51,52] },
  { rank: 5, name: "Datejust 36", nameCn: "日志型 36", ref: "126234", brand: "Rolex", price: "¥66,100", change: "-1.8%", direction: "down", sparkline: [50,52,51,49,48,50,47,46,45,44] },
  { rank: 6, name: "Santos", nameCn: "山度士", ref: "WSSA0018", brand: "Cartier", price: "¥52,300", change: "+3.5%", direction: "up", sparkline: [35,36,38,37,40,42,41,44,46,48] },
  { rank: 7, name: "Black Bay 58", nameCn: "碧湾 58", ref: "M79030N", brand: "Tudor", price: "¥26,500", change: "-2.4%", direction: "down", sparkline: [48,50,49,47,46,48,45,43,42,40] },
  { rank: 8, name: "Snowflake", nameCn: "雪花", ref: "SBGA211", brand: "GS", price: "¥39,200", change: "+1.9%", direction: "up", sparkline: [40,41,40,42,43,42,44,43,45,46] },
];

// 历史为空时降级到这一组（少于 1 条隐藏整块，PDF 2.2 已说明）
// 不再使用 TRENDING；保留注释作 PR 上下文

const PLATFORMS = [
  { name: "Chrono24", listings: "52,400", region: "全球" },
  { name: "Rakuten", listings: "31,200", region: "日本" },
  { name: "Yahoo 拍卖", listings: "28,600", region: "日本" },
  { name: "Starbuyer", listings: "12,300", region: "日本" },
];

// ─── SPARKLINE ───────────────────────────────────────────
function Sparkline({ data, direction, width = 80, height = 28 }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  const color = direction === "up" ? "#22c55e" : "#ef4444";
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── ANIMATED VALUE ──────────────────────────────────────
function AnimatedValue({ value, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
      if (ref.current) obs.observe(ref.current);
      return () => obs.disconnect();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return (
    <span ref={ref} style={{
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
      filter: visible ? "blur(0px)" : "blur(8px)",
      transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)", display: "inline-block",
    }}>{value}</span>
  );
}

// ─── PRICE DISTRIBUTION ─────────────────────────────────
function PriceDistribution() {
  const segments = [
    { range: "< ¥7K", pct: 8, count: "9,960" },
    { range: "¥7K–35K", pct: 28, count: "34,860" },
    { range: "¥35K–110K", pct: 32, count: "39,840" },
    { range: "¥110K–360K", pct: 20, count: "24,900" },
    { range: "¥360K–720K", pct: 8, count: "9,960" },
    { range: "¥720K+", pct: 4, count: "4,980" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {segments.map((seg, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ width: "90px", fontSize: "12px", color: "rgba(255,255,255,0.5)", fontFamily: "'Noto Sans SC','Barlow',sans-serif", fontWeight: 300, textAlign: "right", flexShrink: 0 }}>{seg.range}</span>
          <div style={{ flex: 1, height: "22px", borderRadius: "4px", background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
            <div style={{ width: `${seg.pct}%`, height: "100%", borderRadius: "4px", background: "linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.25))", transition: "width 1.2s cubic-bezier(0.16,1,0.3,1)" }} />
          </div>
          <span style={{ width: "50px", fontSize: "11px", color: "rgba(255,255,255,0.35)", fontFamily: "'Noto Sans SC','Barlow',sans-serif", fontWeight: 300, flexShrink: 0 }}>{seg.count}</span>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────
export default function RaventikCN() {
  const [searchValue, setSearchValue] = useState("");
  const [logoHover, setLogoHover] = useState(false);
  const [hoveredHistory, setHoveredHistory] = useState<string | null>(null);
  const navigate = useNavigate();
  const { history, push: pushHistory, remove: removeHistory } = useSearchHistory();

  const submitSearch = (q: string) => {
    const term = q.trim();
    if (!term) return;
    pushHistory(term);
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  useEffect(() => {
    // preload fonts
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Barlow:wght@300;400;500;600&family=Noto+Serif+SC:wght@400;600;700&family=Noto+Sans+SC:wght@300;400;500&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  const heading = "'Instrument Serif','Noto Serif SC',serif";
  const body = "'Barlow','Noto Sans SC',sans-serif";

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: body, overflow: "hidden" }}>
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
          position: relative;
          overflow: hidden;
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
          background: radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.06) 0%, transparent 50%);
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
          position: relative;
          overflow: hidden;
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
          position: relative;
          overflow: hidden;
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

        .mr { transition: background 0.2s ease; cursor: pointer; }
        .mr:hover { background: rgba(255,255,255,0.06); }

        .bc { transition: all 0.3s cubic-bezier(0.16,1,0.3,1); cursor: pointer; }
        .bc:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.2); }

        .sc {
          transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
          background: rgba(255,255,255,0.05);
          background-blend-mode: luminosity;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: none;
          box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);
          position: relative;
          overflow: hidden;
        }
        .sc::before {
          content:''; position:absolute; inset:0; border-radius:inherit; padding:1px;
          background: linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.08) 70%, rgba(255,255,255,0.25) 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude; pointer-events:none;
        }
        .sc:focus-within { box-shadow: inset 0 1px 1px rgba(255,255,255,0.15), 0 0 0 1px rgba(255,255,255,0.15), 0 8px 40px rgba(0,0,0,0.3); }

        .fi { animation: fadeIn 0.8s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes fadeIn {
          from { opacity:0; transform:translateY(16px); filter:blur(6px); }
          to { opacity:1; transform:translateY(0); filter:blur(0); }
        }

        .pb { transition: all 0.2s ease; }
        .pb:hover { background: rgba(255,255,255,0.12); }

        .tt {
          display:inline-flex; align-items:center; gap:2px;
          padding:2px 8px; border-radius:9999px;
          font-size:12px; font-weight:500;
        }

        .cb { transition: all 0.3s cubic-bezier(0.16,1,0.3,1); }
        .cb:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(255,255,255,0.1); }

        ::selection { background: rgba(255,255,255,0.2); color: #fff; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.15); border-radius:3px; }
      `}</style>

      {/* ═══ NAVBAR ═══ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        padding: "16px 40px",
        background: "rgba(10,10,10,0.6)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px" }}
                onMouseEnter={() => setLogoHover(true)} onMouseLeave={() => setLogoHover(false)}>
            <img
              src={logoHover
                ? "/logo-hover/raventik_holographic_smoke_chrome_64x64.png"
                : "/logo/raventik_logo_nav_32.png"}
              width={32} height={32}
              style={{ borderRadius: "8px", objectFit: "contain", transition: "opacity 200ms" }}
              alt="Raventik"
            />
            <span style={{ fontFamily: heading, fontStyle: "italic", fontSize: "22px", color: "#fff", letterSpacing: "-0.5px" }}>Raventik</span>
          </Link>

          <div className="gp" style={{ display: "flex", alignItems: "center", gap: "2px", padding: "4px 6px" }}>
            {[
              { to: "/", label: "首页" },
              { to: "/brands", label: "品牌列表" },
              { to: "/config", label: "配置表" },
              { to: "/watchlist", label: "关注列表" },
            ].map(item => (
              <Link key={item.to} to={item.to} style={{
                padding: "6px 14px", fontSize: "13px", fontWeight: 400,
                color: "rgba(255,255,255,0.8)", textDecoration: "none",
                borderRadius: "9999px", transition: "all 0.2s ease",
                fontFamily: body,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)"; }}
              >{item.label}</Link>
            ))}
            <Link to="/login" className="cb" style={{
              padding: "6px 16px", fontSize: "13px", fontWeight: 500,
              color: "#0a0a0a", background: "#fff", borderRadius: "9999px",
              textDecoration: "none",
              display: "flex", alignItems: "center", gap: "4px",
              fontFamily: body,
            }}>登录 <ArrowUpRight size={13} /></Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section style={{
        position: "relative", minHeight: "680px",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "140px 40px 60px", overflow: "hidden",
      }}>
        {/* HERO_BG_PLACEHOLDER: Add background image or video here.
            For image: <img src="YOUR_HERO_IMAGE_URL" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,opacity:0.3}} />
            For video: <video autoPlay loop muted playsInline style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:0,opacity:0.3}} src="YOUR_VIDEO_URL" />
            Add dark overlay after: <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(10,10,10,0.6),rgba(10,10,10,0.95))",zIndex:0}} /> */}
        {/* Ambient gradient orbs — give glass something to refract */}
        <div style={{
          position: "absolute", top: "-150px", left: "50%", transform: "translateX(-50%)",
          width: "900px", height: "700px",
          background: "radial-gradient(ellipse at 40% 30%, rgba(100,130,200,0.12) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: "100px", right: "-100px",
          width: "500px", height: "500px",
          background: "radial-gradient(circle, rgba(150,120,200,0.08) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-100px", left: "-50px",
          width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(100,180,160,0.06) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />

        {/* Badge */}
        <div className="gp fi" style={{
          padding: "4px 5px 4px 4px", display: "inline-flex", alignItems: "center", gap: "8px",
          marginBottom: "32px", animationDelay: "0.1s", opacity: 0,
        }}>
          <span style={{ background: "#fff", color: "#0a0a0a", borderRadius: "9999px", padding: "2px 10px", fontSize: "11px", fontWeight: 600 }}>Beta</span>
          <span style={{ fontSize: "12px", fontWeight: 400, color: "rgba(255,255,255,0.7)", paddingRight: "6px", fontFamily: body }}>跨平台腕表市场情报</span>
        </div>

        {/* Heading — mixed EN/CN */}
        <h1 className="fi" style={{
          fontFamily: heading, fontStyle: "italic",
          fontSize: "clamp(48px, 7vw, 84px)", color: "#fff",
          textAlign: "center", lineHeight: 1,
          letterSpacing: "-2px", maxWidth: "700px", marginBottom: "20px",
          animationDelay: "0.3s", opacity: 0,
        }}>
          <span style={{ fontFamily: "'Noto Serif SC', serif", fontStyle: "normal", fontWeight: 700 }}>驭时见势</span>
          <br />
          <span style={{ fontFamily: "'Noto Serif SC', serif", fontStyle: "normal", fontWeight: 700 }}>洞见先机</span>
        </h1>

        {/* Subtext */}
        <p className="fi" style={{
          fontSize: "15px", fontWeight: 300, color: "rgba(255,255,255,0.5)",
          textAlign: "center", maxWidth: "480px", lineHeight: 1.8,
          marginBottom: "40px", animationDelay: "0.5s", opacity: 0,
          fontFamily: body,
        }}>
          聚合 Chrono24、Rakuten、Yahoo 拍卖、Starbuyer 超过 124,500 条在售信息。一站比价、追踪趋势、理性决策。
        </p>

        {/* Search */}
        <form className="fi" onSubmit={e => { e.preventDefault(); submitSearch(searchValue); }}
              style={{ width: "100%", maxWidth: "580px", animationDelay: "0.7s", opacity: 0 }}>
          <div className="sc" style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "6px 6px 6px 20px",
            borderRadius: "9999px",
          }}>
            <Search size={18} color="rgba(255,255,255,0.35)" />
            <input type="text" placeholder="输入品牌、型号或 Ref Number..."
              value={searchValue} onChange={e => setSearchValue(e.target.value)}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                fontSize: "14px", fontWeight: 300, color: "#fff", fontFamily: body,
              }}
            />
            <button type="submit" className="gs cb" style={{
              padding: "10px 22px", fontSize: "13px", fontWeight: 500,
              color: "#fff", cursor: "pointer", border: "none",
              display: "flex", alignItems: "center", gap: "6px", fontFamily: body,
            }}>搜索 <ArrowRight size={14} /></button>
          </div>

          {history.length > 0 && (
            <div style={{
              display: "flex", flexWrap: "wrap", gap: "6px",
              justifyContent: "center", marginTop: "16px",
              maxHeight: "62px", overflow: "hidden",
            }}>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", lineHeight: "24px", marginRight: "2px", fontFamily: body }}>搜索历史：</span>
              {history.map(term => {
                const hov = hoveredHistory === term;
                return (
                  <span key={term}
                    onMouseEnter={() => setHoveredHistory(term)}
                    onMouseLeave={() => setHoveredHistory(null)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 2,
                      padding: "3px 4px 3px 10px",
                      fontSize: "11px", fontWeight: 400,
                      color: hov ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.5)",
                      background: hov ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "9999px",
                      transition: "all 0.2s ease",
                      fontFamily: body,
                    }}>
                    <button type="button"
                      onClick={() => submitSearch(term)}
                      style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontSize: "inherit", fontFamily: "inherit", padding: 0 }}
                    >{truncate20(term)}</button>
                    <button type="button"
                      onClick={() => removeHistory(term)}
                      title="移除"
                      style={{
                        width: 16, height: 16,
                        display: hov ? "inline-flex" : "none",
                        alignItems: "center", justifyContent: "center",
                        background: "transparent", border: "none",
                        color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: 0,
                      }}><X size={10} /></button>
                  </span>
                );
              })}
            </div>
          )}
        </form>
      </section>

      {/* ═══ STATS ═══ */}
      <section style={{ padding: "0 40px 60px", position: "relative" }}>
        {/* Ambient glow */}
        <div style={{
          position: "absolute", top: "-80px", left: "20%",
          width: "600px", height: "300px",
          background: "radial-gradient(ellipse, rgba(80,120,200,0.07) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div className="gc" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
            {STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} style={{
                  padding: "32px 28px", textAlign: "center",
                  borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
                    <Icon size={14} color="rgba(255,255,255,0.3)" strokeWidth={1.5} />
                    <span style={{ fontSize: "11px", fontWeight: 400, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1.5px", fontFamily: body }}>{stat.label}</span>
                  </div>
                  <div style={{ fontFamily: heading, fontStyle: "italic", fontSize: "36px", color: "#fff", letterSpacing: "-1px" }}>
                    <AnimatedValue value={stat.value} delay={i * 150} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>


      {/* ═══ HOW IT WORKS ═══ */}
      <section style={{ padding: "60px 40px 80px", position: "relative" }}>
        {/* Ambient glow */}
        <div style={{
          position: "absolute", top: "0", right: "10%",
          width: "500px", height: "400px",
          background: "radial-gradient(ellipse, rgba(140,100,200,0.06) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ marginBottom: "48px" }}>
            <div className="gp" style={{ display: "inline-flex", padding: "4px 14px", fontSize: "11px", fontWeight: 500, color: "rgba(255,255,255,0.6)", marginBottom: "16px", letterSpacing: "1px", fontFamily: body }}>使用方式</div>
            <h2 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "clamp(32px, 4vw, 46px)", color: "#fff", letterSpacing: "-1px", lineHeight: 1.1, fontWeight: 700 }}>
              三步，看清全貌。
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            {[
              { step: "01", title: "搜索", desc: "输入任意品牌、型号或 Ref Number。同时查询四大平台的全部在售信息。", icon: Search },
              { step: "02", title: "比价", desc: "价格、成色、卖家、地区——所有 listings 并排呈现，最优选一目了然。", icon: Eye },
              { step: "03", title: "追踪", desc: "加入关注列表，设定目标价。价格变动或新上架时，即时提醒。", icon: TrendingUp },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="gc" style={{ padding: "36px 28px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                    <div className="gs" style={{ width: "40px", height: "40px", borderRadius: "9999px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={16} color="#fff" strokeWidth={1.5} />
                    </div>
                    <span style={{ fontFamily: heading, fontStyle: "italic", fontSize: "14px", color: "rgba(255,255,255,0.3)" }}>{item.step}</span>
                  </div>
                  <h3 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "26px", color: "#fff", fontWeight: 700, marginBottom: "10px" }}>{item.title}</h3>
                  <p style={{ fontSize: "13px", fontWeight: 300, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, fontFamily: body }}>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section style={{ padding: "80px 40px 40px", position: "relative" }}>
        <div style={{
          position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "600px", height: "400px",
          background: "radial-gradient(ellipse, rgba(120,140,180,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <h2 style={{
            fontFamily: "'Noto Serif SC', serif", fontSize: "clamp(36px, 5vw, 52px)", color: "#fff",
            fontWeight: 700, lineHeight: 1.15, marginBottom: "16px",
          }}>
            别再为溢价买单。<br />从这里开始。
          </h2>
          <p style={{ fontSize: "14px", fontWeight: 300, color: "rgba(255,255,255,0.45)", marginBottom: "32px", lineHeight: 1.8, fontFamily: body }}>
            加入数千名表友和经销商的行列，用 Raventik 找到对的表、对的价格。
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
            <button className="gs cb" style={{
              padding: "12px 28px", fontSize: "14px", fontWeight: 500, color: "#fff",
              cursor: "pointer", border: "none", display: "flex", alignItems: "center", gap: "6px", fontFamily: body,
            }}>获取早期访问 <ArrowUpRight size={15} /></button>
            <button className="cb" style={{
              padding: "12px 28px", fontSize: "14px", fontWeight: 500,
              color: "#0a0a0a", background: "#fff", borderRadius: "9999px",
              cursor: "pointer", border: "none", fontFamily: body,
            }}>查看演示</button>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding: "40px 40px 32px", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "40px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontFamily: heading, fontStyle: "italic", fontSize: "16px", color: "rgba(255,255,255,0.5)" }}>Raventik</span>
            <span style={{ fontSize: "11px", fontWeight: 300, color: "rgba(255,255,255,0.25)", fontFamily: body }}>© 2026 谕鸦科技 Ravacle Inc.</span>
          </div>
          <div style={{ display: "flex", gap: "20px" }}>
            {["隐私政策", "服务条款", "联系我们"].map((link, i) => (
              <a key={i} href="#" style={{ fontSize: "11px", fontWeight: 400, color: "rgba(255,255,255,0.3)", textDecoration: "none", transition: "color 0.2s", fontFamily: body }}
              onMouseEnter={e => e.target.style.color = "rgba(255,255,255,0.7)"}
              onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.3)"}
              >{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
