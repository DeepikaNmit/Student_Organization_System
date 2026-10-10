// Base URL for the future Express backend (/api/v1). The api/*.ts modules currently run against
// in-memory demo data in /src/mocks (persisted to localStorage). To go live, replace each function
// body with a fetch to `${API_URL}/...` — the signatures and types stay the same, so the UI doesn't change.
export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000/api/v1'

export class ApiError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}
