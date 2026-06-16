import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { listBrands } from "../api/brands";
import type { BrandSummary } from "../api/types";

const ALL_BRANDS = "全部";
const FALLBACK_BRANDS: BrandSummary[] = [
  { slug: "rolex", name: "Rolex", nameCn: "劳力士", modelCount: 0 },
  { slug: "omega", name: "Omega", nameCn: "欧米茄", modelCount: 0 },
  { slug: "patek-philippe", name: "Patek Philippe", nameCn: "百达翡丽", modelCount: 0 },
  { slug: "audemars-piguet", name: "Audemars Piguet", nameCn: "爱彼", modelCount: 0 },
  { slug: "cartier", name: "Cartier", nameCn: "卡地亚", modelCount: 0 },
  { slug: "iwc", name: "IWC", nameCn: "万国", modelCount: 0 },
  { slug: "tudor", name: "Tudor", nameCn: "帝舵", modelCount: 0 },
  { slug: "grand-seiko", name: "Grand Seiko", nameCn: "冠蓝狮", modelCount: 0 },
];

interface Props {
  value: string;
  onChange: (brand: string) => void;
  fontFamily: string;
  compact?: boolean;
}

function firstLetter(name: string) {
  const first = (name.trim()[0] || "#").toUpperCase();
  return /[A-Z]/.test(first) ? first : "#";
}

function keyToLetter(key: string) {
  const letter = key.length === 1 ? key.toUpperCase() : "";
  return /^[A-Z]$/.test(letter) ? letter : "";
}

function matchesBrandPrefix(brand: BrandSummary, q: string) {
  const name = brand.name.toLowerCase();
  return name.startsWith(q) || name.split(/[\s-]+/).some(part => part.startsWith(q));
}

