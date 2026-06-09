# Phase 1 — 인증 + 로그인 페이지 (이메일 / 카카오)

> 선행: [00-db-schema.md](./00-db-schema.md) · 후행: 02~05 전부

## 목표

Supabase Auth로 **이메일/비밀번호 + 카카오 소셜 로그인**을 붙이고, 앱 전역에서 세션·역할을
알 수 있게 한다. 로그인/회원가입 페이지, 보호 라우트, 세션 반영 헤더를 만든다.

완료 후: 로그인하면 헤더가 프로필 메뉴로 바뀌고, 비로그인 상태로 `/academy/my`나
`/academy-expert/*`에 가면 `/auth`로 리다이렉트된다.

## 산출물 (새 파일)

### `src/lib/auth.tsx` — AuthProvider + useAuth
- 상태: `session`, `user`, `profile`(`{ role, expert_id, display_name }`), `loading`.
- 마운트 시: `supabase.auth.getSession()` → 이후 `supabase.auth.onAuthStateChange` 구독.
  세션이 있으면 `profiles`에서 `role`/`expert_id`/`display_name` 조회해 노출.
- 노출 메서드:
  - `signInWithPassword(email, password)`
  - `signUp(email, password, displayName)` — `options.data.name = displayName` 전달(트리거가 display_name으로 사용).
  - `signInWithKakao()` = `supabase.auth.signInWithOAuth({ provider: 'kakao', options: { redirectTo: window.location.origin + '/auth/callback' } })`
  - `signOut()`
- `supabase`가 null(미설정)일 때 가드: 로그인 비활성 안내.

```tsx
// 골격 (실제 구현 시 살 붙이기)
const AuthContext = createContext<AuthCtx | null>(null)
export function AuthProvider({ children }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !session) { setProfile(null); return }
    supabase.from('profiles').select('role, expert_id, display_name')
      .eq('id', session.user.id).single()
      .then(({ data }) => setProfile(data))
  }, [session])
  // signInWithPassword / signUp / signInWithKakao / signOut ...
}
export const useAuth = () => useContext(AuthContext)!
```

### `src/pages/AuthPage.tsx` — 로그인/회원가입 (`/auth`)
- `mode` 토글: 로그인 ↔ 회원가입.
- 필드: 이메일, 비밀번호 (+ 회원가입 시 이름). 에러 메시지 표시.
- **"카카오로 시작하기"** 버튼(카카오 노랑 `#FEE500`, 검정 텍스트).
- 성공 시 `returnTo` 쿼리(없으면 `/academy/my`)로 `navigate`.
- 기존 violet 브랜드 톤(`AcademyLayout`)과 통일. 라운드 풀, 보라 그라데이션 CTA.

### `src/pages/AuthCallback.tsx` — OAuth 복귀 (`/auth/callback`)
- `detectSessionInUrl: true`가 이미 설정되어 SPA가 해시/쿼리를 처리.
- 안전을 위해: URL에 `code`가 있으면 `supabase.auth.exchangeCodeForSession(window.location.href)` 시도.
- 세션 확정 후 저장된 `returnTo`(localStorage) 또는 `/academy/my`로 리다이렉트. 처리 중 스피너.

### `src/components/ProtectedRoute.tsx`
```tsx
export function ProtectedRoute({ children, requireExpert = false }) {
  const { session, profile, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <FullScreenSpinner />
  if (!session) return <Navigate to={`/auth?returnTo=${encodeURIComponent(loc.pathname)}`} replace />
  if (requireExpert && !(profile?.role === 'expert' && profile.expert_id))
    return <Navigate to="/academy" replace />
  return children
}
```

## 수정 파일

### `src/main.tsx`
- 트리를 `<AuthProvider>`로 감싼다. (Router 위치 확인 — App이 Router를 mount하면 AuthProvider는 Router 안/밖 어디든 가능하나, `useNavigate`를 쓰는 AuthPage 때문에 Router 안에 두는 게 안전.)

### `src/App.tsx`
- 라우트 추가: `/auth` → `AuthPage`, `/auth/callback` → `AuthCallback`.
- `/academy/my` → `<ProtectedRoute><AcademyMyPage/></ProtectedRoute>`.
- `/academy-expert/*` (dashboard, courses/new, courses/:id/edit) → `<ProtectedRoute requireExpert>...`.

### `src/components/AcademyLayout.tsx` (43~56줄 유틸 영역)
- `useAuth()` 사용.
- **비로그인**: "로그인" → `Link to="/auth"`, "시작하기" → `/auth?mode=signup`.
- **로그인**: 프로필 버튼(이니셜/이모지) + 드롭다운 — "내 강의"(`/academy/my`),
  `role==='expert'`이면 "지도자 대시보드"(`/academy-expert/dashboard`), "로그아웃"(`signOut()`).
- "주문/결제" → `/academy/my`(주문 탭).

## 코드 외 설정 (Supabase 대시보드 + 카카오 개발자)

1. **Authentication → Providers → Email**: 활성(기본). 개발 중엔 "Confirm email" 끄면 테스트 빠름.
2. **Authentication → Providers → Kakao**: 활성. 카카오 개발자 콘솔의
   **REST API 키 = Client ID**, **보안 Client Secret = Client Secret** 입력.
3. **카카오 개발자 콘솔**(developers.kakao.com):
   - 앱 생성 → 카카오 로그인 활성화.
   - **Redirect URI** 등록: `https://<project-ref>.supabase.co/auth/v1/callback`.
   - 동의 항목: `account_email`, `profile_nickname` 허용.
4. **Authentication → URL Configuration → Redirect URLs**:
   `http://localhost:5173/**` 와 운영 도메인 추가.

## 검증

1. 이메일 회원가입 → 로그인 → 헤더가 프로필 메뉴로 바뀜.
2. 새로고침해도 세션 유지(`persistSession`).
3. "카카오로 시작하기" → 카카오 동의 → `/auth/callback` → `/academy/my` 복귀, 세션 생성.
4. 비로그인으로 `/academy/my` 접근 → `/auth?returnTo=/academy/my`로 이동, 로그인 후 원래 경로 복귀.
5. 일반 유저로 `/academy-expert/dashboard` 접근 → `/academy`로 리다이렉트.
6. service role로 전문가 승격한 계정은 헤더에 "지도자 대시보드" 노출 + 대시보드 접근 가능.
7. `npm run build` 통과.
