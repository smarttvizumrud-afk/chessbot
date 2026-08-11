const key = 'chess-closed-analyses';

export function loadClosedAnalyses() {
  const raw = window.localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function closeAnalysis(id: string) {
  const ids = new Set(loadClosedAnalyses());
  ids.add(id);
  window.localStorage.setItem(key, JSON.stringify([...ids]));
}
