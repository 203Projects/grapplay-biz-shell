import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES, Category } from '../data/mock'
import { useBizData } from '../lib/useBizData'

type Filter = '전체' | Category

export default function AcademyExperts() {
  const { experts, getExpertStats } = useBizData()
  const [filter, setFilter] = useState<Filter>('전체')

  const list = experts.filter((e) => {
    if (filter === '전체') return true
    return getExpertStats(e.id).categories.includes(filter)
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-black text-stone-900">전문가</h1>
      <p className="mt-2 text-stone-500">현장에서 검증된 체육관 비즈니스 전문가를 만나보세요</p>

      {/* 카테고리 필터 */}
      <div className="mt-6 flex flex-wrap gap-2">
        {(['전체', ...CATEGORIES.map((c) => c.key)] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === f
                ? 'bg-stone-900 text-white'
                : 'border border-stone-300 bg-white text-stone-600 hover:bg-stone-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 전문가 카드 그리드 */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((e) => {
          const s = getExpertStats(e.id)
          return (
            <Link
              key={e.id}
              to={`/academy/experts/${e.id}/reviews`}
              className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-200/60"
            >
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-amber-100 text-4xl">
                  {e.avatar}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900 group-hover:text-amber-700">
                    {e.name}
                  </h3>
                  <p className="text-sm font-medium text-amber-600">{e.title}</p>
                </div>
              </div>

              <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-stone-500">{e.bio}</p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {s.categories.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600"
                  >
                    {c}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-4 border-t border-stone-100 pt-4 text-sm text-stone-500">
                <span className="font-semibold text-stone-700">⭐ {s.rating.toFixed(1)}</span>
                <span>리뷰 {s.reviewCount}</span>
                <span>강의 {s.courseCount}</span>
                <span className="ml-auto text-amber-600 group-hover:underline">리뷰 보기 →</span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* 전문가 진입 배너 (대시보드 진입점, md §3.6) */}
      <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-3xl bg-stone-900 px-6 py-8 text-white sm:flex-row sm:items-center sm:px-10">
        <div>
          <h2 className="text-xl font-black">체육관 비즈니스 전문가이신가요?</h2>
          <p className="mt-1 text-sm text-stone-300">
            강의를 올리고 수익을 관리하는 전문가 대시보드로 이동하세요.
          </p>
        </div>
        <Link
          to="/academy-expert/dashboard"
          className="shrink-0 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 font-bold text-stone-900 hover:opacity-90"
        >
          전문가 대시보드 →
        </Link>
      </div>
    </div>
  )
}
