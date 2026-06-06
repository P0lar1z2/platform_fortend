import { useCallback, useEffect, useState } from "react";
import { Bell, Copy, MessageCircle, PauseCircle, PlayCircle, Plus, RefreshCw, Trash2, Unlink } from "lucide-react";
import { useToast } from "../components/Toast";
import AppHeader from "../components/AppHeader";
import {
  createLarkBindCode,
  deleteLarkBinding,
  deleteRefSubscription,
  deleteSellerSubscription,
  getLarkBindingStatus,
  listGoofishItems,
  listGoofishOpportunities,
  listRefSubscriptions,
  listSellerSubscriptions,
  setRefSubscriptionEnabled,
  setSellerSubscriptionEnabled,
  triggerRefSubscription,
  triggerSellerSubscription,
  upsertRefSubscription,
  upsertSellerSubscription,
} from "../api/goofish";
import type {
  GoofishItem,
  GoofishOpportunity,
  GoofishRefSubscription,
  GoofishSellerSubscription,
  LarkBindCode,
  LarkBindingStatus,
} from "../api/types";

type DateLike = string | number | { $date?: string | number | { $numberLong?: string } } | null | undefined;

function normalizeDateValue(value: DateLike): string | number | null {
  if (!value) return null;
  if (typeof value === "string" || typeof value === "number") return value;
  const bsonDate = value.$date;
  if (typeof bsonDate === "string" || typeof bsonDate === "number") return bsonDate;
  if (bsonDate?.$numberLong) return Number(bsonDate.$numberLong);
  return null;
}

