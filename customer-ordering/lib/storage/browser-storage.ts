export interface KeyValueStorage { get<T>(key: string): T | null; set<T>(key: string, value: T): void; remove(key: string): void; }

export class BrowserStorage implements KeyValueStorage {
  private readonly memory = new Map<string, string>();
  private get localStorage(): Storage | null { return typeof window === "undefined" ? null : window.localStorage; }
  get<T>(key: string): T | null {
    const raw = this.localStorage?.getItem(key) ?? this.memory.get(key) ?? null;
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { this.remove(key); return null; }
  }
  set<T>(key: string, value: T): void {
    const serialized = JSON.stringify(value);
    const storage = this.localStorage;
    if (storage) storage.setItem(key, serialized); else this.memory.set(key, serialized);
  }
  remove(key: string): void { this.localStorage?.removeItem(key); this.memory.delete(key); }
}
