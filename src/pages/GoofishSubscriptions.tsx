import { useCallback, useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Bell, Copy, Key, LogIn, MessageCircle, PauseCircle, PlayCircle, Plus, RefreshCw, Trash2, Unlink, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/Toast";
import { useAuth } from "../hooks/useAuth";
import { LoginPageGate } from "../components/LoginGate";
import AppHeader from "../components/AppHeader";
import {
  createLarkBindCode,
  deleteAccount,
  deleteLarkBinding,
  deleteRefSubscription,
  deleteSellerSubscription,
  getCookie,
  getLarkBindingStatus,
  listAccounts,
  listGoofishItems,
  listGoofishOpportunities,
  listRefSubscriptions,
  listSellerSubscriptions,
  loginStart,
  loginStatus,
  refreshAccount,
  setRefSubscriptionEnabled,
  setSellerSubscriptionEnabled,
  triggerRefSubscription,
  triggerSellerSubscription,
  upsertRefSubscription,
  upsertSellerSubscription,
} from "../api/goofish";
import type {
  GoofishAccount,
  GoofishCookie,
  GoofishItem,
  GoofishOpportunity,
  GoofishRefSubscription,
  GoofishSellerSubscription,
  GoofishStatus,
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

// 账号更新时间是 epoch 秒，单独格式化（与上面的 DateLike/毫秒口径区分）。
function fmtEpoch(epoch?: number | null): string {
  if (!epoch) return "—";
  try {
    return new Date(epoch * 1000).toLocaleString("zh-CN");
  } catch {
    return "—";
  }
}

function statusColor(s?: string): string {
  if (!s) return "rgba(255,255,255,0.4)";
  if (s === "logged_in") return "#34d399";
  if (s === "pending" || s === "need_face") return "#f59e0b";
  if (s === "expired" || s.startsWith("error")) return "#ef4444";
  return "rgba(255,255,255,0.55)";
}

function statusLabel(s?: string): string {
  switch (s) {
    case "logged_in": return "已登录";
    case "anonymous": return "未登录";
    case "pending": return "等待扫码";
    case "need_face": return "需人脸验证";
    case "expired": return "已过期";
    case "unknown": return "未知";
    default:
      return s?.startsWith("error") ? "错误" : (s ?? "—");
  }
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

const iconBtnStyle: CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 30, height: 30, borderRadius: 8,
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.7)", cursor: "pointer",
};

export default function GoofishSubscriptions() {
  const { push } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  // 闲鱼后台为运营功能 → 仅 operator 可访问,其余(游客/普通用户)看蒙版。
  const gated = !authLoading && (!user || user.role !== "operator");
  // 账号管理
  const [accounts, setAccounts] = useState<GoofishAccount[]>([]);
  const [newAccount, setNewAccount] = useState("");
  const [scan, setScan] = useState<GoofishStatus | null>(null);
  const [cookieView, setCookieView] = useState<GoofishCookie | null>(null);
  // 订阅
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
      const [accountData, sellerData, refData, itemData, opportunityData] = await Promise.all([
        listAccounts(),
        // 商家订阅暂时移除：后端路由已停用,容错为空避免拖垮整页加载。
        listSellerSubscriptions().catch(() => []),
        listRefSubscriptions(),
        listGoofishItems(),
        listGoofishOpportunities(),
      ]);
      const larkData = await getLarkBindingStatus().catch(() => null);
      setAccounts(accountData);
      setSellers(sellerData);
      setRefs(refData);
      setItems(itemData);
      setOpportunities(opportunityData);
      setLarkBinding(larkData);
    } catch (e: any) {
      push(e?.response?.data?.error || "加载闲鱼后台失败", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => { load(); }, [load]);

  // 扫码登录轮询：scan 打开且未到终态时，每 2.5s 拉一次 status
  useEffect(() => {
    if (!scan) return;
    const terminal = (s: string) => s === "logged_in" || s === "expired" || s.startsWith("error");
    if (terminal(scan.status)) {
      if (scan.status === "logged_in") {
        push(`${scan.account} 登录成功`, "success");
        setScan(null);
        load();
      }
      return;
    }
    const t = setTimeout(async () => {
      try {
        setScan(await loginStatus(scan.account));
      } catch (e: any) {
        push(e?.response?.data?.error || "轮询状态失败", "error");
        setScan(null);
      }
    }, 2500);
    return () => clearTimeout(t);
  }, [scan, push, load]);

  // ── 账号操作 ──────────────────────────────────────────────
  async function startLogin(acct: string) {
    const name = acct.trim();
    if (!name) { push("请输入账号名", "warning"); return; }
    setBusy(`acct:${name}`);
    try {
      const st = await loginStart(name);
      if (st.status === "logged_in") {
        push(`${name} 已登录`, "success");
        load();
      } else {
        setScan(st);
      }
      setNewAccount("");
    } catch (e: any) {
      push(e?.response?.data?.error || "启动登录失败", "error");
    } finally {
      setBusy(null);
    }
  }

  async function handleAccountRefresh(acct: string) {
    setBusy(`acct:${acct}`);
    try {
      await refreshAccount(acct);
      push(`${acct} 已刷新`, "success");
      load();
    } catch (e: any) {
      push(e?.response?.data?.error || "刷新失败", "error");
    } finally {
      setBusy(null);
    }
  }

  async function handleCookie(acct: string) {
    setBusy(`acct:${acct}`);
    try {
      setCookieView(await getCookie(acct));
    } catch (e: any) {
      push(e?.response?.data?.error || "获取 cookie 失败（未登录？）", "error");
    } finally {
      setBusy(null);
    }
  }

  async function handleDeleteAccount(acct: string) {
    if (!window.confirm(`确认删除账号「${acct}」？将清除登录态、快照与 profile，不可恢复。`)) return;
    setBusy(`acct:${acct}`);
    try {
      await deleteAccount(acct);
      push(`${acct} 已删除`, "success");
      load();
    } catch (e: any) {
      push(e?.response?.data?.error || "删除失败", "error");
    } finally {
      setBusy(null);
    }
  }

  // ── Lark / 订阅操作 ───────────────────────────────────────
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
    <div className="gf-page" style={gated ? { filter: "blur(4px)", pointerEvents: "none", userSelect: "none" } : undefined}>
      {gated && createPortal(
        <LoginPageGate
          onClose={() => navigate("/")}
          title="闲鱼后台为运营功能"
          description="该页面用于闲鱼账号与抓取订阅管理，仅运营账号可访问。如需开通请联系管理员。"
        />,
        document.body,
      )}
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
        /* 账号管理（作用域化，避开 .row/.status 同名冲突） */
        .acct-add{display:flex;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.07)}
        .acct-add input{flex:1;height:36px;border-radius:8px;border:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.18);color:#fff;padding:0 11px;outline:none}
        .acct-head,.acct-row{display:grid;grid-template-columns:1.4fr 1fr 1.2fr 1.6fr 1.4fr;align-items:center;gap:10px;padding:12px 16px;font-size:13px}
        .acct-head{font-size:11px;font-weight:600;letter-spacing:.5px;color:rgba(255,255,255,.4);border-bottom:1px solid rgba(255,255,255,.07)}
        .acct-row{border-bottom:1px solid rgba(255,255,255,.055)}
        .acct-row:last-child{border-bottom:0}
        .acct-row:hover{background:rgba(255,255,255,.03)}
        @media (max-width:900px){.gf-grid,.lark-panel{grid-template-columns:1fr}.row,.item-row,.acct-head,.acct-row{grid-template-columns:1fr}.icon-actions{justify-content:flex-start}.form{grid-template-columns:1fr}.code-text{max-width:100%}}
      `}</style>

      <AppHeader />

      <main className="gf-main">
        <div className="gf-top">
          <div className="gf-title">
            <h1>闲鱼后台</h1>
            <p>管理闲鱼登录账号与抓取订阅；monitor 查到新商品后会发 Lark 通知。</p>
          </div>
          <button className="gf-action" onClick={load} disabled={loading}><RefreshCw size={15} /> 刷新</button>
        </div>

        {/* 账号管理 */}
        <section className="panel section" style={{ marginTop: 0 }}>
          <div className="panel-head"><h2>闲鱼账号</h2><span className="muted">{accounts.length}</span></div>
          <div className="acct-add">
            <input
              value={newAccount}
              onChange={e => setNewAccount(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") startLogin(newAccount); }}
              placeholder="输入账号名（自定义标识，如 shop01）后启动扫码登录"
            />
            <button className="primary" style={{ padding: "0 18px" }} onClick={() => startLogin(newAccount)} disabled={busy !== null}>
              <Plus size={15} /> 添加并登录
            </button>
          </div>
          <div className="rows">
            <div className="acct-head">
              <span>账号</span><span>状态</span><span>UNB</span><span>更新时间</span><span style={{ textAlign: "right" }}>操作</span>
            </div>
            {loading ? (
              <div className="acct-row muted" style={{ display: "block", textAlign: "center", padding: "32px" }}>加载中…</div>
            ) : accounts.length === 0 ? (
              <div className="acct-row muted" style={{ display: "block", textAlign: "center", padding: "32px" }}>暂无账号，上方添加一个开始扫码登录</div>
            ) : accounts.map(a => {
              const live = a.liveStatus && a.liveStatus !== a.status ? a.liveStatus : undefined;
              return (
                <div key={a.account} className="acct-row">
                  <span style={{ fontWeight: 500 }}>{a.account}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 9999, background: statusColor(a.status) }} />
                    <span style={{ color: statusColor(a.status) }}>{statusLabel(a.status)}</span>
                    {live && <span style={{ fontSize: 11, color: statusColor(live) }}>({statusLabel(live)})</span>}
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontFamily: "monospace", fontSize: 12 }}>{a.unb || "—"}</span>
                  <span className="muted" style={{ fontSize: 12 }}>{fmtEpoch(a.updatedAt)}</span>
                  <span className="icon-actions">
                    <button className="icon-btn" title="登录/重新扫码" disabled={busy !== null} onClick={() => startLogin(a.account)}><LogIn size={14} /></button>
                    <button className="icon-btn" title="刷新登录态" disabled={busy !== null} onClick={() => handleAccountRefresh(a.account)}><RefreshCw size={14} /></button>
                    <button className="icon-btn" title="查看 cookie" disabled={busy !== null} onClick={() => handleCookie(a.account)}><Key size={14} /></button>
                    <button className="icon-btn" title="删除账号" style={{ color: "#ef4444" }} disabled={busy !== null} onClick={() => handleDeleteAccount(a.account)}><Trash2 size={14} /></button>
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Lark 通知 */}
        <section className="lark-panel section">
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
          {/* 商家订阅暂时移除（注释掉）：后端 seller-subscriptions 路由已停用,与"商家订阅暂时移除"方向一致。如需恢复:把 false 改回，并恢复后端路由。 */}
          {false && (
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
          )}

          <section className="panel">
            <div className="panel-head"><h2>订阅展示</h2><Bell size={16} /></div>
            {/* ref 订阅添加表单暂时移除：闲鱼收藏已与平台联通，订阅由收藏同步，不再手动添加 ref 订阅；本面板仅展示当前已订阅内容。如需恢复把 false 改回。 */}
            {false && (
            <div className="form">
              <input value={refForm.reference} onChange={e => setRefForm(v => ({ ...v, reference: e.target.value }))} placeholder="ref" />
              <input value={refForm.brand} onChange={e => setRefForm(v => ({ ...v, brand: e.target.value }))} placeholder="品牌" />
              <input className="wide" value={refForm.keyword} onChange={e => setRefForm(v => ({ ...v, keyword: e.target.value }))} placeholder="搜索关键词，留空时用 品牌 + ref" />
              <input value={refForm.interval} onChange={e => setRefForm(v => ({ ...v, interval: e.target.value }))} placeholder="间隔分钟" />
              <input value={refForm.note} onChange={e => setRefForm(v => ({ ...v, note: e.target.value }))} placeholder="备注" />
              <button className="primary wide" onClick={addRef} disabled={busy === "ref:add"}><Plus size={15} /> 添加 ref 订阅</button>
            </div>
            )}
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

      {/* 扫码 modal */}
      {scan && (
        <Modal onClose={() => setScan(null)} title={`登录：${scan.account}`}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, color: statusColor(scan.status), marginBottom: 16 }}>
              {scan.status === "need_face" ? "需人脸验证，请用手机闲鱼 App 扫码完成活体验证" : "请用手机闲鱼 App 扫码登录"}
            </div>
            {(scan.faceQrcode || scan.qrcode) ? (
              <img
                src={`data:image/png;base64,${scan.faceQrcode || scan.qrcode}`}
                alt="二维码"
                style={{ width: 220, height: 220, objectFit: "contain", borderRadius: 12, background: "#fff", padding: 8 }}
              />
            ) : (
              <div style={{ width: 220, height: 220, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                二维码生成中…
              </div>
            )}
            <div style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>状态：{statusLabel(scan.status)} · 自动刷新中</div>
          </div>
        </Modal>
      )}

      {/* cookie modal */}
      {cookieView && (
        <Modal onClose={() => setCookieView(null)} title={`Cookie：${cookieView.account}`}>
          <div style={{ fontSize: 13, lineHeight: 1.8 }}>
            <div><span style={{ color: "rgba(255,255,255,0.5)" }}>UNB：</span><span style={{ fontFamily: "monospace" }}>{cookieView.unb}</span></div>
            <div><span style={{ color: "rgba(255,255,255,0.5)" }}>昵称：</span>{cookieView.tracknick || "—"}</div>
            <div><span style={{ color: "rgba(255,255,255,0.5)" }}>Cookie 条数：</span>{cookieView.cookies.length}</div>
            <div style={{ marginTop: 12, color: "rgba(255,255,255,0.5)" }}>mtop_cookie：</div>
            <textarea
              readOnly
              value={cookieView.mtopCookie}
              style={{ width: "100%", height: 120, marginTop: 6, padding: 12, borderRadius: 10, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", fontSize: 12, fontFamily: "monospace", resize: "none", outline: "none" }}
            />
            <button
              onClick={() => { navigator.clipboard?.writeText(cookieView.mtopCookie); push("已复制 cookie", "success"); }}
              style={{ marginTop: 12, padding: "8px 18px", borderRadius: 9999, background: "#fff", color: "#0a0a0a", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              复制 cookie
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: 380, maxWidth: "90vw", padding: 28, borderRadius: 18, background: "rgba(20,20,22,0.96)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
          <button onClick={onClose} style={{ ...iconBtnStyle, width: 28, height: 28 }}><X size={15} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
