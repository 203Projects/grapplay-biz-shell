import { useState } from 'react'
import { type CourseReview } from '../../../data/mock'
import { useBizData, invalidateBizData } from '../../../lib/useBizData'
import { setReviewHidden } from '../../../lib/expertApi'

// 리뷰 관리 — 전체 강의 리뷰 모더레이션(숨김/해제). admin course_reviews UPDATE 정책 사용.
export default function ReviewsTab() {
  const { courseReviews, getCourse, loading } = useBizData()
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [onlyHidden, setOnlyHidden] = useState(false)

  const isHidden = (r: CourseReview) => overrides[r.id] ?? r.hidden

  const onToggle = async (r: CourseReview) => {
    const next = !isHidden(r)
    setBusyId(r.id)
    const { error } = await setReviewHidden(r.id, next)
    setBusyId(null)
    if (error) return alert('변경 실패: ' + error)
    setOverrides((m) => ({ ...m, [r.id]: next }))
    invalidateBizData()
  }

  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-stone-100" />

  const list = onlyHidden ? courseReviews.filter((r) => isHidden(r)) : courseReviews

  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-16 text-center">
        <div className="text-4xl">📝</div>
        <p className="mt-3 font-semibold text-stone-700">표시할 리뷰가 없어요</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm text-stone-600">
        <input type="checkbox" checked={onlyHidden} onChange={(e) => setOnlyHidden(e.target.checked)} />
        숨김 처리된 리뷰만 보기
      </label>
      {list.map((r) => {
        const course = getCourse(r.courseId)
        const hidden = isHidden(r)
        const busy = busyId === r.id
        return (
          <div
            key={r.id}
            className={`rounded-2xl border p-5 ${
              hidden ? 'border-stone-200 bg-stone-50 opacity-70' : 'border-stone-200 bg-white'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-stone-800">{r.userName}</span>
                {r.userEmail && <span className="text-xs text-stone-400">· {r.userEmail}</span>}
                {hidden && (
                  <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[11px] font-semibold text-stone-600">
                    숨김
                  </span>
                )}
              </div>
              <span className="text-xs text-stone-400">{r.createdAt}</span>
            </div>
            <div className="mt-1 text-xs font-medium text-violet-600">{course?.title ?? r.courseId}</div>
            <p className="mt-2 leading-relaxed text-stone-600">{r.content}</p>
            <div className="mt-4">
              <button
                onClick={() => onToggle(r)}
                disabled={busy}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-50"
              >
                {hidden ? '숨김 해제' : '숨기기'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
