import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../components/Toast";

const bd = "'Barlow','Noto Sans SC',sans-serif";
const hd = "'Instrument Serif','Noto Serif SC',serif";

export default function Signup() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { signup } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = params.get("from") || "/";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("请填写邮箱和密码");
      return;
    }
    if (password.length < 8) {
      setError("密码至少 8 个字符");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signup(email, password);
      toast.push("注册成功，已自动登录", "success");
      navigate(from, { replace: true });
    } catch (err: any) {
      const code = err?.response?.data?.error?.code;
      if (code === "EMAIL_TAKEN") setError("该邮箱已注册");
      else if (code === "WEAK_PASSWORD") setError("密码至少 8 个字符");
      else setError("注册失败，请稍后再试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: bd, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 32 }}>
          <img src="/logo/raventik_logo_nav_32.png" width={32} height={32} style={{ borderRadius: 8 }} alt="Raventik" />
          <span style={{ fontFamily: hd, fontStyle: "italic", fontSize: 22, color: "#fff", letterSpacing: "-0.5px" }}>Raventik</span>
        </Link>

        <h1 style={{ fontFamily: "'Noto Serif SC',serif", fontSize: 26, fontWeight: 700, textAlign: "center", marginBottom: 8 }}>注册</h1>
        <p style={{ fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.4)", textAlign: "center", marginBottom: 28 }}>免费创建账号，开始追踪心仪表款</p>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email" placeholder="邮箱" value={email}
            onChange={e => setEmail(e.target.value)} autoFocus autoComplete="email"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "13px 16px", fontSize: 14, color: "#fff", fontFamily: bd, outline: "none" }}
          />
          <input
            type="password" placeholder="密码（至少 8 个字符）" value={password}
            onChange={e => setPassword(e.target.value)} autoComplete="new-password" minLength={8}
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "13px 16px", fontSize: 14, color: "#fff", fontFamily: bd, outline: "none" }}
          />

          {error && (
            <div style={{ fontSize: 12, color: "#ef4444", padding: "8px 12px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>
          )}

          <button type="submit" disabled={submitting} style={{
            padding: "13px", borderRadius: 12, border: "none", marginTop: 8,
            background: "#fff", color: "#0a0a0a", fontSize: 14, fontWeight: 600,
            cursor: submitting ? "wait" : "pointer", opacity: submitting ? 0.7 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: bd,
          }}>
            {submitting ? "注册中..." : <>创建账号 <ArrowRight size={14} /></>}
          </button>
        </form>

        <p style={{ fontSize: 12, fontWeight: 300, color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: 24 }}>
          已有账号？<Link to={`/login${from !== "/" ? `?from=${encodeURIComponent(from)}` : ""}`} style={{ color: "rgba(255,255,255,0.8)", textDecoration: "underline", textUnderlineOffset: 3 }}>登录</Link>
        </p>
      </div>
    </div>
  );
}
