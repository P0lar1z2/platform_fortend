/**
 * ============================================================
 * Raventik — Configuration Page (配置表)
 * ============================================================
 * 
 * Route: /settings
 * 
 * STRUCTURE:
 *   1. Platform Cards — per-platform fee configs (expandable)
 *   2. Global Settings — grouped by business domain
 *      - 税务与汇率 (always visible)
 *      - 物流与保险 (always visible)
 *      - 决策阈值 + 询价范围 (always visible)
 *      - 估价模型 (collapsed "高级设置")
 *      - 附件与保修 + 年衰减 (collapsed "高级设置")
 * 
 * ENGINEER NOTES:
 *   - API: GET /api/config → loads all current values
 *   - API: PUT /api/config → saves changed values
 *   - All percentages: user sees "5", system stores 0.05
 *   - All amounts: user sees "3,000,000", system stores 3000000
 *   - Platform configs: GET/PUT /api/config/platforms/:key
 * ============================================================
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, Search, ChevronRight, ChevronDown, Save, Plus, Info, Bookmark } from "lucide-react";
import { fetchConfig, updateConfig as apiUpdateConfig } from "../api/config";
import { useToast } from "../components/Toast";

// ─── MOCK: Platform configs ──────────────────────────────
// API: GET /api/config/platforms
const INITIAL_PLATFORMS = [
  { key: "starbuyer", name: "StarBuyer", type: "成交价平台", buyer_fee: "5", buyer_fee_promo: "3", seller_fee: "3.3", seller_tax: "0" },
  { key: "ecoauc", name: "EcoAuc", type: "成交价平台", buyer_fee: "5", buyer_fee_promo: "", seller_fee: "2.8", seller_tax: "0" },
];

// ─── MOCK: Global configs ────────────────────────────────
// API: GET /api/config
const INITIAL_CONFIG = {
  // 税务与汇率
  tax_rate: "10", fx_rate: "1.0000",
  // 物流与保险
  domestic_ship_threshold: "3000000", domestic_ship_high: "1000", domestic_ship_low: "500",
  intl_shipping: "0", insurance_rate: "0.3",
  // 决策阈值
  target_margin: "5", alert_margin: "10",
  // 询价范围
  sourcing_upper_pct: "30", sourcing_lower_pct: "20",
  // 估价模型
  l1_window: "30", l2_window: "90", l2_weight: "95",
  rank_up_coef: "5", hard_defect_coef: "70", min_sample_count: "3", outlier_trim_pct: "5",
  // 附件与保修
  full_set_premium: "50000", warranty_jp_premium: "2", warranty_overseas_premium: "0",
  // 保修年衰减
  recent_years: "15", recent_decay_rate: "0.5", old_threshold: "15", old_decay_rate: "3",
};

// ─── Field Component ─────────────────────────────────────
function ConfigField({ label, value, onChange, suffix = "", prefix = "", placeholder = "", readOnly = false, hint = "", tooltip = "" }) {
  const bd = "'Barlow','Noto Sans SC',sans-serif";
  const [showTip, setShowTip] = useState(false);
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "12px", fontWeight: 400, color: "rgba(255,255,255,0.5)", fontFamily: bd }}>{label}</span>
          {tooltip && (
            <div style={{ position: "relative", display: "inline-flex" }}
              onMouseEnter={() => setShowTip(true)}
              onMouseLeave={() => setShowTip(false)}
            >
              <Info size={12} color="rgba(255,255,255,0.2)" style={{ cursor: "help" }} />
              {showTip && (
                <div style={{
                  position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
                  width: "220px", padding: "10px 12px", borderRadius: "10px",
                  background: "rgba(30,30,30,0.95)", border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  fontSize: "11px", fontWeight: 300, color: "rgba(255,255,255,0.6)", fontFamily: bd,
                  lineHeight: 1.5, zIndex: 10, pointerEvents: "none",
                }}>
                  {tooltip}
                  <div style={{
                    position: "absolute", bottom: "-4px", left: "50%", transform: "translateX(-50%) rotate(45deg)",
                    width: "8px", height: "8px", background: "rgba(30,30,30,0.95)",
                    borderRight: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)",
                  }} />
                </div>
              )}
            </div>
          )}
        </div>
        {hint && <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)", fontFamily: bd }}>{hint}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {prefix && <span style={{ fontSize: "13px", fontWeight: 400, color: "rgba(255,255,255,0.3)", fontFamily: bd, flexShrink: 0 }}>{prefix}</span>}
        {readOnly ? (
          <div style={{
            flex: 1, padding: "8px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: 500,
            background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.35)", fontFamily: bd,
            border: "1px solid rgba(255,255,255,0.04)",
          }}>{value}</div>
        ) : (
          <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            style={{
              flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px", padding: "8px 12px", fontSize: "13px", fontWeight: 500,
              color: "#fff", fontFamily: bd, outline: "none", transition: "border-color 0.2s",
            }}
            onFocus={e => e.target.style.borderColor = "rgba(255,255,255,0.2)"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
          />
        )}
        {suffix && <span style={{ fontSize: "13px", fontWeight: 400, color: "rgba(255,255,255,0.3)", fontFamily: bd, flexShrink: 0 }}>{suffix}</span>}
      </div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────
export default function ConfigPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [platforms, setPlatforms] = useState<any[]>(INITIAL_PLATFORMS);
  const [config, setConfig] = useState<Record<string, any>>(INITIAL_CONFIG);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const hd = "'Instrument Serif','Noto Serif SC',serif";
  const bd = "'Barlow','Noto Sans SC',sans-serif";

  // Phase 11.F.3 —— 加载远端 config 覆盖本地初始
  useEffect(() => {
    setLoading(true);
    fetchConfig()
      .then(doc => { setPlatforms(doc.sources); setConfig(doc.global); })
      .catch(() => toast.push("配置加载失败，用本地默认", "warning"))
      .finally(() => setLoading(false));
  }, []);

  const updateConfig = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const updatePlatform = (idx: number, field: string, value: any) => {
    setPlatforms(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiUpdateConfig({ sources: platforms, global: config });
      setSaved(true);
      toast.push("配置已保存", "success");
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.push("保存失败，请重试", "error");
    } finally {
      setSaving(false);
    }
  };

  void loading; void saving;

  const SOURCE_COLORS = { starbuyer: "#34d399", ecoauc: "#60a5fa", yahoo: "#fbbf24", rakuten: "#f472b6", ebay: "#a78bfa" };

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
        .sc{transition:all 0.4s cubic-bezier(0.16,1,0.3,1);background:rgba(255,255,255,0.05);background-blend-mode:luminosity;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:none;box-shadow:inset 0 1px 1px rgba(255,255,255,0.1);position:relative;overflow:hidden}
        .sc::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1px;background:linear-gradient(180deg,rgba(255,255,255,0.25) 0%,rgba(255,255,255,0.08) 30%,rgba(255,255,255,0) 50%,rgba(255,255,255,0.08) 70%,rgba(255,255,255,0.25) 100%);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
        .sc:focus-within{box-shadow:inset 0 1px 1px rgba(255,255,255,0.15),0 0 0 1px rgba(255,255,255,0.15),0 8px 40px rgba(0,0,0,0.3)}
        ::selection{background:rgba(255,255,255,0.2);color:#fff}
      `}</style>

      {/* ═══ NAV ═══ */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:50,padding:"12px 40px",background:"rgba(10,10,10,0.6)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{maxWidth:"1280px",margin:"0 auto",display:"flex",alignItems:"center",gap:"20px"}}>
          <Link to="/" style={{display:"flex",alignItems:"center",gap:"10px",flexShrink:0}}>
            <img src="/logo/raventik_logo_nav_32.png" width={32} height={32}
                 style={{borderRadius:"8px",objectFit:"contain"}} alt="Raventik"/>
            <span style={{fontFamily:hd,fontStyle:"italic",fontSize:"20px",color:"#fff",letterSpacing:"-0.5px"}}>Raventik</span>
          </Link>
          <form className="sc"
                onSubmit={e => { e.preventDefault(); const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value.trim(); if (q) navigate(`/search?q=${encodeURIComponent(q)}`); }}
                style={{flex:1,maxWidth:"560px",display:"flex",alignItems:"center",gap:"8px",padding:"4px 4px 4px 16px",borderRadius:"9999px"}}>
            <Search size={16} color="rgba(255,255,255,0.35)"/>
            <input name="q" type="text" placeholder="搜索品牌、型号或 Ref Number..." style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:"13px",fontWeight:300,color:"#fff",fontFamily:bd}}/>
            <button type="submit" className="gs" style={{padding:"7px 16px",fontSize:"12px",fontWeight:500,color:"#fff",cursor:"pointer",border:"none",fontFamily:bd}}>搜索</button>
          </form>
          <div style={{display:"flex",alignItems:"center",gap:"4px",flexShrink:0}}>
            {[
              { to: "/", label: "首页" },
              { to: "/brands", label: "品牌列表" },
              { to: "/config", label: "配置表" },
              { to: "/watchlist", label: "关注列表" },
            ].map(item => {
              const active = item.to === "/config";
              return (
                <Link key={item.to} to={item.to} style={{padding:"6px 12px",fontSize:"12px",fontWeight:400,color:active?"#fff":"rgba(255,255,255,0.6)",textDecoration:"none",borderRadius:"9999px",background:active?"rgba(255,255,255,0.08)":"transparent",fontFamily:bd}}>{item.label}</Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Ambient */}
      <div style={{position:"fixed",top:0,left:"10%",width:"600px",height:"500px",background:"radial-gradient(ellipse,rgba(80,120,200,0.06) 0%,transparent 60%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",bottom:"10%",right:"0",width:"500px",height:"400px",background:"radial-gradient(ellipse,rgba(140,100,200,0.04) 0%,transparent 60%)",pointerEvents:"none",zIndex:0}}/>

      <main style={{maxWidth:"960px",margin:"0 auto",padding:"100px 40px 60px",position:"relative",zIndex:1}}>

        {/* Header + Save */}
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:"36px"}}>
          <div>
            <div className="gp" style={{display:"inline-flex",padding:"4px 14px",fontSize:"11px",fontWeight:500,color:"rgba(255,255,255,0.6)",marginBottom:"14px",letterSpacing:"1px",fontFamily:bd}}>配置表</div>
            <h1 style={{fontFamily:"'Noto Serif SC',serif",fontSize:"32px",color:"#fff",letterSpacing:"-1px",lineHeight:1.1,fontWeight:700}}>系统配置</h1>
            <p style={{fontSize:"13px",fontWeight:300,color:"rgba(255,255,255,0.4)",marginTop:"8px",fontFamily:bd}}>管理平台费率、估价参数和交易决策阈值。</p>
          </div>
          {/* Save button — API: PUT /api/config */}
          <button onClick={handleSave} style={{
            display:"flex",alignItems:"center",gap:"6px",padding:"10px 24px",
            borderRadius:"9999px",border:"none",cursor:"pointer",
            background:saved?"rgba(34,197,94,0.15)":"rgba(255,255,255,0.08)",
            color:saved?"#22c55e":"#fff",
            fontSize:"13px",fontWeight:600,fontFamily:bd,transition:"all 0.3s ease",
            boxShadow:saved?"inset 0 0 0 1px rgba(34,197,94,0.25)":"inset 0 1px 1px rgba(255,255,255,0.1)",
          }}>
            <Save size={15}/> {saved?"已保存":"保存配置"}
          </button>
        </div>

        {/* ═══ PLATFORM CARDS ═══ */}
        <section style={{marginBottom:"40px"}}>
          <h2 style={{fontSize:"16px",fontWeight:600,color:"rgba(255,255,255,0.7)",fontFamily:bd,marginBottom:"16px",display:"flex",alignItems:"center",gap:"8px"}}>
            平台配置
            <span style={{fontSize:"11px",fontWeight:300,color:"rgba(255,255,255,0.3)",fontFamily:bd}}>每个平台独立维护费率参数</span>
          </h2>

          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"16px"}}>
            {platforms.map((p, idx) => {
              return (
                <div key={p.key} className="gc" style={{padding:"24px",borderRadius:"18px"}}>
                  {/* Platform header */}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                      <div style={{width:"8px",height:"8px",borderRadius:"50%",background:SOURCE_COLORS[p.key]||"#888"}}/>
                      <span style={{fontSize:"15px",fontWeight:600,color:"#fff",fontFamily:bd}}>{p.name}</span>
                    </div>
                  </div>

                  <ConfigField label="买家佣金" value={p.buyer_fee} onChange={v=>updatePlatform(idx,"buyer_fee",v)} suffix="%" />
                  <ConfigField label="促销佣金" value={p.buyer_fee_promo} onChange={v=>updatePlatform(idx,"buyer_fee_promo",v)} suffix="%" placeholder="无活动" hint="可选" />
                  <ConfigField label="卖家费率" value={p.seller_fee} onChange={v=>updatePlatform(idx,"seller_fee",v)} suffix="%" />
                  <ConfigField label="卖家税率" value={p.seller_tax} onChange={v=>updatePlatform(idx,"seller_tax",v)} suffix="%" />
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══ GLOBAL SETTINGS ═══ */}
        <section>
          <h2 style={{fontSize:"16px",fontWeight:600,color:"rgba(255,255,255,0.7)",fontFamily:bd,marginBottom:"16px",display:"flex",alignItems:"center",gap:"8px"}}>
            全局配置
          </h2>

          {/* Row 1: 税务汇率 + 物流保险 */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginBottom:"16px"}}>
            {/* 税务与汇率 */}
            <div className="gc" style={{padding:"24px",borderRadius:"18px"}}>
              <div style={{fontSize:"13px",fontWeight:500,color:"rgba(255,255,255,0.5)",fontFamily:bd,marginBottom:"16px"}}>税务与汇率</div>
              <ConfigField label="消费税率" value={config.tax_rate} onChange={v=>updateConfig("tax_rate",v)} suffix="%" hint="系统内部转为系数" />
              <ConfigField label="汇率 (JPY 基准)" value={config.fx_rate} onChange={v=>updateConfig("fx_rate",v)} hint="非 JPY 交易时使用" />
            </div>

            {/* 物流与保险 */}
            <div className="gc" style={{padding:"24px",borderRadius:"18px"}}>
              <div style={{fontSize:"13px",fontWeight:500,color:"rgba(255,255,255,0.5)",fontFamily:bd,marginBottom:"16px"}}>物流与保险</div>
              <ConfigField label="国内运费阈值" value={config.domestic_ship_threshold} onChange={v=>updateConfig("domestic_ship_threshold",v)} prefix="¥" hint="高于此价用高运费" />
              <ConfigField label="国内运费（高）" value={config.domestic_ship_high} onChange={v=>updateConfig("domestic_ship_high",v)} prefix="¥" />
              <ConfigField label="国内运费（低）" value={config.domestic_ship_low} onChange={v=>updateConfig("domestic_ship_low",v)} prefix="¥" />
              <ConfigField label="国际物流" value={config.intl_shipping} onChange={v=>updateConfig("intl_shipping",v)} prefix="¥" hint="固定值或 DHL 覆盖" />
              <ConfigField label="保险费率" value={config.insurance_rate} onChange={v=>updateConfig("insurance_rate",v)} suffix="%" hint="按买入价计算" />
            </div>
          </div>

          {/* Row 2: 决策阈值 + 询价范围 */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginBottom:"16px"}}>
            {/* 决策阈值 */}
            <div className="gc" style={{padding:"24px",borderRadius:"18px"}}>
              <div style={{fontSize:"13px",fontWeight:500,color:"rgba(255,255,255,0.5)",fontFamily:bd,marginBottom:"4px"}}>决策阈值</div>
              <div style={{fontSize:"11px",fontWeight:300,color:"rgba(255,255,255,0.25)",fontFamily:bd,marginBottom:"16px"}}>控制估值结果的决策信号</div>
              <ConfigField label="目标利润率 → 值得关注" value={config.target_margin} onChange={v=>updateConfig("target_margin",v)} suffix="%" />
              <ConfigField label="Alert 利润率 → 强烈推荐" value={config.alert_margin} onChange={v=>updateConfig("alert_margin",v)} suffix="%" />
            </div>

            {/* 询价范围 */}
            <div className="gc" style={{padding:"24px",borderRadius:"18px"}}>
              <div style={{fontSize:"13px",fontWeight:500,color:"rgba(255,255,255,0.5)",fontFamily:bd,marginBottom:"4px"}}>询价范围</div>
              <div style={{fontSize:"11px",fontWeight:300,color:"rgba(255,255,255,0.25)",fontFamily:bd,marginBottom:"16px"}}>关注列表每日监控的价格浮动区间</div>
              <ConfigField label="询价上浮比例" value={config.sourcing_upper_pct} onChange={v=>updateConfig("sourcing_upper_pct",v)} suffix="%" hint="高于预计买入价" />
              <ConfigField label="询价下浮比例" value={config.sourcing_lower_pct} onChange={v=>updateConfig("sourcing_lower_pct",v)} suffix="%" hint="低于预计买入价" />
            </div>
          </div>

          {/* Advanced Settings — collapsed by default */}
          <div className="gc" style={{borderRadius:"18px",overflow:"hidden"}}>
            <button onClick={()=>setShowAdvanced(!showAdvanced)} style={{
              width:"100%",padding:"20px 24px",background:"none",border:"none",cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"space-between",
              transition:"background 0.2s",
            }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}
            onMouseLeave={e=>e.currentTarget.style.background="none"}
            >
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={{fontSize:"13px",fontWeight:500,color:"rgba(255,255,255,0.5)",fontFamily:bd}}>高级设置</span>
                <span style={{fontSize:"11px",fontWeight:300,color:"rgba(255,255,255,0.25)",fontFamily:bd}}>估价模型参数、附件溢价、保修衰减</span>
              </div>
              {showAdvanced
                ? <ChevronDown size={16} color="rgba(255,255,255,0.3)"/>
                : <ChevronRight size={16} color="rgba(255,255,255,0.3)"/>
              }
            </button>

            {showAdvanced && (
              <div style={{padding:"0 24px 24px"}}>
                {/* Divider */}
                <div style={{height:"1px",background:"rgba(255,255,255,0.04)",marginBottom:"20px"}}/>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"24px"}}>
                  {/* Left: 估价模型 */}
                  <div>
                    <div style={{fontSize:"12px",fontWeight:500,color:"rgba(255,255,255,0.4)",fontFamily:bd,marginBottom:"16px",textTransform:"uppercase",letterSpacing:"1px"}}>估价模型</div>
                    <ConfigField label="L1 时间窗口" value={config.l1_window} onChange={v=>updateConfig("l1_window",v)} suffix="天" tooltip="精准估价的数据范围。30天内同型号、同成色、同附件的成交记录直接取均价。" />
                    <ConfigField label="L2 时间窗口" value={config.l2_window} onChange={v=>updateConfig("l2_window",v)} suffix="天" tooltip="近期参考的数据范围。L1 未命中时回退到此窗口，均价乘以时间权重折扣。" />
                    <ConfigField label="L2 时间权重" value={config.l2_weight} onChange={v=>updateConfig("l2_weight",v)} suffix="%" tooltip="L2 窗口数据的折扣系数。例如 95% 表示 90 天数据的均价打 95 折作为估价。" />
                    <ConfigField label="成色提升系数" value={config.rank_up_coef} onChange={v=>updateConfig("rank_up_coef",v)} suffix="%" tooltip="L3 成色推导时，从相邻低成色推算高成色的上浮比例。例如 B 成色均价 × 1.05 = A 成色估价。" />
                    <ConfigField label="硬伤系数" value={config.hard_defect_coef} onChange={v=>updateConfig("hard_defect_coef",v)} suffix="% 保留" tooltip="不可修复瑕疵（氧化、生锈、机芯故障）的估价保留比例。70% 表示估价为正常价的 7 折。" />
                    <ConfigField label="最小样本数" value={config.min_sample_count} onChange={v=>updateConfig("min_sample_count",v)} suffix="条" tooltip="每级估价（L1-L4）至少需要的有效成交记录数。低于此值则跳到下一级。" />
                    <ConfigField label="异常值修剪" value={config.outlier_trim_pct} onChange={v=>updateConfig("outlier_trim_pct",v)} suffix="%" tooltip="计算均价前去除最高和最低各 N% 的异常成交价，避免极端值干扰估价。" />
                  </div>

                  {/* Right: 附件保修 + 年衰减 */}
                  <div>
                    <div style={{fontSize:"12px",fontWeight:500,color:"rgba(255,255,255,0.4)",fontFamily:bd,marginBottom:"16px",textTransform:"uppercase",letterSpacing:"1px"}}>附件与保修</div>
                    <ConfigField label="全套溢价" value={config.full_set_premium} onChange={v=>updateConfig("full_set_premium",v)} prefix="¥" tooltip="L4 附件推导时，单表价格加上此固定溢价得到全套估价。" />
                    <ConfigField label="日本保修溢价" value={config.warranty_jp_premium} onChange={v=>updateConfig("warranty_jp_premium",v)} suffix="%" tooltip="日本保修卡相对海外保修的溢价系数。例如 2% 表示日保比外保贵 2%。" />
                    <ConfigField label="海外保修溢价" value={config.warranty_overseas_premium} onChange={v=>updateConfig("warranty_overseas_premium",v)} suffix="%" tooltip="海外保修作为基准线，通常为 0%。所有保修溢价相对此基准计算。" />

                    <div style={{height:"1px",background:"rgba(255,255,255,0.04)",margin:"16px 0"}}/>
                    <div style={{fontSize:"12px",fontWeight:500,color:"rgba(255,255,255,0.4)",fontFamily:bd,marginBottom:"16px",textTransform:"uppercase",letterSpacing:"1px"}}>保修年衰减</div>
                    <ConfigField label="近期年限" value={config.recent_years} onChange={v=>updateConfig("recent_years",v)} suffix="年" tooltip="保修卡在此年限内，每年按近期衰减率递减保修溢价。" />
                    <ConfigField label="近期衰减率" value={config.recent_decay_rate} onChange={v=>updateConfig("recent_decay_rate",v)} suffix="% / 年" tooltip="近期年限内每年保修溢价的递减幅度。" />
                    <ConfigField label="老旧阈值" value={config.old_threshold} onChange={v=>updateConfig("old_threshold",v)} suffix="年" tooltip="超过此年限的保修卡改为按老旧衰减率计算，每 5 年递减一次。" />
                    <ConfigField label="老旧衰减率" value={config.old_decay_rate} onChange={v=>updateConfig("old_decay_rate",v)} suffix="% / 5年" tooltip="保修卡超过老旧阈值后，每 5 年递减的幅度。" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer style={{padding:"32px 40px 24px",borderTop:"1px solid rgba(255,255,255,0.06)",marginTop:"40px"}}>
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
