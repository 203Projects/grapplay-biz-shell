import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MY_PURCHASED_IDS } from '../data/mock'
import { useBizData } from '../lib/useBizData'

type Tab = '수강 중' | '관심 강의'

export default function AcademyMyPage() {
  const { courses, getExpert } = useBizData()
  const [tab, setTab] = useState<Tab>('수강 중')

  const purchased = courses.filter((c) => MY_PURCHASED_IDS.includes(c.id))
  // 관심 강의는 껍데기라 빈 상태 데모
  const list = tab === '수강 중' ? purchased : []

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* 프로필 헤더 */}
      <div className="flex items-center gap-4 rounded-3xl border border-stone-200 bg-white p-6">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-3xl">
          🥋
        </div>
        <div>
          <h1 className="text-xl font-black text-stone-900">관장님, 환영합니다</h1>
          <p className="text-sm text-stone-500">grapplay.com@gmail.com</p>
        </div>
        <div className="ml-auto hidden gap-6 text-center sm:flex">
          <div>
            <div className="text-2xl font-black text-stone-900">{purchased.length}</div>
            <div className="text-xs text-stone-500">수강 강의</div>
          </div>
          <div>
            <div className="text-2xl font-black text-stone-900">42%</div>
            <div className="text-xs text-stone-500">평균 진도</div>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="mt-8 flex gap-1 border-b border-stone-200">
        {(['수강 중', '관심 강의'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition ${
              tab === t
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 목록 / 빈 상태 */}
      {list.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-stone-300 bg-white py-20 text-center">
          <div className="text-5xl">📚</div>
          <p className="mt-4 text-lg font-bold text-stone-800">
            {tab === '수강 중' ? '아직 수강 중인 강의가 없어요' : '관심 강의가 비어 있어요'}
          </p>
          <p className="mt-1 text-sm text-stone-500">
            마음에 드는 강의를 찾아 학습을 시작해 보세요.
          </p>
          <Link
            to="/academy/library"
            className="mt-6 inline-block rounded-xl bg-stone-900 px-6 py-3 font-semibold text-white hover:bg-stone-800"
          >
            강의 둘러보기
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {list.map((c) => {
            const expert = getExpert(c.expertId)
            const progress = c.id === 'c1' ? 65 : 20 // 목업 진도
            return (
              <Link
                key={c.id}
                to={`/academy/courses/${c.id}`}
                className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4 transition hover:shadow-md sm:items-center"
              >
                <div
                  className={`grid h-20 w-28 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${c.cover} text-3xl`}
                >
                  {c.thumbEmoji}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-amber-600">{c.category}</div>
                  <h3 className="mt-0.5 font-bold text-stone-900">{c.title}</h3>
                  <p className="text-xs text-stone-500">
                    {expert?.avatar} {expert?.name}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-stone-500">{progress}%</span>
                  </div>
                </div>
                <div className="hidden items-center sm:flex">
                  <span className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white">
                    이어보기
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
