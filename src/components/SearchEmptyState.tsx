import { useNavigate } from "react-router-dom";

const bd = "'Barlow','Noto Sans SC',sans-serif";

// 推荐搜索词:常见高端表款型号 / 品牌入门检索,等产品给最终列表
const RECOMMENDED_QUERIES = [
  "Submariner",
  "Daytona",
  "GMT-Master",
  "Speedmaster",
  "Nautilus",
  "Royal Oak",
  "Pepsi",
  "126610LN",
];

interface Props {
  query?: string;
}

// PDF 3.1.1.8 兜底页 —— 占位主视觉(暂用 holographic_smoke 512x512,等产品提供 raven_empty_state_warm.png)
// + 推荐搜索标签(点击发起新搜索)
export default function SearchEmptyState({ query }: Props) {
  const navigate = useNavigate();

  function pick(q: string) {
    navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div style={{
      textAlign: "center", padding: "60px 20px 80px",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <img
        src="/empty-state/placeholder.png"
        alt=""
        style={{ maxWidth: "240px", width: "60%", height: "auto", opacity: 0.55, marginBottom: "28px", filter: "saturate(0.4)" }}
      />
      <h3 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "22px", fontWeight: 700, color: "rgba(255,255,255,0.65)", marginBottom: "8px" }}>
        {query ? `未找到与"${query}"匹配的结果` : "未找到匹配结果"}
      </h3>
      <p style={{ fontSize: "13px", fontWeight: 300, color: "rgba(255,255,255,0.35)", fontFamily: bd, marginBottom: "28px" }}>
        换个关键词试试，或者从下面挑一个看看
      </p>

      <div style={{
        display: "flex", flexWrap: "wrap", gap: "8px",
        justifyContent: "center", maxWidth: "520px",
      }}>
        {RECOMMENDED_QUERIES.map(q => (
          <button
            key={q}
            type="button"
            onClick={() => pick(q)}
            style={{
              padding: "6px 14px",
              fontSize: "12px", fontWeight: 400,
              color: "rgba(255,255,255,0.6)",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "9999px",
              cursor: "pointer",
              fontFamily: bd,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              const t = e.currentTarget;
              t.style.background = "rgba(255,255,255,0.08)";
              t.style.color = "rgba(255,255,255,0.85)";
            }}
            onMouseLeave={e => {
              const t = e.currentTarget;
              t.style.background = "rgba(255,255,255,0.04)";
              t.style.color = "rgba(255,255,255,0.6)";
            }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
