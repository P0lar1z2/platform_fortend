// PDF 4.3 决策信号映射 —— 后端系统标签绝不直显，必走此处

export type DecisionKey = "ALERT" | "BUY" | "SKIP" | "LOSS" | "InsufficientData";

export interface DecisionMeta {
  label: string;
  color: string;
  bg: string;
}

const DECISION_TABLE: Record<DecisionKey, DecisionMeta> = {
  ALERT: { label: "强烈推荐", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  BUY: { label: "值得关注", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  SKIP: { label: "暂不推荐", color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.05)" },
  LOSS: { label: "亏损", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  InsufficientData: { label: "数据不足", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
};

export function decisionMeta(key: DecisionKey | string | null | undefined): DecisionMeta {
  if (!key) return DECISION_TABLE.InsufficientData;
  return DECISION_TABLE[key as DecisionKey] ?? DECISION_TABLE.InsufficientData;
}

// PDF 估价级别映射 —— 摘要卡片底部小字
export type ValuationLevel = "L1" | "L2" | "L3" | "L4" | null;

export function valuationLevelLabel(level: ValuationLevel | string | null | undefined): string {
  switch (level) {
    case "L1": return "精准估价";
    case "L2": return "近期参考";
    case "L3": return "成色推导";
    case "L4": return "附件推导";
    default: return "数据不足";
  }
}

// PDF 首页搜索历史 —— 中文 2 字符，英数 1 字符，超 20 字符截断加 ...
export function truncate20(input: string, maxWeight = 20): string {
  let weight = 0;
  let out = "";
  for (const ch of input) {
    const w = /[一-鿿　-〿＀-￯]/.test(ch) ? 2 : 1;
    if (weight + w > maxWeight) return out + "…";
    weight += w;
    out += ch;
  }
  return out;
}
