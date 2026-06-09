import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function AuthPage() {
  const { signInWithPassword, signUp, signInWithKakao, configured } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const returnTo = params.get('returnTo') || '/my'

  const [mode, setMode] = useState<'login' | 'signup'>(
    params.get('mode') === 'signup' ? 'signup' : 'login',
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    if (mode === 'login') {
      const { error } = await signInWithPassword(email, password)
      setBusy(false)
      if (error) return setError(translate(error))
      navigate(returnTo, { replace: true })
    } else {
      const { error } = await signUp(email, password, name.trim())
      setBusy(false)
      if (error) return setError(translate(error))
      // 이메일 확인이 켜져 있으면 세션이 없을 수 있음
      setInfo('가입이 완료됐습니다. 로그인하거나, 이메일 확인이 필요한 경우 메일을 확인하세요.')
      setMode('login')
    }
  }

  const onKakao = async () => {
    setError(null)
    if (returnTo) localStorage.setItem('returnTo', returnTo)
    const { error } = await signInWithKakao()
    if (error) setError(translate(error))
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="text-center">
        <span className="text-2xl font-black tracking-tighter">
          grapplay<span className="text-violet-600">-biz</span>
        </span>
        <h1 className="mt-6 text-xl font-bold text-slate-900">
          {mode === 'login' ? '로그인' : '회원가입'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          체육관 경영자와 지도자를 위한 비즈니스 교육 플랫폼
        </p>
      </div>

      {!configured && (
        <div className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          인증이 아직 설정되지 않았습니다. 환경변수(VITE_SUPABASE_*)를 확인하세요.
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-8 space-y-3">
        {mode === 'signup' && (
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름"
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
          />
        )}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호 (6자 이상)"
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
        />

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {info && <p className="text-sm text-emerald-600">{info}</p>}

        <button
          type="submit"
          disabled={busy || !configured}
          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 px-4 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {busy ? '처리 중…' : mode === 'login' ? '로그인' : '회원가입'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        또는
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        onClick={onKakao}
        disabled={!configured}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-4 py-3 font-semibold text-[#191600] hover:opacity-90 disabled:opacity-50"
      >
        <span>💬</span> 카카오로 시작하기
      </button>

      <p className="mt-6 text-center text-sm text-slate-500">
        {mode === 'login' ? '아직 계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
        <button
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login')
            setError(null)
            setInfo(null)
          }}
          className="font-semibold text-violet-600 hover:underline"
        >
          {mode === 'login' ? '회원가입' : '로그인'}
        </button>
      </p>

      <Link to="/" className="mt-4 text-center text-xs text-slate-400 hover:text-slate-600">
        ← 홈으로
      </Link>
    </div>
  )
}

// Supabase 영어 에러를 한국어로 간단 변환
function translate(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않습니다.'
  if (m.includes('user already registered')) return '이미 가입된 이메일입니다.'
  if (m.includes('email not confirmed')) return '이메일 확인이 필요합니다. 메일함을 확인하세요.'
  if (m.includes('password should be at least')) return '비밀번호는 6자 이상이어야 합니다.'
  return msg
}
