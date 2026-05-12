import { Bookmark } from "lucide-react";
import { useWatchlist, type WatchlistEntry } from "../hooks/useWatchlist";
import { useToast } from "./Toast";
import { CSSProperties } from "react";

type Variant = "icon" | "button" | "wide";

interface Props {
  entry: Omit<WatchlistEntry, "addedAt">;
  variant?: Variant;
  style?: CSSProperties;
}

export default function WatchlistToggle({ entry, variant = "icon", style }: Props) {
  const { isWatched, toggle, isFull } = useWatchlist();
  const toast = useToast();
  const watched = isWatched(entry.ref);
  const disabled = !watched && isFull;

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) {
      toast.push("关注已满 30 个，请先取消部分关注", "warning");
      return;
    }
    const result = toggle(entry);
    if ("removed" in result && result.removed) {
      toast.push("已取消关注", "info");
    } else if (result.ok) {
      toast.push("已加入关注，系统将自动监控", "success");
    } else if (result.reason === "full") {
      toast.push("关注已满 30 个，请先取消部分关注", "warning");
    }
  }

  const title = disabled ? "已达上限，请先取消部分关注" : watched ? "取消关注" : "加入关注";

  if (variant === "icon") {
    return (
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
    );
  }

  const wide = variant === "wide";
  return (
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
  );
}
