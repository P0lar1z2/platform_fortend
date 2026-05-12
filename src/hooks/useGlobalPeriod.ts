import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export type Period = "1M" | "3M" | "6M" | "1Y" | "All";
export const PERIODS: Period[] = ["1M", "3M", "6M", "1Y", "All"];

// PDF 4.2 Section B 全局时间窗口 —— URL query 同步，刷新可还原
export function useGlobalPeriod(defaultPeriod: Period = "3M") {
  const [params, setParams] = useSearchParams();
  const raw = params.get("period");
  const period = (PERIODS.includes(raw as Period) ? raw : defaultPeriod) as Period;

  const setPeriod = useCallback((next: Period) => {
    const np = new URLSearchParams(params);
    np.set("period", next);
    setParams(np, { replace: true });
  }, [params, setParams]);

  return [period, setPeriod] as const;
}
