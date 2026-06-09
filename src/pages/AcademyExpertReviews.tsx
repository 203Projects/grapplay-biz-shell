import { useParams, Link } from 'react-router-dom'
import { useBizData } from '../lib/useBizData'
import CourseCard from '../components/CourseCard'

function Stars({ n }: { n: number }) {
  return (
    <span className="text-amber-400">
      {'★'.repeat(n)}
      <span className="text-stone-300">{'★'.repeat(5 - n)}</span>
    </span>
  )
}

export default function AcademyExpertReviews() {
  const { expertId } = useParams()
  const { getExpert, getExpertReviews, getExpertStats, getCoursesByExpert, loading } = useBizData()
  const expert = getExpert(expertId ?? '')

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="h-40 animate-pulse rounded-3xl bg-stone-100" />
      </div>
    )
  }

  if (!expert) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="text-5xl">🤔</div>
        <h1 className="mt-4 text-2xl font-bold text-stone-900">전문가를 찾을 수 없어요</h1>
        <Link
          to="/experts"
          className="mt-6 inline-block rounded-xl bg-stone-900 px-6 py-3 font-semibold text-white"
        >
          전문가 목록으로
        </Link>
      </div>
    )
  }

  const stats = getExpertStats(expert.id)
  const reviews = getExpertReviews(expert.id)
  const courses = getCoursesByExpert(expert.id)

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link to="/experts" className="text-sm text-stone-500 hover:text-amber-600">
        ← 전문가 목록
      </Link>

      {/* 프로필 */}
      <div className="mt-4 flex flex-col items-start gap-5 rounded-3xl border border-stone-200 bg-white p-6 sm:flex-row sm:items-center">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-amber-100 text-5xl">
          {expert.avatar}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-stone-900">{expert.name}</h1>
          <p className="font-medium text-amber-600">{expert.title}</p>
          <p className="mt-2 text-sm leading-relaxed text-stone-500">{expert.bio}</p>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <div className="text-2xl font-black text-stone-900">{stats.rating.toFixed(1)}</div>
            <div className="text-xs text-stone-500">평균 평점</div>
          </div>
          <div>
            <div className="text-2xl font-black text-stone-900">{stats.reviewCount}</div>
            <div className="text-xs text-stone-500">리뷰</div>
          </div>
          <div>
            <div className="text-2xl font-black text-stone-900">{stats.courseCount}</div>
            <div className="text-xs text-stone-500">강의</div>
          </div>
        </div>
      </div>

      {/* 전문가 강의 */}
      <h2 className="mt-10 text-xl font-black text-stone-900">강의</h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        {courses.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
      </div>

      {/* 리뷰 */}
      <h2 className="mt-10 text-xl font-black text-stone-900">수강생 리뷰 ({reviews.length})</h2>
      {reviews.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-white py-16 text-center">
          <div className="text-4xl">✍️</div>
          <p className="mt-3 font-semibold text-stone-700">아직 등록된 리뷰가 없어요</p>
          <p className="mt-1 text-sm text-stone-500">첫 리뷰의 주인공이 되어보세요.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-stone-100 text-sm">
                    🙂
                  </span>
                  <span className="text-sm font-semibold text-stone-800">{r.userName}</span>
                </div>
                <span className="text-xs text-stone-400">{r.createdAt}</span>
              </div>
              <div className="mt-2 text-sm">
                <Stars n={r.rating} />
              </div>
              <p className="mt-2 leading-relaxed text-stone-600">{r.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
