import type { ChangedEntry, DiffResult, EnvMap } from "../types.js";

function mapToArray(map: EnvMap): Array<{ key: string; value: string; line?: number }> {
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, entry]) => ({ key, value: entry.value, line: entry.line }));
}

export function diffEnvMaps(mapA: EnvMap, mapB: EnvMap): DiffResult {
  const added: DiffResult["added"] = [];
  const removed: DiffResult["removed"] = [];
  const changed: ChangedEntry[] = [];
  const unchanged: DiffResult["unchanged"] = [];

  const keysA = new Set(mapA.keys());
  const keysB = new Set(mapB.keys());

  for (const key of keysA) {
    if (!keysB.has(key)) {
      const entry = mapA.get(key)!;
      removed.push({ key, value: entry.value, line: entry.line });
    }
  }

  for (const key of keysB) {
    if (!keysA.has(key)) {
      const entry = mapB.get(key)!;
      added.push({ key, value: entry.value, line: entry.line });
    }
  }

  for (const key of keysA) {
    if (!keysB.has(key)) {
      continue;
    }

    const entryA = mapA.get(key)!;
    const entryB = mapB.get(key)!;

    if (entryA.value === entryB.value) {
      unchanged.push({ key, value: entryA.value });
    } else {
      changed.push({
        key,
        oldValue: entryA.value,
        newValue: entryB.value,
        oldLine: entryA.line,
        newLine: entryB.line,
      });
    }
  }

  added.sort((a, b) => a.key.localeCompare(b.key));
  removed.sort((a, b) => a.key.localeCompare(b.key));
  changed.sort((a, b) => a.key.localeCompare(b.key));
  unchanged.sort((a, b) => a.key.localeCompare(b.key));

  return { added, removed, changed, unchanged };
}

export function diffEnvMapsAsArrays(mapA: EnvMap, mapB: EnvMap) {
  const result = diffEnvMaps(mapA, mapB);
  return {
    ...result,
    allA: mapToArray(mapA),
    allB: mapToArray(mapB),
  };
}
