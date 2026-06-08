import { useParams, Link } from 'react-router-dom'
import { getCourse, getExpert, formatPrice, COURSES } from '../data/mock'
import CourseCard from '../components/CourseCard'

// 목업 후기 (course_reviews — 별점 없는 댓글형, md §9.2)
const REVIEWS = [
  { name: '관장 J', text: '오픈 3개월차인데 광고 세팅 그대로 따라하니 체험 문의가 두 배로 늘었어요.' },
  { name: '도장 운영 K', text: '막연하던 부분을 숫자로 정리해줘서 의사결정이 훨씬 쉬워졌습니다.' },
  { name: '신규 창업 P', text: '강사님이 현장 사람이라 그런지 예시가 전부 현실적이에요. 강추합니다.' },
]

const ANCHORS = [
  { id: 'intro', label: '강의 소개' },
  { id: 'expert', label: '강사 소개' },
  { id: 'learn', label: '학습 내용' },
  { id: 'curriculum', label: '커리큘럼' },
  { id: 'reviews', label: '후기' },
]

export default function AcademyCourseDetail() {
  const { id } = useParams()
  const course = getCourse(id ?? '')

  if (!course) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="text-5xl">🤔</div>
        <h1 className="mt-4 text-2xl font-bold text-stone-900">강의를 찾을 수 없어요</h1>
        <Link
          to="/academy/library"
          className="mt-6 inline-block rounded-xl bg-stone-900 px-6 py-3 font-semibold text-white"
        >
          강의 목록으로
        </Link>
      </div>
    )
  }

  const expert = getExpert(course.expertId)
  const isPaid = course.price > 0
  const related = COURSES.filter((c) => c.category === course.category && c.id !== course.id).slice(0, 3)

  return (
    <div>
      {/* Hero */}
      <section className={`bg-gradient-to-br ${course.cover}`}>
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-20">
          <div className="text-white">
            <span className="inline-block rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-stone-800">
              {course.category}
            </span>
            <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">{course.title}</h1>
            <p className="mt-3 text-lg text-white/90">{course.subtitle}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-white/90">
              <span>⭐ {course.rating.toFixed(1)} ({course.reviewCount})</span>
              <span>· 수강 {course.studentCount.toLocaleString()}명</span>
              <span>· {course.lessonCount}강 · {Math.round(course.durationMin / 60)}시간</span>
            </div>
          </div>
          <div className="grid aspect-video place-items-center rounded-2xl bg-white/20 text-7xl backdrop-blur">
            {course.thumbEmoji}
          </div>
        </div>
      </section>

      {/* 앵커 네비 */}
      <nav className="sticky top-16 z-30 border-b border-stone-200 bg-stone-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6">
          {ANCHORS.map((a) => (
            <a
              key={a.id}
              href={`#${a.id}`}
              className="whitespace-nowrap px-4 py-3 text-sm font-medium text-stone-600 hover:text-amber-600"
            >
              {a.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid lg:grid-cols-[1fr_320px]">
        {/* 본문 */}
        <div className="space-y-16">
          {/* 강의 소개 */}
          <section id="intro" className="scroll-mt-32">
            <h2 className="text-2xl font-black text-stone-900">강의 소개</h2>
            <p className="mt-4 leading-relaxed text-stone-600">{course.summary}</p>
            <div className="mt-6 grid aspect-[16/7] place-items-center rounded-2xl border border-stone-200 bg-stone-100 text-stone-400">
              <span className="text-sm">🖼️ 상세 이미지 영역 (전문가 블록 에디터로 편집)</span>
            </div>
          </section>

          {/* 강사 소개 */}
          <section id="expert" className="scroll-mt-32">
            <h2 className="text-2xl font-black text-stone-900">강사 소개</h2>
            <div className="mt-4 flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-6">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-amber-100 text-4xl">
                {expert?.avatar}
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">{expert?.name}</h3>
                <p className="text-sm font-medium text-amber-600">{expert?.title}</p>
                <p className="mt-2 leading-relaxed text-stone-600">{expert?.bio}</p>
              </div>
            </div>
          </section>

          {/* 학습 내용 */}
          <section id="learn" className="scroll-mt-32">
            <h2 className="text-2xl font-black text-stone-900">이런 걸 배워요</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {course.whatYouLearn.map((w, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-4"
                >
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-100 text-sm text-amber-600">
                    ✓
                  </span>
                  <span className="text-stone-700">{w}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 커리큘럼 */}
          <section id="curriculum" className="scroll-mt-32">
            <h2 className="text-2xl font-black text-stone-900">커리큘럼</h2>
            <p className="mt-2 text-sm text-stone-500">
              총 {course.lessonCount}강 · 약 {Math.round(course.durationMin / 60)}시간
            </p>
            <div className="mt-4 divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white">
              {course.curriculum.map((l, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-stone-100 text-sm font-bold text-stone-500">
                    {i + 1}
                  </span>
                  <span className="flex-1 font-medium text-stone-800">{l.title}</span>
                  <span className="text-sm text-stone-400">{l.durationMin}분</span>
                </div>
              ))}
              {course.lessonCount > course.curriculum.length && (
                <div className="bg-stone-50 p-4 text-center text-sm text-stone-400">
                  + 외 {course.lessonCount - course.curriculum.length}개 강의
                </div>
              )}
            </div>
          </section>

          {/* 후기 */}
          <section id="reviews" className="scroll-mt-32">
            <h2 className="text-2xl font-black text-stone-900">수강생 후기</h2>
            <p className="mt-2 text-sm text-stone-500">실제 구매한 분들이 남긴 후기예요.</p>
            <div className="mt-4 space-y-3">
              {REVIEWS.map((r, i) => (
                <div key={i} className="rounded-2xl border border-stone-200 bg-white p-5">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-stone-100 text-sm">
                      🙂
                    </span>
                    <span className="text-sm font-semibold text-stone-800">{r.name}</span>
                  </div>
                  <p className="mt-3 leading-relaxed text-stone-600">{r.text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 사이드바 결제 카드 (sticky) */}
        <aside className="mt-10 lg:mt-0">
          <div className="lg:sticky lg:top-32">
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
              <div className={`grid aspect-video place-items-center bg-gradient-to-br ${course.cover} text-5xl`}>
                {course.thumbEmoji}
              </div>
              <div className="p-5">
                {course.isSubscriptionExcluded && isPaid && (
                  <span className="mb-2 inline-block rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                    단품 구매 전용
                  </span>
                )}
                <div
                  className={`text-3xl font-black ${
                    isPaid ? 'text-stone-900' : 'text-emerald-600'
                  }`}
                >
                  {formatPrice(course.price)}
                </div>

                <button className="mt-4 w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-3 font-bold text-stone-900 hover:opacity-90">
                  {isPaid ? '구매하기' : '무료로 시청하기'}
                </button>
                <button className="mt-2 w-full rounded-xl border border-stone-300 py-3 font-semibold text-stone-700 hover:bg-stone-50">
                  구독으로 시청
                </button>

                <ul className="mt-5 space-y-2 text-sm text-stone-500">
                  <li className="flex items-center gap-2">📺 평생 다시보기</li>
                  <li className="flex items-center gap-2">📱 모바일·PC 시청</li>
                  <li className="flex items-center gap-2">🧾 구매 후 환불 정책 적용</li>
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* 관련 강의 */}
      {related.length > 0 && (
        <section className="border-t border-stone-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-2xl font-black text-stone-900">함께 보면 좋은 강의</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