function fmt(value?: DateLike) {
  const normalized = normalizeDateValue(value);
  if (normalized === null) return "-";
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("zh-CN");
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy copy path below.
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

function Status({ enabled }: { enabled: boolean }) {
  return (
    <span className={enabled ? "status on" : "status off"}>
      {enabled ? "启用" : "暂停"}
    </span>
  );
}

function decisionLabel(decision?: string | null): string {
  switch (decision) {
    case "buy": return "买入机会";
    case "alert": return "关注机会";
    case "skip": return "跳过";
    case "insufficient_data": return "数据不足";
    case "pending": return "待评估";
    default: return decision || "-";
  }
}

function decisionClass(decision?: string | null): string {
  switch (decision) {
    case "buy": return "buy";
    case "alert": return "alert";
    case "skip": return "skip";
    case "insufficient_data": return "insufficient";
    case "pending": return "pending";
    default: return "unknown";
  }
}

export default function GoofishSubscriptions() {
  const { push } = useToast();
  const [sellers, setSellers] = useState<GoofishSellerSubscription[]>([]);
  const [refs, setRefs] = useState<GoofishRefSubscription[]>([]);
  const [items, setItems] = useState<GoofishItem[]>([]);
  const [opportunities, setOpportunities] = useState<GoofishOpportunity[]>([]);
  const [larkBinding, setLarkBinding] = useState<LarkBindingStatus | null>(null);
  const [bindCode, setBindCode] = useState<LarkBindCode | null>(null);
  const [sellerForm, setSellerForm] = useState({ seller_id: "", seller_name: "", interval: "60", note: "" });
  const [refForm, setRefForm] = useState({ reference: "", brand: "", keyword: "", interval: "60", note: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sellerData, refData, itemData, opportunityData] = await Promise.all([
        listSellerSubscriptions(),
        listRefSubscriptions(),
        listGoofishItems(),
        listGoofishOpportunities(),
      ]);
      const larkData = await getLarkBindingStatus().catch(() => null);
      setSellers(sellerData);
      setRefs(refData);
      setItems(itemData);
      setOpportunities(opportunityData);
      setLarkBinding(larkData);
    } catch (e: any) {
      push(e?.response?.data?.error || "加载闲鱼订阅失败", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => { load(); }, [load]);

  async function generateBindCode() {
    setBusy("lark:bind-code");
    try {
      const code = await createLarkBindCode();
      setBindCode(code);
      push("Lark 绑定码已生成", "success");
    } catch (e: any) {
      push(e?.response?.data?.error || e?.message || "生成 Lark 绑定码失败", "error");
    } finally {
      setBusy(null);
    }
  }

  async function copyBindCode() {
    if (!bindCode?.code) return;
    if (await copyText(bindCode.code)) {
      push("绑定码已复制", "success");
    } else {
      push("复制失败，请手动选择绑定码", "warning");
    }
  }

  async function unlinkLark() {
    setBusy("lark:unlink");
    try {
      await deleteLarkBinding();
      setBindCode(null);
      await load();
      push("Lark 绑定已解除", "success");
    } catch (e: any) {
      push(e?.response?.data?.error || e?.message || "解除 Lark 绑定失败", "error");
    } finally {
      setBusy(null);
    }
  }

  async function addSeller() {
    const sellerId = sellerForm.seller_id.trim();
    if (!sellerId) { push("请输入商家 ID", "warning"); return; }
    setBusy("seller:add");
    try {
      await upsertSellerSubscription({
        seller_id: sellerId,
        seller_name: sellerForm.seller_name.trim() || undefined,
        note: sellerForm.note.trim() || undefined,
        crawl_interval_minutes: Number(sellerForm.interval) || 60,
      });
      setSellerForm({ seller_id: "", seller_name: "", interval: "60", note: "" });
      push("商家订阅已保存", "success");
      load();
    } catch (e: any) {
      push(e?.response?.data?.error || "保存商家订阅失败", "error");
    } finally {
      setBusy(null);
    }
  }

  async function addRef() {
    const reference = refForm.reference.trim();
    if (!reference) { push("请输入 ref", "warning"); return; }
    setBusy("ref:add");
    try {
      await upsertRefSubscription({
        reference,
        brand: refForm.brand.trim() || undefined,
        keyword: refForm.keyword.trim() || undefined,
        note: refForm.note.trim() || undefined,
        crawl_interval_minutes: Number(refForm.interval) || 60,
      });
      setRefForm({ reference: "", brand: "", keyword: "", interval: "60", note: "" });
      push("ref 订阅已保存", "success");
      load();
    } catch (e: any) {
      push(e?.response?.data?.error || "保存 ref 订阅失败", "error");
    } finally {
      setBusy(null);
    }
  }

  async function toggleSeller(sub: GoofishSellerSubscription) {
    setBusy(`seller:${sub.seller_id}`);
    try {
      await setSellerSubscriptionEnabled(sub.seller_id, !sub.enabled);
      load();
    } catch (e: any) {
      push(e?.response?.data?.error || "更新商家订阅失败", "error");
    } finally {
      setBusy(null);
    }
  }

  async function triggerSeller(sub: GoofishSellerSubscription) {
    setBusy(`seller-trigger:${sub.seller_id}`);
    try {
      const res = await triggerSellerSubscription(sub.seller_id);
      push(`已提交商家抓取：${res.request_id}`, "success");
      load();
    } catch (e: any) {
      push(e?.response?.data?.error || "触发商家抓取失败", "error");
    } finally {
      setBusy(null);
    }
  }

  async function toggleRef(sub: GoofishRefSubscription) {
    setBusy(`ref:${sub.reference}`);
    try {
      await setRefSubscriptionEnabled(sub.reference, !sub.enabled);
      load();
    } catch (e: any) {
      push(e?.response?.data?.error || "更新 ref 订阅失败", "error");
    } finally {
      setBusy(null);
    }
  }

  async function triggerRef(sub: GoofishRefSubscription) {
    setBusy(`ref-trigger:${sub.reference}`);
    try {
      const res = await triggerRefSubscription(sub.reference);
      push(`已提交闲鱼搜索：${res.keyword || sub.keyword}`, "success");
      load();
    } catch (e: any) {
      push(e?.response?.data?.error || "触发 ref 搜索失败", "error");
    } finally {
      setBusy(null);
    }
  }

  async function removeSeller(sellerId: string) {
    setBusy(`seller:${sellerId}`);
    try {
      await deleteSellerSubscription(sellerId);
      load();
    } catch (e: any) {
      push(e?.response?.data?.error || "删除商家订阅失败", "error");
    } finally {
      setBusy(null);
    }
  }

  async function removeRef(reference: string) {
    setBusy(`ref:${reference}`);
    try {
      await deleteRefSubscription(reference);
      load();
    } catch (e: any) {
      push(e?.response?.data?.error || "删除 ref 订阅失败", "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="gf-page">
      <style>{`
        .gf-page{min-height:100vh;background:#090909;color:#fff;font-family:'Barlow','Noto Sans SC',sans-serif}
        .gf-main{max-width:1180px;margin:0 auto;padding:96px 40px 56px}
        .gf-top{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:24px}
        .gf-title h1{font-size:32px;font-weight:500;margin:0 0 8px}
        .gf-title p{margin:0;color:rgba(255,255,255,.55);font-size:13px}
        .gf-action{display:inline-flex;align-items:center;gap:7px;height:36px;padding:0 14px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.07);color:#fff;cursor:pointer}
        .gf-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
        .lark-panel{display:grid;grid-template-columns:1fr auto;align-items:center;gap:14px;margin-bottom:18px;padding:14px 16px;border:1px solid rgba(255,255,255,.08);border-radius:8px;background:rgba(255,255,255,.035)}
        .lark-meta{display:flex;align-items:center;gap:10px;min-width:0}
        .lark-icon{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:8px;background:rgba(147,197,253,.14);color:#bfdbfe}
        .code-box{display:flex;align-items:center;gap:8px;min-width:0;margin-top:8px}
        .code-text{display:block;max-width:420px;padding:7px 9px;border-radius:8px;background:rgba(0,0,0,.24);border:1px solid rgba(255,255,255,.08);font-family:'JetBrains Mono','SFMono-Regular',monospace;font-size:12px;color:#e5e7eb;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .panel{border:1px solid rgba(255,255,255,.08);border-radius:8px;background:rgba(255,255,255,.035);overflow:hidden}
        .panel-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.07)}
        .panel-head h2{font-size:15px;font-weight:600;margin:0}
        .form{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.07)}
        .form input{height:36px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.18);color:#fff;padding:0 11px;outline:none}
        .form .wide{grid-column:1 / -1}
        .primary{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:36px;border:0;border-radius:8px;background:#fff;color:#090909;font-weight:700;cursor:pointer}
        .rows{display:flex;flex-direction:column}
        .row{display:grid;grid-template-columns:1.3fr .7fr .75fr .7fr;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.055);font-size:13px}
        .row:last-child{border-bottom:0}
        .muted{color:rgba(255,255,255,.5)}
        .status{display:inline-flex;align-items:center;justify-content:center;height:24px;width:44px;border-radius:999px;font-size:12px}
        .status.on{background:rgba(16,185,129,.16);color:#34d399}
        .status.off{background:rgba(245,158,11,.16);color:#fbbf24}
        .icon-actions{display:flex;justify-content:flex-end;gap:8px}
        .icon-btn{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);color:rgba(255,255,255,.72);cursor:pointer}
        .section{margin-top:18px}
        .item-row{display:grid;grid-template-columns:72px 1fr 110px 120px;gap:12px;align-items:center;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.055);font-size:13px}
        .opportunity-row{grid-template-columns:96px minmax(0,1fr) 86px 132px}
        .item-main{min-width:0}
        .item-main .link{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .decision-badge{display:inline-flex;align-items:center;justify-content:center;width:72px;height:24px;border-radius:999px;font-size:12px;font-weight:600}
        .decision-badge.buy{background:rgba(16,185,129,.16);color:#34d399}
        .decision-badge.alert{background:rgba(245,158,11,.16);color:#fbbf24}
        .decision-badge.skip{background:rgba(148,163,184,.12);color:#94a3b8}
        .decision-badge.insufficient{background:rgba(96,165,250,.14);color:#93c5fd}
        .decision-badge.pending,.decision-badge.unknown{background:rgba(255,255,255,.08);color:rgba(255,255,255,.62)}
        .thumb{width:56px;height:56px;border-radius:8px;object-fit:cover;background:rgba(255,255,255,.06)}
        .link{color:#93c5fd;text-decoration:none}
        @media (max-width:900px){.gf-grid,.lark-panel{grid-template-columns:1fr}.row,.item-row{grid-template-columns:1fr}.icon-actions{justify-content:flex-start}.form{grid-template-columns:1fr}.code-text{max-width:100%}}
      `}</style>

      <AppHeader />

      <main className="gf-main">
        <div className="gf-top">
          <div className="gf-title">
            <h1>闲鱼订阅</h1>
            <p>商家订阅走商家主页抓取，ref 订阅走搜索抓取；monitor 查到新商品后会发 Lark 通知。</p>
          </div>
          <button className="gf-action" onClick={load} disabled={loading}><RefreshCw size={15} /> 刷新</button>
        </div>

        <section className="lark-panel">
          <div className="lark-meta">
            <span className="lark-icon"><MessageCircle size={18} /></span>
            <div>
              <div>Lark 私聊通知 <Status enabled={Boolean(larkBinding?.bound)} /></div>
              <div className="muted">
                {larkBinding?.bound
                  ? `已绑定 open_id *${larkBinding.open_id_suffix || "-"} · ${fmt(larkBinding.updated_at)}`
                  : "未绑定，生成绑定码后私发给机器人"}
              </div>
              {bindCode ? (
                <div className="code-box">
                  <span className="code-text">{bindCode.code}</span>
                  <button className="icon-btn" onClick={copyBindCode} title="复制绑定码"><Copy size={16} /></button>
                  <span className="muted">有效期至 {fmt(bindCode.expires_at)}</span>
                </div>
              ) : null}
            </div>
          </div>
          <div className="icon-actions">
            <button className="gf-action" onClick={generateBindCode} disabled={busy === "lark:bind-code"}><Plus size={15} /> 绑定码</button>
            <button className="icon-btn" onClick={unlinkLark} disabled={!larkBinding?.bound || busy === "lark:unlink"} title="解除绑定"><Unlink size={16} /></button>
          </div>
        </section>

        <div className="gf-grid">
          <section className="panel">
            <div className="panel-head"><h2>商家订阅</h2><Bell size={16} /></div>
            <div className="form">
              <input value={sellerForm.seller_id} onChange={e => setSellerForm(v => ({ ...v, seller_id: e.target.value }))} placeholder="商家 ID / user_id" />
              <input value={sellerForm.seller_name} onChange={e => setSellerForm(v => ({ ...v, seller_name: e.target.value }))} placeholder="商家名称" />
              <input value={sellerForm.interval} onChange={e => setSellerForm(v => ({ ...v, interval: e.target.value }))} placeholder="间隔分钟" />
              <input value={sellerForm.note} onChange={e => setSellerForm(v => ({ ...v, note: e.target.value }))} placeholder="备注" />
              <button className="primary wide" onClick={addSeller} disabled={busy === "seller:add"}><Plus size={15} /> 添加商家订阅</button>
            </div>
            <div className="rows">
              {sellers.length === 0 ? <div className="row muted">暂无商家订阅</div> : sellers.map(sub => (
                <div className="row" key={sub.seller_id}>
                  <div><div>{sub.seller_name || sub.seller_id}</div><div className="muted">{sub.seller_id}</div></div>
                  <Status enabled={sub.enabled} />
                  <div className="muted">{fmt(sub.last_crawled_at)}</div>
                  <div className="icon-actions">
                    <button className="icon-btn" onClick={() => triggerSeller(sub)} title="立即触发抓取"><RefreshCw size={16} /></button>
                    <button className="icon-btn" onClick={() => toggleSeller(sub)} title={sub.enabled ? "暂停" : "启用"}>{sub.enabled ? <PauseCircle size={16} /> : <PlayCircle size={16} />}</button>
                    <button className="icon-btn" onClick={() => removeSeller(sub.seller_id)} title="删除"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-head"><h2>ref 订阅</h2><Bell size={16} /></div>
            <div className="form">
              <input value={refForm.reference} onChange={e => setRefForm(v => ({ ...v, reference: e.target.value }))} placeholder="ref" />
              <input value={refForm.brand} onChange={e => setRefForm(v => ({ ...v, brand: e.target.value }))} placeholder="品牌" />
              <input className="wide" value={refForm.keyword} onChange={e => setRefForm(v => ({ ...v, keyword: e.target.value }))} placeholder="搜索关键词，留空时用 品牌 + ref" />
              <input value={refForm.interval} onChange={e => setRefForm(v => ({ ...v, interval: e.target.value }))} placeholder="间隔分钟" />
              <input value={refForm.note} onChange={e => setRefForm(v => ({ ...v, note: e.target.value }))} placeholder="备注" />
              <button className="primary wide" onClick={addRef} disabled={busy === "ref:add"}><Plus size={15} /> 添加 ref 订阅</button>
            </div>
            <div className="rows">
              {refs.length === 0 ? <div className="row muted">暂无 ref 订阅</div> : refs.map(sub => (
                <div className="row" key={sub.reference}>
                  <div><div>{sub.brand ? `${sub.brand} ${sub.reference}` : sub.reference}</div><div className="muted">{sub.keyword}</div></div>
                  <Status enabled={sub.enabled} />
                  <div className="muted">{fmt(sub.last_crawled_at)}</div>
                  <div className="icon-actions">
                    <button className="icon-btn" onClick={() => triggerRef(sub)} title="立即触发搜索"><RefreshCw size={16} /></button>
                    <button className="icon-btn" onClick={() => toggleRef(sub)} title={sub.enabled ? "暂停" : "启用"}>{sub.enabled ? <PauseCircle size={16} /> : <PlayCircle size={16} />}</button>
                    <button className="icon-btn" onClick={() => removeRef(sub.reference)} title="删除"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="panel section">
          <div className="panel-head"><h2>最近闲鱼商品</h2><span className="muted">{items.length}</span></div>
          <div className="rows">
            {items.length === 0 ? <div className="item-row muted">暂无商品</div> : items.slice(0, 20).map(item => (
              <div className="item-row" key={item.item_id}>
                {item.images?.[0] ? <img className="thumb" src={item.images[0]} alt="" /> : <div className="thumb" />}
                <div className="item-main"><a className="link" href={item.source_url} target="_blank" rel="noreferrer">{item.title}</a><div className="muted">item {item.item_id}</div></div>
                <div>{item.raw_price || (item.price_cny ? `${item.price_cny}` : "-")}</div>
                <div className="muted">{fmt(item.first_seen_at)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel section">
          <div className="panel-head"><h2>最近机会记录</h2><span className="muted">{opportunities.length}</span></div>
          <div className="rows">
            {opportunities.length === 0 ? <div className="item-row muted">暂无机会记录</div> : opportunities.slice(0, 20).map(item => (
              <div className="item-row opportunity-row" key={`${item.item_id}-${item.created_at}`}>
                <div><span className={`decision-badge ${decisionClass(item.decision)}`}>{decisionLabel(item.decision)}</span></div>
                <div className="item-main"><a className="link" href={item.source_url} target="_blank" rel="noreferrer">{item.title}</a><div className="muted">item {item.item_id} · {item.subscription_kind || "-"} {item.subscription_key || ""}</div></div>
                <div>{item.profit_margin ?? "-"}</div>
                <div className="muted">{fmt(item.created_at)}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
