import { useParams, Link } from 'react-router-dom'
import { formatPrice } from '../data/mock'
import { useBizData } from '../lib/useBizData'
import CourseCard from '../components/CourseCard'
import PurchaseBar from '../components/PurchaseBar'
import {
  getCourseMeta,
  discountPct,
  EXPERT_CREDENTIALS,
  pseudoRating,
  maskName,
} from '../data/mockMarketplace'

const NOTICES = [
  '결제 후 강의는 마이페이지 > 내 강의에서 바로 수강할 수 있습니다.',
  '강의 콘텐츠의 무단 복제·배포·공유는 저작권법에 의해 금지됩니다.',
  '강의는 지속적으로 업데이트되며, 추가 비용 없이 시청할 수 있습니다.',
  '환불은 그래플레이 환불정책에 따라 처리됩니다. 자세한 내용은 고객센터로 문의해 주세요.',
  '수강 기한이 있는 강의는 기한 종료 후 시청이 제한될 수 있습니다.',
]

const TABS = [
  { id: 'intro', label: '소개' },
  { id: 'curriculum', label: '커리큘럼' },
  { id: 'expert', label: '강사소개' },
  { id: 'reviews', label: '후기' },
]

export default function AcademyCourseDetail() {
  const { id } = useParams()
  const { getCourse, getExpert, getCoursesByExpert, getCourseReviews, loading } = useBizData()
  const course = getCourse(id ?? '')

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
        <div className="mt-8 h-8 w-1/2 animate-pulse rounded bg-slate-100" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="text-5xl">🤔</div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">강의를 찾을 수 없어요</h1>
        <Link
          to="/academy/library"
          className="mt-6 inline-block rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white"
        >
          강의 목록으로
        </Link>
      </div>
    )
  }

  const expert = getExpert(course.expertId)
  const meta = getCourseMeta(course.id)
  const off = discountPct(course.price, meta.originalPrice)
  const isPaid = course.price > 0
  const credentials = EXPERT_CREDENTIALS[course.expertId] ?? []
  const reviews = getCourseReviews(course.id)
  const related = getCoursesByExpert(course.expertId).filter((c) => c.id !== course.id)

  return (
    <div className="pb-28">
      {/* 1. 히어로 */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 md:py-14">
          <div
            className={`grid aspect-video place-items-center rounded-2xl bg-gradient-to-br ${course.cover} text-7xl`}
          >
            {course.thumbEmoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-700">
                {course.category}
              </span>
              {meta.isNew && (
                <span className="rounded-full bg-violet-600 px-2.5 py-1 text-xs font-bold text-white">
                  NEW
                </span>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-black leading-tight text-slate-900 sm:text-3xl">
              {course.title}
            </h1>
            <p className="mt-2 text-slate-600">{course.subtitle}</p>

            {expert && (
              <div className="mt-4 flex items-center gap-2 text-sm">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-violet-100 text-base">
                  {expert.avatar}
                </span>
                <span className="font-semibold text-slate-700">{expert.name}</span>
                <span className="text-slate-400">· {expert.title}</span>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="font-semibold text-amber-400">
                ★ <span className="text-slate-700">{course.rating.toFixed(1)}</span>
              </span>
              <span>· 구매 {course.studentCount.toLocaleString()}명</span>
              <span>· {course.lessonCount}강 · {Math.round(course.durationMin / 60)}시간</span>
            </div>

            <div className="mt-5 flex items-end gap-2">
              {off && (
                <>
                  <span className="text-lg font-bold text-rose-500">{off}%</span>
                  <span className="mb-0.5 text-slate-400 line-through">
                    ₩{meta.originalPrice!.toLocaleString()}
                  </span>
                </>
              )}
              <span
                className={`text-3xl font-black ${isPaid ? 'text-slate-900' : 'text-emerald-600'}`}
              >
                {formatPrice(course.price)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 스티키 앵커 탭 */}
      <nav className="sticky top-[7.25rem] z-30 border-b border-slate-200 bg-white/90 backdrop-blur md:top-[7rem]">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6">
          {TABS.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className="whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-sm font-medium text-slate-600 hover:border-violet-500 hover:text-violet-600"
            >
              {t.label}
              {t.id === 'reviews' && reviews.length > 0 && (
                <span className="ml-1 text-violet-500">{reviews.length}</span>
              )}
            </a>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-3xl space-y-14 px-4 py-12 sm:px-6">
        {/* 3. 소개 */}
        <section id="intro" className="scroll-mt-32">
          <h2 className="text-xl font-black text-slate-900">강의 소개</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
              📅 업데이트 26.03.13
            </span>
            {meta.accessPeriod && (
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
                ⏳ {meta.accessPeriod}
              </span>
            )}
          </div>
          <p className="mt-4 leading-relaxed text-slate-600">{course.summary}</p>
          <div className="mt-6 grid aspect-[16/7] place-items-center rounded-2xl border border-slate-200 bg-slate-100 text-sm text-slate-400">
            🖼️ 상세 이미지 영역 (전문가 블록 에디터로 편집)
          </div>
        </section>

        {/* 4. 커리큘럼 */}
        <section id="curriculum" className="scroll-mt-32">
          <h2 className="text-xl font-black text-slate-900">커리큘럼</h2>
          <p className="mt-1 text-sm text-slate-500">
            총 {course.lessonCount}강 · 약 {Math.round(course.durationMin / 60)}시간
          </p>
          <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {course.curriculum.map((l, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm font-bold text-slate-500">
                  {i + 1}
                </span>
                <span className="flex-1 font-medium text-slate-800">{l.title}</span>
                {i < 2 && (
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-600">
                    ▶ 미리보기
                  </span>
                )}
                <span className="text-sm text-slate-400">{l.durationMin}분</span>
              </div>
            ))}
            {course.lessonCount > course.curriculum.length && (
              <div className="bg-slate-50 p-4 text-center text-sm text-slate-400">
                + 외 {course.lessonCount - course.curriculum.length}개 강의
              </div>
            )}
          </div>
        </section>

        {/* 5. 강사소개 */}
        <section id="expert" className="scroll-mt-32">
          <h2 className="text-xl font-black text-slate-900">강사소개</h2>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-violet-100 text-4xl">
                {expert?.avatar}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{expert?.name}</h3>
                <p className="text-sm font-medium text-violet-600">{expert?.title}</p>
                <p className="mt-2 leading-relaxed text-slate-600">{expert?.bio}</p>
              </div>
            </div>
            {credentials.length > 0 && (
              <ul className="mt-4 grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2">
                {credentials.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-violet-500">✓</span> {c}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* 6. 이런 걸 배워요 */}
        <section className="scroll-mt-32">
          <h2 className="text-xl font-black text-slate-900">이런 걸 배워요</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {course.whatYouLearn.map((w, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4"
              >
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet-100 text-sm text-violet-600">
                  ✓
                </span>
                <span className="text-slate-700">{w}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 7. 후기 */}
        <section id="reviews" className="scroll-mt-32">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-black text-slate-900">수강생 후기</h2>
            <span className="text-sm text-slate-500">
              <span className="font-bold text-amber-400">★</span>{' '}
              <span className="font-semibold text-slate-700">{course.rating.toFixed(1)}</span> ·{' '}
              {reviews.length}개
            </span>
          </div>
          {reviews.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center">
              <div className="text-4xl">✍️</div>
              <p className="mt-3 font-semibold text-slate-700">아직 등록된 후기가 없어요</p>
              <p className="mt-1 text-sm text-slate-500">첫 후기의 주인공이 되어보세요.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">
                      {maskName(r.userName)}
                    </span>
                    <span className="text-xs text-slate-400">{r.createdAt}</span>
                  </div>
                  <div className="mt-1 text-amber-400">{'★'.repeat(pseudoRating(r.id))}</div>
                  <p className="mt-2 leading-relaxed text-slate-600">{r.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 9. 주의사항 */}
        <section className="scroll-mt-32">
          <h2 className="text-xl font-black text-slate-900">⚠️ 주의사항</h2>
          <ul className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            {NOTICES.map((n, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-slate-400">{i + 1}.</span> {n}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* 8. 강사의 다른 콘텐츠 */}
      {related.length > 0 && (
        <section className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="text-xl font-black text-slate-900">{expert?.name} 강사의 다른 강의</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 하단 고정 구매바 */}
      <PurchaseBar course={course} />
    </div>
  )
}
