import { useCallback, useEffect, useState } from "react";
import { readJSON, writeJSON } from "../lib/storage";

export function useViewPreference<T extends string>(key: string, defaultValue: T) {
  const storageKey = `raventik:view:${key}`;
  const [value, setValue] = useState<T>(() => readJSON<T>(storageKey, defaultValue));

  useEffect(() => {
    writeJSON(storageKey, value);
  }, [storageKey, value]);

  const setPref = useCallback((next: T) => setValue(next), []);

  return [value, setPref] as const;
}
