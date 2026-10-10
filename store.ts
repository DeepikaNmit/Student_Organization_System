// Demo-only persistence. Everything here is replaced when /src/api/*.ts is pointed at the real API.
const PREFIX = 'clustro.demo.'
const memory = new Map<string, string>()

function getRaw(key: string): string | null {
  try {
    const v = localStorage.getItem(PREFIX + key)
    if (v !== null) return v
  } catch {
    /* storage unavailable, fall back to memory */
  }
  return memory.get(key) ?? null
}

function setRaw(key: string, value: string) {
  memory.set(key, value)
  try {
    localStorage.setItem(PREFIX + key, value)
  } catch {
    /* ignore */
  }
}

export function removeKey(key: string) {
  memory.delete(key)
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    /* ignore */
  }
}

export function read<T>(key: string, seed: () => T): T {
  const raw = getRaw(key)
  if (raw) {
    try {
      return JSON.parse(raw) as T
    } catch {
      /* fall through to reseed */
    }
  }
  const value = seed()
  write(key, value)
  return value
}

export function write<T>(key: string, value: T) {
  setRaw(key, JSON.stringify(value))
}

export const wait = (ms = 220) => new Promise<void>((r) => setTimeout(r, ms))

export const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`

export const nowIso = () => new Date().toISOString()
