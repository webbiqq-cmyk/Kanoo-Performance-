let counter = 0;

/** Deterministic-enough unique id for demo records (no crypto dependency needed). */
export function makeId(prefix: string): string {
  counter += 1;
  const rand = Math.random().toString(36).slice(2, 7);
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${rand}`;
}

export function makeRef(prefix: string, seq: number): string {
  return `${prefix}-${String(seq).padStart(4, "0")}`;
}
