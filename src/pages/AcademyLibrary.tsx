import { useState } from 'react'
import { CATEGORIES, COURSES, Category } from '../data/mock'
import CourseCard from '../components/CourseCard'

type Filter = '전체' | Category
type Sort = '인기순' | '최신순' | '가격 낮은순'

export default function AcademyLibrary() {
  const [filter, setFilter] = useState<Filter>('전체')
  const [sort, setSort] = useState<Sort>('인기순')
  const [query, setQuery] = useState('')

  let list = COURSES.filter((c) => filter === '전체' || c.category === filter).filter(
    (c) =>
      query.trim() === '' ||
      c.title.includes(query) ||
      c.subtitle.includes(query),
  )

  list = [...list].sort((a, b) => {
    if (sort === '인기순') return b.studentCount - a.studentCount
    if (sort === '가격 낮은순') return a.price - b.price
    return 0 // 최신순 — 목업이라 기본 순서 유지
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-black text-stone-900">강의 둘러보기</h1>
      <p className="mt-2 text-stone-500">체육관 경영에 필요한 모든 강의를 한곳에서</p>

      {/* 검색 */}
      <div className="mt-6">
        <div className="relative max-w-md">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
            🔍
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="강의 제목으로 검색"
            className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
        </div>
      </div>

      {/* 필터 + 정렬 */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
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
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-600 outline-none focus:border-amber-400"
        >
          <option>인기순</option>
          <option>최신순</option>
          <option>가격 낮은순</option>
        </select>
      </div>

      {/* 결과 */}
      <p className="mt-6 text-sm text-stone-500">총 {list.length}개 강의</p>

      {list.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-stone-300 bg-white py-20 text-center">
          <div className="text-4xl">🔍</div>
          <p className="mt-4 font-semibold text-stone-700">검색 결과가 없어요</p>
          <p className="mt-1 text-sm text-stone-500">다른 키워드나 카테고리로 찾아보세요.</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      )}
    </div>
  )
}