export default function BrandSelect({ value, onChange, fontFamily, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [brands, setBrands] = useState<BrandSummary[]>(FALLBACK_BRANDS);
  const [query, setQuery] = useState("");
  const [letter, setLetter] = useState(ALL_BRANDS);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const letterRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    let alive = true;
    listBrands()
      .then(r => {
        if (!alive || !r.items?.length) return;
        setBrands([...r.items].sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch(() => undefined);
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (!rootRef.current?.contains(target) && !popRef.current?.contains(target)) setOpen(false);
    }
    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const letters = useMemo(() => {
    const set = new Set(brands.map(b => firstLetter(b.name)));
    return [ALL_BRANDS, ...Array.from(set).sort()];
  }, [brands]);

  const q = query.trim().toLowerCase();
  const queryLetter = keyToLetter(query.trim());
  const activeLetter = queryLetter || letter;
  const isLatinQuery = /^[a-z]+$/.test(q);
  const hasPrefixMatches = q.length > 1 && isLatinQuery && brands.some(b => matchesBrandPrefix(b, q));
  const filtered = brands.filter(b => {
    const brandLetter = firstLetter(b.name);
    const matchesLetter = activeLetter === ALL_BRANDS || brandLetter === activeLetter;
    const haystack = `${b.name} ${b.nameCn || ""}`.toLowerCase();
    const matchesQuery = !q
      || (queryLetter ? brandLetter === queryLetter
        : hasPrefixMatches ? matchesBrandPrefix(b, q)
          : haystack.includes(q));
    return matchesLetter && matchesQuery;
  });

  const selectedLabel = value === ALL_BRANDS ? "全部品牌" : value;
  const buttonWidth = compact ? 118 : 136;

  function choose(next: string) {
    onChange(next);
    setOpen(false);
    setQuery("");
  }

  function jumpToLetter(nextLetter: string) {
    if (!letters.includes(nextLetter)) return;
    setOpen(true);
    setLetter(nextLetter);
    setQuery("");
  }

  function updateQuery(nextQuery: string) {
    setQuery(nextQuery);
    const nextLetter = keyToLetter(nextQuery.trim());
    if (nextLetter && letters.includes(nextLetter)) {
      setLetter(nextLetter);
    } else if (nextQuery.trim().length !== 1) {
      setLetter(ALL_BRANDS);
    }
  }

  useEffect(() => {
    if (!open) return;
    letterRefs.current[letter]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [letter, open]);

  // 下拉用 portal 渲染到 body，避免被祖先的 overflow:hidden 裁切或被后续 section 盖住。
  // fixed 定位需要按按钮在视口中的位置实时计算，并随滚动/缩放更新。
  useLayoutEffect(() => {
    if (!open) return;
    function update() {
      const r = rootRef.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 6, left: r.left });
    }
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, compact]);

  function handleRootKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement | null;
    if (target?.tagName === "INPUT") return;
    const nextLetter = keyToLetter(e.key);
    if (!nextLetter) return;
    e.preventDefault();
    jumpToLetter(nextLetter);
  }

  return (
    <div ref={rootRef} onKeyDown={handleRootKeyDown} style={{ position: "relative", flexShrink: 0, zIndex: open ? 20 : 2 }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        title="选择品牌"
        onClick={() => setOpen(v => !v)}
        onKeyDown={e => {
          const nextLetter = keyToLetter(e.key);
          if (!nextLetter) return;
          e.preventDefault();
          jumpToLetter(nextLetter);
        }}
        style={{
          width: buttonWidth,
          height: compact ? 34 : 40,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          padding: compact ? "0 10px 0 12px" : "0 12px 0 14px",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "9999px",
          background: open ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)",
          color: value === ALL_BRANDS ? "rgba(255,255,255,0.62)" : "#fff",
          cursor: "pointer",
          fontFamily,
          fontSize: compact ? "12px" : "13px",
          fontWeight: value === ALL_BRANDS ? 400 : 500,
          lineHeight: 1,
          overflow: "hidden",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedLabel}</span>
        <ChevronDown size={14} color="rgba(255,255,255,0.42)" style={{ flexShrink: 0 }} />
      </button>

      {open && pos && createPortal(
        <div
          ref={popRef}
          role="listbox"
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            width: compact ? 318 : 340,
            maxWidth: "calc(100vw - 32px)",
            padding: "12px",
            borderRadius: "16px",
            background: "rgba(20,20,20,0.96)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 18px 50px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.08)",
            backdropFilter: "blur(22px)",
            WebkitBackdropFilter: "blur(22px)",
            zIndex: 1000,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", marginBottom: "10px" }}>
            <Search size={14} color="rgba(255,255,255,0.35)" />
            <input
              value={query}
              onChange={e => updateQuery(e.target.value)}
              placeholder="搜索品牌，或用 A-Z 快速定位"
              style={{
                flex: 1,
                minWidth: 0,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#fff",
                fontSize: "12px",
                fontFamily,
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "4px", overflowX: "auto", paddingBottom: "8px", marginBottom: "6px" }}>
            {letters.map(l => (
              <button
                key={l}
                ref={el => { letterRefs.current[l] = el; }}
                type="button"
                onClick={() => setLetter(l)}
                style={{
                  minWidth: l === ALL_BRANDS ? 44 : 26,
                  height: 24,
                  border: "none",
                  borderRadius: "9999px",
                  background: letter === l ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.05)",
                  color: letter === l ? "#fff" : "rgba(255,255,255,0.46)",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontFamily,
                  flexShrink: 0,
                }}
              >
                {l}
              </button>
            ))}
          </div>

          <div key={`${activeLetter}:${q}`} style={{ maxHeight: 288, overflowY: "auto", paddingRight: "2px" }}>
            <button
              type="button"
              onClick={() => choose(ALL_BRANDS)}
              style={{
                width: "100%",
                minHeight: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                border: "none",
                borderRadius: "10px",
                background: value === ALL_BRANDS ? "rgba(255,255,255,0.12)" : "transparent",
                color: "#fff",
                cursor: "pointer",
                fontFamily,
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 500 }}>全部品牌</span>
              {value === ALL_BRANDS && <Check size={14} color="rgba(255,255,255,0.65)" />}
            </button>

            {filtered.map(b => {
              const active = value === b.name;
              return (
                <button
                  key={b.slug || b.name}
                  type="button"
                  onClick={() => choose(b.name)}
                  style={{
                    width: "100%",
                    minHeight: 42,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                    padding: "8px 10px",
                    border: "none",
                    borderRadius: "10px",
                    background: active ? "rgba(255,255,255,0.12)" : "transparent",
                    color: active ? "#fff" : "rgba(255,255,255,0.72)",
                    cursor: "pointer",
                    fontFamily,
                    textAlign: "left",
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</span>
                    {b.nameCn && <span style={{ display: "block", fontSize: "10px", color: "rgba(255,255,255,0.36)", marginTop: "2px" }}>{b.nameCn}</span>}
                  </span>
                  {active && <Check size={14} color="rgba(255,255,255,0.65)" style={{ flexShrink: 0 }} />}
                </button>
              );
            })}

            {filtered.length === 0 && (
              <div style={{ padding: "18px 10px", fontSize: "12px", color: "rgba(255,255,255,0.38)", fontFamily }}>
                未找到匹配品牌
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
