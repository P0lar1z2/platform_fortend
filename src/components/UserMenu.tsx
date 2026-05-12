import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "./Toast";

const bd = "'Barlow','Noto Sans SC',sans-serif";

interface Props {
  variant?: "filled" | "outline";
}

// 已登录: 头像 + email + dropdown (logout)。未登录: 走 /login 的 CTA。
export default function UserMenu({ variant = "filled" }: Props) {
  const { user, loading, logout } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  if (loading) {
    return <div style={{ width: 60, height: 30 }} />;
  }

  if (!user) {
    if (variant === "outline") {
      return (
        <Link to="/login" style={{
          padding: "6px 14px", fontSize: 12, fontWeight: 500,
          color: "#fff", background: "transparent",
          border: "1px solid rgba(255,255,255,0.2)", borderRadius: 9999,
          textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, fontFamily: bd,
        }}>登录 <ArrowUpRight size={13} /></Link>
      );
    }
    return (
      <Link to="/login" style={{
        padding: "6px 16px", fontSize: 13, fontWeight: 500,
        color: "#0a0a0a", background: "#fff", borderRadius: 9999,
        textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, fontFamily: bd,
      }}>登录 <ArrowUpRight size={13} /></Link>
    );
  }

  const initial = user.email.charAt(0).toUpperCase();

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(v => !v)} style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "4px 12px 4px 4px",
        background: open ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 9999, cursor: "pointer", color: "#fff",
        fontFamily: bd, fontSize: 12,
      }}>
        <span style={{
          width: 24, height: 24, borderRadius: "50%",
          background: "rgba(96,165,250,0.2)", color: "#60a5fa",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontWeight: 600, fontSize: 11,
        }}>{initial}</span>
        <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0, minWidth: 200,
          background: "rgba(20,20,20,0.95)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12, padding: 6, backdropFilter: "blur(20px)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.4)", zIndex: 110,
        }}>
          <div style={{ padding: "8px 10px", fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: bd, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <UserIcon size={11} style={{ marginRight: 6, verticalAlign: "middle" }} />
            {user.email}
          </div>
          <Link to="/watchlist" onClick={() => setOpen(false)} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 10px", fontSize: 12, color: "rgba(255,255,255,0.7)",
            textDecoration: "none", borderRadius: 8, fontFamily: bd,
          }}>我的关注</Link>
          <button onClick={async () => {
            setOpen(false);
            try { await logout(); toast.push("已登出", "info"); }
            catch { toast.push("登出失败", "error"); }
          }} style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%",
            padding: "8px 10px", fontSize: 12, color: "#ef4444",
            background: "transparent", border: "none", cursor: "pointer",
            borderRadius: 8, fontFamily: bd, textAlign: "left",
          }}>
            <LogOut size={12} /> 退出登录
          </button>
        </div>
      )}
    </div>
  );
}
