import { createContext, useContext, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as authApi from '../api/auth'
import type { User } from '../types'

interface AuthValue {
  user: User | null
  isLoading: boolean
  login: (i: authApi.LoginInput) => Promise<User>
  register: (i: authApi.RegisterInput) => Promise<User>
  logout: () => Promise<void>
  refresh: () => Promise<unknown>
}

const Ctx = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const meQ = useQuery({ queryKey: ['me'], queryFn: authApi.me, staleTime: Infinity })

  const loginM = useMutation({
    mutationFn: authApi.login,
    onSuccess: (u) => {
      qc.clear()
      qc.setQueryData(['me'], u)
    },
  })
  const registerM = useMutation({
    mutationFn: authApi.register,
    onSuccess: (u) => {
      qc.clear()
      qc.setQueryData(['me'], u)
    },
  })
  const logoutM = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      qc.clear()
      qc.setQueryData(['me'], null)
    },
  })

  const value: AuthValue = {
    user: meQ.data ?? null,
    isLoading: meQ.isLoading,
    login: loginM.mutateAsync,
    register: registerM.mutateAsync,
    logout: logoutM.mutateAsync,
    refresh: () => qc.invalidateQueries(),
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used inside AuthProvider')
  return v
}
