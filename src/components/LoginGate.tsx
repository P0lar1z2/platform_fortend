/**
 * 登录引导组件（移植自设计稿 raventik_login_gates）。
 * - LoginPageGate：整页蒙版,用于需登录/运营的页面(配置表、关注列表)。
 * - LoginActionGate：锚定按钮的操作拦截弹窗(关注/书签/交易预期)。
 * 两者纯展示 + 默认把"前往登录"接到 /login?from=当前路径;自助注册已下线,故无注册入口。
 */
import type { CSSProperties } from "react";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowRight, X } from "lucide-react";

const bd = "'Barlow','Noto Sans SC',sans-serif";

/** 跳登录页并带上 from，登录后回到原页。 */
export function useGotoLogin() {
  const navigate = useNavigate();
  return useCallback(() => {
    const from = window.location.pathname + window.location.search;
    navigate(`/login?from=${encodeURIComponent(from)}`);
  }, [navigate]);
}

interface PageGateProps {
  onLogin?: () => void;
  onClose?: () => void;
  /** 文案可覆盖(如配置表为运营功能时)。 */
  title?: string;
  description?: string;
}

export function LoginPageGate({ onLogin, onClose, title, description }: PageGateProps) {
  const goto = useGotoLogin();
  const handleLogin = onLogin ?? goto;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{ position: "absolute", inset: 0, background: "rgba(10,10,10,0.8)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
        onClick={onClose}
      />
      <div style={{
        position: "relative", width: "100%", maxWidth: "400px", padding: "40px 36px", textAlign: "center",
        background: "rgba(20,20,20,0.95)", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.08)",
      }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "inherit", padding: "1.2px", pointerEvents: "none",
          background: "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.08) 75%, rgba(255,255,255,0.25) 100%)",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor", maskComposite: "exclude",
        }} />
        {onClose && (
          <button onClick={onClose} style={{
            position: "absolute", top: "16px", right: "16px", width: "32px", height: "32px", borderRadius: "8px",
            background: "rgba(255,255,255,0.04)", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <X size={15} color="rgba(255,255,255,0.4)" />
          </button>
        )}
        <div style={{
          width: "56px", height: "56px", borderRadius: "16px", margin: "0 auto 20px",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)",
        }}>
          <Lock size={24} color="rgba(255,255,255,0.25)" strokeWidth={1.5} />
        </div>
        <h2 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "22px", fontWeight: 700, color: "#fff", marginBottom: "10px" }}>
          {title ?? "登录后可使用此功能"}
        </h2>
        <p style={{ fontSize: "13px", fontWeight: 300, color: "rgba(255,255,255,0.4)", fontFamily: bd, lineHeight: 1.6, maxWidth: "300px", margin: "0 auto 28px" }}>
          {description ?? "登录后可同步关注列表、自定义配置参数、保存估值历史和接收价格监控推送。"}
        </p>
        <button onClick={handleLogin} style={{
          width: "100%", padding: "14px", borderRadius: "12px", border: "none", cursor: "pointer",
          background: "#fff", color: "#0a0a0a", fontSize: "14px", fontWeight: 600, fontFamily: bd,
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          boxShadow: "0 4px 16px rgba(255,255,255,0.1)",
        }}>
          前往登录 <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

interface ActionGateProps {
  onLogin?: () => void;
  onClose?: () => void;
  /** 锚定定位覆盖,如 { top: "calc(100% + 8px)", left: 0 }。 */
  style?: CSSProperties;
}

export function LoginActionGate({ onLogin, onClose = () => {}, style = {} }: ActionGateProps) {
  const goto = useGotoLogin();
  const handleLogin = onLogin ?? goto;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 98 }} />
      <div style={{
        position: "absolute", zIndex: 99, width: "260px", padding: "18px",
        background: "rgba(20,20,20,0.95)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 12px 48px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", ...style,
      }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "inherit", padding: "1px", pointerEvents: "none",
          background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.05) 70%, rgba(255,255,255,0.2) 100%)",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor", maskComposite: "exclude",
        }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "14px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Lock size={14} color="rgba(255,255,255,0.3)" />
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff", fontFamily: bd, marginBottom: "4px" }}>需要登录</div>
              <div style={{ fontSize: "11px", fontWeight: 300, color: "rgba(255,255,255,0.4)", fontFamily: bd, lineHeight: 1.5 }}>
                登录后可使用关注和交易估值功能
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleLogin} style={{
              flex: 2, padding: "9px 16px", borderRadius: "9px", border: "none", cursor: "pointer",
              background: "#fff", color: "#0a0a0a", fontSize: "12px", fontWeight: 600, fontFamily: bd,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
            }}>
              登录 <ArrowRight size={13} />
            </button>
            <button onClick={onClose} style={{
              flex: 1, padding: "9px 16px", borderRadius: "9px", border: "none", cursor: "pointer",
              background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", fontSize: "12px", fontWeight: 400, fontFamily: bd,
            }}>
              取消
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
