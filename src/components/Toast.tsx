import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";

type ToastTone = "info" | "success" | "warning" | "error";
interface ToastItem { id: number; text: string; tone: ToastTone; }

interface ToastCtx {
  push: (text: string, tone?: ToastTone) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

let _id = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((text: string, tone: ToastTone = "info") => {
    const id = ++_id;
    setItems(prev => [...prev, { id, text, tone }]);
    setTimeout(() => {
      setItems(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div style={{
        position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)",
        display: "flex", flexDirection: "column", gap: 8, zIndex: 9999, pointerEvents: "none",
      }}>
        {items.map(t => <ToastBubble key={t.id} item={t} />)}
      </div>
    </Ctx.Provider>
  );
}

function ToastBubble({ item }: { item: ToastItem }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const colorMap: Record<ToastTone, string> = {
    info: "rgba(255,255,255,0.95)",
    success: "#34d399",
    warning: "#f59e0b",
    error: "#ef4444",
  };
  return (
    <div style={{
      padding: "10px 18px",
      borderRadius: 9999,
      background: "rgba(20,20,20,0.95)",
      border: "1px solid rgba(255,255,255,0.1)",
      color: colorMap[item.tone],
      fontSize: 13,
      fontWeight: 500,
      backdropFilter: "blur(12px)",
      opacity: mounted ? 1 : 0,
      transform: mounted ? "translateY(0)" : "translateY(-8px)",
      transition: "opacity 180ms, transform 180ms",
      pointerEvents: "auto",
      whiteSpace: "nowrap",
    }}>
      {item.text}
    </div>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
