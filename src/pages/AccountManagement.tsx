import { useCallback, useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { Key, LogIn, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useToast } from "../components/Toast";
import {
  deleteAccount,
  getCookie,
  listAccounts,
  loginStart,
  loginStatus,
  refreshAccount,
} from "../api/goofish";
import type { GoofishAccount, GoofishCookie, GoofishStatus } from "../api/types";

const bd = "'Barlow','Noto Sans SC',sans-serif";
const hd = "'Instrument Serif','Noto Serif SC',serif";

const NAV = [
  { to: "/", label: "首页" },
  { to: "/brands", label: "品牌列表" },
  { to: "/config", label: "配置表" },
  { to: "/accounts", label: "账号管理" },
  { to: "/watchlist", label: "关注列表" },
];

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

function fmtTime(epoch?: number | null): string {
  if (!epoch) return "—";
  try {
    return new Date(epoch * 1000).toLocaleString("zh-CN");
  } catch {
    return "—";
  }
}

const iconBtn: CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 30, height: 30, borderRadius: 8,
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.7)", cursor: "pointer",
};

export default function AccountManagement() {
  const { push } = useToast();
  const [accounts, setAccounts] = useState<GoofishAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAccount, setNewAccount] = useState("");
  const [scan, setScan] = useState<GoofishStatus | null>(null);
  const [cookieView, setCookieView] = useState<GoofishCookie | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAccounts(await listAccounts());
    } catch (e: any) {
      push(e?.response?.data?.error || "加载账号失败", "error");
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

  async function startLogin(acct: string) {
    const name = acct.trim();
    if (!name) { push("请输入账号名", "warning"); return; }
    setBusy(name);
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

  async function handleRefresh(acct: string) {
    setBusy(acct);
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
    setBusy(acct);
    try {
      setCookieView(await getCookie(acct));
    } catch (e: any) {
      push(e?.response?.data?.error || "获取 cookie 失败（未登录？）", "error");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(acct: string) {
    if (!window.confirm(`确认删除账号「${acct}」？将清除登录态、快照与 profile，不可恢复。`)) return;
    setBusy(acct);
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

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: bd }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Barlow:wght@300;400;500;600&family=Noto+Serif+SC:wght@400;600;700&family=Noto+Sans+SC:wght@300;400;500&display=swap');
        *{box-sizing:border-box}
        .gp{background:rgba(255,255,255,0.08);backdrop-filter:blur(20px);border-radius:9999px;box-shadow:inset 0 1px 1px rgba(255,255,255,0.15),0 2px 12px rgba(0,0,0,0.08)}
        .row:hover{background:rgba(255,255,255,0.03)}
      `}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, padding: "12px 40px", background: "rgba(10,10,10,0.6)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", gap: 20 }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <img src="/logo/raventik_logo_nav_32.png" width={32} height={32} style={{ borderRadius: 8, objectFit: "contain" }} alt="Raventik" />
            <span style={{ fontFamily: hd, fontStyle: "italic", fontSize: 20, color: "#fff", letterSpacing: "-0.5px" }}>Raventik</span>
          </Link>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            {NAV.map(item => {
              const active = item.to === "/accounts";
              return (
                <Link key={item.to} to={item.to} style={{ padding: "6px 12px", fontSize: 12, fontWeight: 400, color: active ? "#fff" : "rgba(255,255,255,0.6)", textDecoration: "none", borderRadius: 9999, background: active ? "rgba(255,255,255,0.08)" : "transparent", fontFamily: bd }}>{item.label}</Link>
              );
            })}
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "100px 40px 60px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div className="gp" style={{ display: "inline-flex", padding: "4px 14px", fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.6)", marginBottom: 14, letterSpacing: "1px" }}>账号管理</div>
            <h1 style={{ fontFamily: hd, fontSize: 34, fontWeight: 400, letterSpacing: "-0.5px" }}>闲鱼账号</h1>
          </div>
        </div>

        {/* 添加账号 */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <input
            value={newAccount}
            onChange={e => setNewAccount(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") startLogin(newAccount); }}
            placeholder="输入账号名（自定义标识，如 shop01）后启动扫码登录"
            style={{ flex: 1, padding: "10px 16px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, outline: "none", fontFamily: bd }}
          />
          <button
            onClick={() => startLogin(newAccount)}
            disabled={busy !== null}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, background: "#fff", color: "#0a0a0a", border: "none", fontSize: 13, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1 }}
          >
            <Plus size={15} /> 添加并登录
          </button>
        </div>

        {/* 账号表格 */}
        <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.2fr 1.6fr 1.4fr", padding: "12px 18px", fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", color: "rgba(255,255,255,0.4)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span>账号</span><span>状态</span><span>UNB</span><span>更新时间</span><span style={{ textAlign: "right" }}>操作</span>
          </div>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>加载中…</div>
          ) : accounts.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>暂无账号，上方添加一个开始扫码登录</div>
          ) : accounts.map(a => {
            const live = a.liveStatus && a.liveStatus !== a.status ? a.liveStatus : undefined;
            return (
              <div key={a.account} className="row" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.2fr 1.6fr 1.4fr", alignItems: "center", padding: "14px 18px", fontSize: 13, borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}>
                <span style={{ fontWeight: 500 }}>{a.account}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 9999, background: statusColor(a.status) }} />
                  <span style={{ color: statusColor(a.status) }}>{statusLabel(a.status)}</span>
                  {live && <span style={{ fontSize: 11, color: statusColor(live) }}>({statusLabel(live)})</span>}
                </span>
                <span style={{ color: "rgba(255,255,255,0.6)", fontFamily: "monospace", fontSize: 12 }}>{a.unb || "—"}</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{fmtTime(a.updatedAt)}</span>
                <span style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button title="登录/重新扫码" style={iconBtn} disabled={busy !== null} onClick={() => startLogin(a.account)}><LogIn size={14} /></button>
                  <button title="刷新登录态" style={iconBtn} disabled={busy !== null} onClick={() => handleRefresh(a.account)}><RefreshCw size={14} /></button>
                  <button title="查看 cookie" style={iconBtn} disabled={busy !== null} onClick={() => handleCookie(a.account)}><Key size={14} /></button>
                  <button title="删除账号" style={{ ...iconBtn, color: "#ef4444" }} disabled={busy !== null} onClick={() => handleDelete(a.account)}><Trash2 size={14} /></button>
                </span>
              </div>
            );
          })}
        </div>
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
          <button onClick={onClose} style={{ ...iconBtn, width: 28, height: 28 }}><X size={15} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
