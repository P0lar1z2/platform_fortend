import { Bookmark } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { useWatchlist, type WatchlistEntry } from "../hooks/useWatchlist";
import { useAuth } from "../hooks/useAuth";
import { LoginActionGate } from "./LoginGate";
import { useToast } from "./Toast";

type Variant = "icon" | "button" | "wide";

interface Props {
  entry: Omit<WatchlistEntry, "addedAt">;
  variant?: Variant;
  style?: CSSProperties;
}

export default function WatchlistToggle({ entry, variant = "icon", style }: Props) {
  const { isWatched, toggle, isFull } = useWatchlist();
  const { user } = useAuth();
  const toast = useToast();
  const [showGate, setShowGate] = useState(false);
  const watched = isWatched(entry.ref, entry.catalogId);
  const disabled = !watched && isFull;

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    // 游客:拦截关注操作,引导登录(关注需登录,账号由运营开通)。
    if (!user) {
      setShowGate(true);
      return;
    }
    if (disabled) {
      toast.push("关注已满 30 个，请先取消部分关注", "warning");
      return;
    }
    const result = toggle(entry);
    if ("removed" in result && result.removed) {
      toast.push("已取消关注", "info");
    } else if (result.ok) {
      toast.push("已加入关注，系统将自动监控", "success");
    } else if ("reason" in result && result.reason === "full") {
      toast.push("关注已满 30 个，请先取消部分关注", "warning");
    }
  }

  const title = disabled ? "已达上限，请先取消部分关注" : watched ? "取消关注" : "加入关注";

  // LoginActionGate 是锚定浮层;包一层 relative 容器 + stopPropagation,
  // 避免卡片 Link 等父级在交互弹窗时被误触发导航。
  const gate = showGate ? (
    // display:contents 不建立新的定位上下文,弹窗仍锚定到外层 relative 容器;
    // 同时拦截冒泡,避免卡片 Link 等父级在交互弹窗时被误触发导航。
    <span onClick={e => { e.preventDefault(); e.stopPropagation(); }} style={{ display: "contents" }}>
      <LoginActionGate
        onClose={() => setShowGate(false)}
        style={variant === "icon" ? { top: "calc(100% + 8px)", right: 0 } : { top: "calc(100% + 8px)", left: 0 }}
      />
    </span>
  ) : null;

  if (variant === "icon") {
    return (
      <span style={{ position: "relative", display: "inline-flex" }}>
        <button onClick={onClick} disabled={disabled && !watched} title={title} style={{
          width: 32, height: 32,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          borderRadius: 8,
          background: watched ? "rgba(96,165,250,0.18)" : "rgba(255,255,255,0.04)",
          border: "1px solid " + (watched ? "rgba(96,165,250,0.35)" : "rgba(255,255,255,0.08)"),
          color: watched ? "#60a5fa" : disabled ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.7)",
          cursor: disabled && !watched ? "not-allowed" : "pointer",
          transition: "all 0.15s",
          ...style,
        }}>
          <Bookmark size={14} fill={watched ? "#60a5fa" : "transparent"} />
        </button>
        {gate}
      </span>
    );
  }

  const wide = variant === "wide";
  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <button onClick={onClick} disabled={disabled && !watched} title={title} style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: wide ? "11px 20px" : "8px 14px",
        borderRadius: 9999,
        background: watched ? "rgba(96,165,250,0.18)" : "rgba(255,255,255,0.06)",
        border: "1px solid " + (watched ? "rgba(96,165,250,0.35)" : "rgba(255,255,255,0.1)"),
        color: watched ? "#60a5fa" : disabled ? "rgba(255,255,255,0.3)" : "#fff",
        fontSize: wide ? 13 : 12,
        fontWeight: 500,
        cursor: disabled && !watched ? "not-allowed" : "pointer",
        fontFamily: "Inter, sans-serif",
        transition: "all 0.15s",
        ...style,
      }}>
        <Bookmark size={wide ? 14 : 13} fill={watched ? "#60a5fa" : "transparent"} />
        {watched ? "已关注" : "设置关注"}
      </button>
      {gate}
    </span>
  );
}
