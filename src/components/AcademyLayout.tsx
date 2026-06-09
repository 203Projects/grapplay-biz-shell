import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

// pudufu식 2줄 헤더 — (1줄) 로고/주문결제/로그인/검색, (2줄) 가운데 카테고리 메뉴바
const MENU = [
  { to: '/library', label: '강의' },
  { to: '/ebooks', label: '전자책' },
  { to: '/experts', label: '전문가' },
  { to: '/my?tab=wishlist', label: '관심 강의' },
]

export default function AcademyLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  // 강의/전자책 상세에서는 하단 고정 구매바와 겹치지 않도록 모바일 하단탭 숨김
  const isReaderDetail = /^\/(courses|ebooks)\//.test(pathname)

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      {/* 상단 헤더 (2줄) */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur">
        {/* 1줄: 로고 / 검색 / 유틸 (데스크톱에선 아래 메뉴줄과 구분선 없이 이어짐) */}
        <div className="border-b border-slate-200 md:border-b-0">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
            <Link to="/" className="shrink-0">
              <span className="text-xl font-black tracking-tighter sm:text-2xl">
                grapplay<span className="text-violet-600">-biz</span>
              </span>
            </Link>

            {/* 검색창 (데스크톱 중앙) */}
            <form
              onSubmit={(e) => e.preventDefault()}
              className="relative hidden min-w-0 flex-1 md:block"
            >
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>
              <input
                placeholder="어떤 강의를 찾으세요?"
                className="w-full rounded-full border border-slate-300 bg-slate-50 py-2.5 pl-11 pr-4 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
              />
            </form>

            <HeaderUtil />
          </div>

          {/* 검색창 (모바일 전용 줄) */}
          <div className="px-4 pb-3 md:hidden">
            <form onSubmit={(e) => e.preventDefault()} className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>
              <input
                placeholder="어떤 강의를 찾으세요?"
                className="w-full rounded-full border border-slate-300 bg-slate-50 py-2.5 pl-11 pr-4 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
              />
            </form>
          </div>
        </div>

        {/* 2줄: 가운데 카테고리 메뉴바 (데스크톱) — 큰 언더라인 탭 */}
        <div className="hidden border-b border-slate-200 md:block">
          <nav className="mx-auto flex max-w-6xl items-center justify-start gap-6 px-4 sm:px-6">
            {MENU.map((m, i) => (
              <NavLink
                key={i}
                to={m.to}
                end
                className={({ isActive }) =>
                  `-mb-px border-b-2 px-1 py-3.5 text-[15px] font-bold tracking-tight transition ${
                    isActive
                      ? 'border-violet-600 text-violet-700'
                      : 'border-transparent text-slate-600 hover:text-violet-600'
                  }`
                }
              >
                {m.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* 모바일 하단 탭 (강의/전자책 상세 제외) */}
      {!isReaderDetail && (
        <nav className="sticky bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white/90 backdrop-blur md:hidden">
          {[
            { to: '/', label: '홈', icon: '🏠' },
            { to: '/library', label: '강의', icon: '📚' },
            { to: '/ebooks', label: '전자책', icon: '📖' },
            { to: '/experts', label: '전문가', icon: '🧑‍🏫' },
            { to: '/my?tab=wishlist', label: '관심', icon: '❤️' },
          ].map((t) => {
            const base = t.to.split('?')[0]
            const active = base === '/' ? pathname === '/' : pathname.startsWith(base)
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`flex flex-col items-center gap-0.5 py-2 text-xs ${
                  active ? 'text-violet-600' : 'text-slate-500'
                }`}
              >
                <span className="text-base">{t.icon}</span>
                {t.label}
              </Link>
            )
          })}
        </nav>
      )}

      {/* 푸터 */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <span className="text-xl font-black tracking-tighter">
                grapplay<span className="text-violet-600">-biz</span>
              </span>
              <p className="mt-3 max-w-xs text-sm text-slate-500">
                체육관 운영자와 지도자를 위한 비즈니스 교육 플랫폼.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
              <FooterCol title="서비스" items={['강의 둘러보기', '전문가', '전문가 되기']} />
              <FooterCol title="회사" items={['소개', '공지사항', 'FAQ']} />
              <FooterCol title="고객지원" items={['문의하기', '이용약관', '개인정보처리방침']} />
            </div>
          </div>

          {/* 사업자 정보 (그래플레이 본사이트와 동일) */}
          <div className="mt-10 space-y-1.5 border-t border-slate-200 pt-8 text-[11px] leading-relaxed text-slate-400">
            <p>
              <strong className="text-slate-500">상호명:</strong> 그래플레이 |{' '}
              <strong className="text-slate-500">대표자:</strong> 이바름
            </p>
            <p>
              <strong className="text-slate-500">사업자등록번호:</strong> 111-39-34149 |{' '}
              <strong className="text-slate-500">통신판매업 신고번호:</strong> 진행 중
            </p>
            <p>
              <strong className="text-slate-500">주소:</strong> 서울 동작구 동작대로29길 119,
              102-1207
            </p>
            <p>
              <strong className="text-slate-500">이메일:</strong> coach0179@naver.com |{' '}
              <strong className="text-slate-500">전화번호:</strong> 02-599-6315
            </p>
          </div>

          <div className="mt-6 text-xs text-slate-400">
            © 2026 Grapplay. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

// 헤더 우측 유틸 — 세션 상태에 따라 로그인 버튼 / 프로필 메뉴 전환
function HeaderUtil() {
  const { session, profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  if (!session) {
    return (
      <div className="ml-auto flex items-center gap-1 text-sm">
        <Link
          to="/auth"
          className="hidden rounded-lg px-3 py-2 font-medium text-slate-600 hover:bg-slate-100 sm:block"
        >
          로그인
        </Link>
        <Link
          to="/auth?mode=signup"
          className="rounded-lg bg-gradient-to-r from-violet-600 to-purple-500 px-4 py-2 font-semibold text-white hover:opacity-90"
        >
          시작하기
        </Link>
      </div>
    )
  }

  const name = profile?.display_name || session.user.email || '회원'
  const initial = name.trim().charAt(0).toUpperCase()

  return (
    <div className="relative ml-auto flex items-center gap-1 text-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-violet-100 font-bold text-violet-700">
          {initial}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            <div className="border-b border-slate-100 px-4 py-2.5">
              <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
              <p className="truncate text-xs text-slate-400">{session.user.email}</p>
            </div>
            <MenuLink to="/my" onClick={() => setOpen(false)}>
              내 강의
            </MenuLink>
            <MenuLink to="/my?tab=orders" onClick={() => setOpen(false)}>
              주문/결제
            </MenuLink>
            {profile?.role === 'expert' && profile.expert_id && (
              <MenuLink to="/expert/dashboard" onClick={() => setOpen(false)}>
                지도자 대시보드
              </MenuLink>
            )}
            {profile?.role === 'admin' && (
              <MenuLink to="/admin" onClick={() => setOpen(false)}>
                관리자 대시보드
              </MenuLink>
            )}
            <button
              onClick={() => {
                setOpen(false)
                signOut()
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-slate-50"
            >
              로그아웃
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function MenuLink({
  to,
  onClick,
  children,
}: {
  to: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
    >
      {children}
    </Link>
  )
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="mb-3 font-semibold text-slate-900">{title}</h4>
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i}>
            <span className="cursor-pointer text-slate-500 hover:text-violet-600">{i}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
