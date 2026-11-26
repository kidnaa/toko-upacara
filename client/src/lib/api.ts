const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const TOKEN_KEY = 'toko_token'
const USER_KEY = 'toko_user'

export type AuthUser = { id: number; name: string; email: string; role: string }

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // abaikan jika penyimpanan browser tidak tersedia
  }
}

export function getUser(): AuthUser | null {
  try {
    const value = localStorage.getItem(USER_KEY)
    return value ? JSON.parse(value) as AuthUser : null
  } catch {
    return null
  }
}

export function setUser(user: AuthUser | null) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_KEY)
  } catch {
    // abaikan jika penyimpanan browser tidak tersedia
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.message ?? 'Terjadi kesalahan')
  }
  return data as T
}