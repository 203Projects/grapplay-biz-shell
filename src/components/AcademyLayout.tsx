import { Link, NavLink, useLocation } from 'react-router-dom'

const NAV = [
  { to: '/academy/library', label: '강의 둘러보기' },
  { to: '/academy/experts', label: '전문가' },
  { to: '/academy/pricing', label: '요금제' },
  { to: '/academy/my', label: '내 강의' },
]

export default function AcademyLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      {/* 상단 네비게이션 */}
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-stone-50/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/academy" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white font-black">
              G
            </span>
            <span className="text-lg font-black tracking-tight">
              그래플레이 <span className="text-amber-600">비즈</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-amber-100 text-amber-700'
                      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button className="hidden rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 sm:block">
              로그인
            </button>
            <button className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800">
              시작하기
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* 모바일 하단 탭 */}
      <nav className="sticky bottom-0 z-40 grid grid-cols-4 border-t border-stone-200 bg-stone-50/90 backdrop-blur md:hidden">
        {[
          { to: '/academy', label: '홈', icon: '🏠' },
          { to: '/academy/library', label: '강의', icon: '📚' },
          { to: '/academy/pricing', label: '요금제', icon: '💳' },
          { to: '/academy/my', label: '내 강의', icon: '👤' },
        ].map((t) => {
          const active = t.to === '/academy' ? pathname === '/academy' : pathname.startsWith(t.to)
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`flex flex-col items-center gap-0.5 py-2 text-xs ${
                active ? 'text-amber-600' : 'text-stone-500'
              }`}
            >
              <span className="text-base">{t.icon}</span>
              {t.label}
            </Link>
          )
        })}
      </nav>

      {/* 푸터 */}
      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-black text-white">
                  G
                </span>
                <span className="font-black">그래플레이 비즈</span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-stone-500">
                체육관 운영자와 지도자를 위한 비즈니스 교육 플랫폼.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
              <FooterCol title="서비스" items={['강의 둘러보기', '요금제', '전문가 되기']} />
              <FooterCol title="회사" items={['소개', '공지사항', 'FAQ']} />
              <FooterCol title="문의" items={['고객센터', '제휴 문의', '이용약관']} />
            </div>
          </div>
          <div className="mt-8 border-t border-stone-100 pt-6 text-xs text-stone-400">
            © 2026 Grapplay Biz. 본 사이트는 디자인 시안(껍데기)입니다.
          </div>
        </div>
      </footer>
    </div>
  )
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="mb-3 font-semibold text-stone-900">{title}</h4>
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i}>
            <span className="cursor-pointer text-stone-500 hover:text-amber-600">{i}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
