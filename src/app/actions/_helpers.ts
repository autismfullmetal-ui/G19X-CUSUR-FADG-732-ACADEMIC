export const DEFAULT_PASSWORD = "Demo1234!";

export function num(v: FormDataEntryValue | null): number {
  return Number(v ?? 0);
}

export function str(v: FormDataEntryValue | null): string {
  return String(v ?? "").trim();
}
