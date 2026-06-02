import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, PauseCircle, PlayCircle, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useToast } from "../components/Toast";
import {
  deleteRefSubscription,
  deleteSellerSubscription,
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
} from "../api/types";

const nav = [
  { to: "/", label: "首页" },
  { to: "/brands", label: "品牌列表" },
  { to: "/config", label: "配置表" },
  { to: "/accounts", label: "账号管理" },
  { to: "/goofish-subscriptions", label: "闲鱼订阅" },
  { to: "/watchlist", label: "关注列表" },
];

function fmt(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("zh-CN");
}

function Status({ enabled }: { enabled: boolean }) {
  return (
    <span className={enabled ? "status on" : "status off"}>
      {enabled ? "启用" : "暂停"}
    </span>
  );
}

export default function GoofishSubscriptions() {
  const { push } = useToast();
  const [sellers, setSellers] = useState<GoofishSellerSubscription[]>([]);
  const [refs, setRefs] = useState<GoofishRefSubscription[]>([]);
  const [items, setItems] = useState<GoofishItem[]>([]);
  const [opportunities, setOpportunities] = useState<GoofishOpportunity[]>([]);
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
      setSellers(sellerData);
      setRefs(refData);
      setItems(itemData);
      setOpportunities(opportunityData);
    } catch (e: any) {
      push(e?.response?.data?.error || "加载闲鱼订阅失败", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => { load(); }, [load]);

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
        .gf-nav{position:fixed;top:0;left:0;right:0;z-index:50;padding:12px 40px;background:rgba(9,9,9,.72);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,.07)}
        .gf-nav-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;gap:20px}
        .gf-logo{display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none}
        .gf-nav-links{display:flex;align-items:center;gap:4px;margin-left:auto}
        .gf-nav-links a{padding:6px 12px;border-radius:999px;color:rgba(255,255,255,.58);text-decoration:none;font-size:12px}
        .gf-nav-links a.active{background:rgba(255,255,255,.09);color:#fff}
        .gf-main{max-width:1180px;margin:0 auto;padding:96px 40px 56px}
        .gf-top{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:24px}
        .gf-title h1{font-size:32px;font-weight:500;margin:0 0 8px}
        .gf-title p{margin:0;color:rgba(255,255,255,.55);font-size:13px}
        .gf-action{display:inline-flex;align-items:center;gap:7px;height:36px;padding:0 14px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.07);color:#fff;cursor:pointer}
        .gf-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
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
        .thumb{width:56px;height:56px;border-radius:8px;object-fit:cover;background:rgba(255,255,255,.06)}
        .link{color:#93c5fd;text-decoration:none}
        @media (max-width:900px){.gf-grid{grid-template-columns:1fr}.row,.item-row{grid-template-columns:1fr}.icon-actions{justify-content:flex-start}.gf-nav-links{display:none}.form{grid-template-columns:1fr}}
      `}</style>

      <nav className="gf-nav">
        <div className="gf-nav-inner">
          <Link className="gf-logo" to="/">
            <img src="/logo/raventik_logo_nav_32.png" width={32} height={32} style={{ borderRadius: 8 }} alt="Raventik" />
            <span>Raventik</span>
          </Link>
          <div className="gf-nav-links">
            {nav.map(item => (
              <Link key={item.to} to={item.to} className={item.to === "/goofish-subscriptions" ? "active" : ""}>{item.label}</Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="gf-main">
        <div className="gf-top">
          <div className="gf-title">
            <h1>闲鱼订阅</h1>
            <p>商家订阅走商家主页抓取，ref 订阅走搜索抓取；monitor 查到新商品后会发 Lark 通知。</p>
          </div>
          <button className="gf-action" onClick={load} disabled={loading}><RefreshCw size={15} /> 刷新</button>
        </div>

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
                <div><a className="link" href={item.source_url} target="_blank" rel="noreferrer">{item.title}</a><div className="muted">item {item.item_id} · seller {item.seller_id || "-"}</div></div>
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
              <div className="item-row" key={`${item.item_id}-${item.created_at}`}>
                <div className="muted">{item.decision}</div>
                <div><a className="link" href={item.source_url} target="_blank" rel="noreferrer">{item.title}</a><div className="muted">item {item.item_id}</div></div>
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
