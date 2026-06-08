import { Link } from 'react-router-dom'
import { CATEGORIES, COURSES, EXPERTS } from '../data/mock'
import CourseCard from '../components/CourseCard'

export default function AcademyLanding() {
  const featured = COURSES.slice(0, 3)

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-stone-200 bg-gradient-to-b from-amber-50 to-stone-50">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
              🥋 체육관 운영자를 위한
            </span>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-stone-900 sm:text-5xl">
              운동은 가르치지만,
              <br />
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                경영은 누가 가르쳐주나요?
              </span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-stone-600">
              마케팅·상권분석·연금·운영까지. 현장에서 검증된 전문가가 알려주는
              체육관 비즈니스 교육, 그래플레이 비즈.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/academy/library"
                className="rounded-xl bg-stone-900 px-6 py-3 font-semibold text-white hover:bg-stone-800"
              >
                강의 둘러보기
              </Link>
              <Link
                to="/academy/pricing"
                className="rounded-xl border border-stone-300 bg-white px-6 py-3 font-semibold text-stone-700 hover:bg-stone-100"
              >
                요금제 보기
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-stone-500">
              <Stat value="2,000+" label="수강생" />
              <Stat value="4종" label="전문 분야" />
              <Stat value="4.8★" label="평균 만족도" />
            </div>
          </div>

          {/* Hero 비주얼 */}
          <div className="relative hidden md:block">
            <div className="absolute -left-6 top-8 h-40 w-64 rotate-[-6deg] rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-5 text-white shadow-xl">
              <div className="text-3xl">📣</div>
              <div className="mt-2 font-bold">첫 100명 회원 만들기</div>
              <div className="mt-1 text-sm text-white/80">마케팅 · 12강</div>
            </div>
            <div className="absolute right-0 top-0 h-40 w-60 rotate-[5deg] rounded-2xl bg-white p-5 shadow-xl">
              <div className="text-3xl">📍</div>
              <div className="mt-2 font-bold text-stone-900">데이터로 고르는 입지</div>
              <div className="mt-1 text-sm text-stone-500">상권분석 · 9강</div>
            </div>
            <div className="absolute bottom-0 left-12 h-40 w-60 rotate-[3deg] rounded-2xl bg-stone-900 p-5 text-white shadow-xl">
              <div className="text-3xl">🏋️</div>
              <div className="mt-2 font-bold">회원 이탈 막는 운영</div>
              <div className="mt-1 text-sm text-white/70">체육관 운영 · 14강</div>
            </div>
            <div className="h-80" />
          </div>
        </div>
      </section>

      {/* 카테고리 */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-black text-stone-900">무엇을 배우고 싶으세요?</h2>
        <p className="mt-2 text-stone-500">체육관 경영에 꼭 필요한 4가지 분야</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.key}
              to="/academy/library"
              className="group rounded-2xl border border-stone-200 bg-white p-6 transition hover:border-amber-300 hover:shadow-md"
            >
              <div className="text-4xl">{c.emoji}</div>
              <h3 className="mt-4 text-lg font-bold text-stone-900 group-hover:text-amber-700">
                {c.key}
              </h3>
              <p className="mt-1 text-sm text-stone-500">{c.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 추천 강의 */}
      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-black text-stone-900">지금 인기 있는 강의</h2>
              <p className="mt-2 text-stone-500">관장님들이 가장 많이 찾는 코스</p>
            </div>
            <Link
              to="/academy/library"
              className="hidden text-sm font-semibold text-amber-600 hover:underline sm:block"
            >
              전체 보기 →
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </div>
      </section>

      {/* 전문가 */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-black text-stone-900">현장 전문가가 직접 가르칩니다</h2>
        <p className="mt-2 text-stone-500">이론이 아니라 실전에서 검증된 노하우</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EXPERTS.map((e) => (
            <div key={e.id} className="rounded-2xl border border-stone-200 bg-white p-6">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-3xl">
                {e.avatar}
              </div>
              <h3 className="mt-4 font-bold text-stone-900">{e.name}</h3>
              <p className="text-sm font-medium text-amber-600">{e.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">{e.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-stone-900 px-6 py-14 text-center text-white sm:px-12">
          <h2 className="text-3xl font-black">체육관 경영, 이제 혼자 고민하지 마세요</h2>
          <p className="mx-auto mt-3 max-w-xl text-stone-300">
            지금 가입하면 무료 강의부터 바로 시청할 수 있어요.
          </p>
          <Link
            to="/academy/library"
            className="mt-8 inline-block rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-8 py-3 font-bold text-stone-900 hover:opacity-90"
          >
            무료로 시작하기
          </Link>
        </div>
      </section>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-xl font-black text-stone-900">{value}</div>
      <div className="text-xs text-stone-500">{label}</div>
    </div>
  )
}
