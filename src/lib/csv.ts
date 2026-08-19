export function toCsvRow(values: (string | number | null)[]): string {
  return values
    .map((v) => {
      const s = v === null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    })
    .join(",");
}
