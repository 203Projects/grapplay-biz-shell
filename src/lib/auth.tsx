import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from './supabase'

// 프로필(역할/전문가 연결) — profiles 테이블에서 로드
export interface Profile {
  role: 'user' | 'expert' | 'admin'
  expert_id: string | null
  display_name: string | null
}

interface AuthCtx {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  configured: boolean
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>
  signInWithKakao: () => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // 세션 초기화 + 변경 구독
  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // 세션 변경 시 프로필 로드
  useEffect(() => {
    if (!supabase || !session) {
      setProfile(null)
      return
    }
    let cancelled = false
    supabase
      .from('profiles')
      .select('role, expert_id, display_name')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (!cancelled) setProfile((data as Profile) ?? null)
      })
    return () => {
      cancelled = true
    }
  }, [session])

  const signInWithPassword: AuthCtx['signInWithPassword'] = async (email, password) => {
    if (!supabase) return { error: '로그인이 아직 설정되지 않았습니다.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signUp: AuthCtx['signUp'] = async (email, password, displayName) => {
    if (!supabase) return { error: '회원가입이 아직 설정되지 않았습니다.' }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: displayName } },
    })
    return { error: error?.message ?? null }
  }

  const signInWithKakao: AuthCtx['signInWithKakao'] = async () => {
    if (!supabase) return { error: '소셜 로그인이 아직 설정되지 않았습니다.' }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    return { error: error?.message ?? null }
  }

  const signOut: AuthCtx['signOut'] = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  const value: AuthCtx = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    configured: isSupabaseConfigured,
    signInWithPassword,
    signUp,
    signInWithKakao,
    signOut,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
