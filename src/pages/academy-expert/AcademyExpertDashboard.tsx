import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CURRENT_EXPERT_ID, formatPrice } from '../../data/mock'
import { useBizData } from '../../lib/useBizData'

type Tab = '내 강의' | '영상' | '리뷰 관리' | '수익 분석' | '정산'
const TABS: Tab[] = ['내 강의', '영상', '리뷰 관리', '수익 분석', '정산']

export default function AcademyExpertDashboard() {
  const { getExpert, getExpertStats, loading } = useBizData()
  const [tab, setTab] = useState<Tab>('내 강의')
  const expert = getExpert(CURRENT_EXPERT_ID)
  const stats = getExpertStats(CURRENT_EXPERT_ID)

  if (loading || !expert) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="h-20 animate-pulse rounded-2xl bg-stone-100" />
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-3xl">
            {expert.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-stone-900">{expert.name}</h1>
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                BIZ 전문가
              </span>
            </div>
            <p className="text-sm text-stone-500">{expert.title}</p>
          </div>
        </div>
        <Link
          to="/academy-expert/courses/new"
          className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-center font-bold text-stone-900 hover:opacity-90"
        >
          + 새 강의 만들기
        </Link>
      </div>

      {/* 요약 통계 */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="총 강의" value={`${stats.courseCount}개`} icon="📚" />
        <StatCard label="총 수강생" value={`${stats.studentCount.toLocaleString()}명`} icon="👥" />
        <StatCard label="누적 매출" value="₩12,480,000" icon="💰" accent />
        <StatCard label="평균 평점" value={`⭐ ${stats.rating.toFixed(1)}`} icon="" />
      </div>

      {/* 탭 */}
      <div className="mt-8 flex gap-1 overflow-x-auto border-b border-stone-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
              tab === t
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === '내 강의' && <MyCoursesTab />}
        {tab === '영상' && <VideosTab />}
        {tab === '리뷰 관리' && <ReviewsTab />}
        {tab === '수익 분석' && <RevenueTab />}
        {tab === '정산' && <PayoutTab />}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: string
  icon: string
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent ? 'border-amber-200 bg-amber-50' : 'border-stone-200 bg-white'
      }`}
    >
      <div className="text-sm text-stone-500">
        {icon} {label}
      </div>
      <div className="mt-1 text-2xl font-black text-stone-900">{value}</div>
    </div>
  )
}

/* ── 내 강의 탭 ── */
function MyCoursesTab() {
  const { getCoursesByExpert } = useBizData()
  const courses = getCoursesByExpert(CURRENT_EXPERT_ID)

  return (
    <div className="space-y-3">
      {courses.map((c) => (
        <div
          key={c.id}
          className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center"
        >
          <div
            className={`grid h-16 w-24 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${c.cover} text-2xl`}
          >
            {c.thumbEmoji}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-amber-600">{c.category}</span>
            </div>
            <h3 className="mt-0.5 font-bold text-stone-900">{c.title}</h3>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-stone-400">
              <span>{formatPrice(c.price)}</span>
              <span>· 수강 {c.studentCount.toLocaleString()}명</span>
              <span>· {c.lessonCount}강</span>
              <span>· ⭐ {c.rating.toFixed(1)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/academy/courses/${c.id}`}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50"
            >
              미리보기
            </Link>
            <Link
              to={`/academy-expert/courses/${c.id}/edit`}
              className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
            >
              편집
            </Link>
          </div>
        </div>
      ))}

      <Link
        to="/academy-expert/courses/new"
        className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-300 bg-white py-8 font-semibold text-stone-500 hover:border-amber-300 hover:text-amber-600"
      >
        + 새 강의 만들기
      </Link>
    </div>
  )
}

/* ── 영상 탭 (Vimeo 업로드, md §9.3) ── */
function VideosTab() {
  const videos = [
    { title: '첫 100명 회원 만들기 — 1강', url: 'https://vimeo.com/000000001' },
    { title: '체험 수업 전환 스크립트 — 3강', url: 'https://vimeo.com/000000003' },
    { title: '광고비 회수 계산법 — 5강', url: 'https://vimeo.com/000000005' },
  ]
  return (
    <div className="space-y-6">
      {/* 업로드 박스 */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h3 className="font-bold text-stone-900">새 영상 업로드</h3>
        <p className="mt-1 text-sm text-stone-500">Vimeo에 영상을 올리고 강의에 연결하세요.</p>
        <div className="mt-4 grid place-items-center rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 py-12 text-center">
          <div className="text-3xl">🎬</div>
          <p className="mt-2 text-sm text-stone-500">파일을 끌어다 놓거나 클릭해서 선택</p>
          <button className="mt-4 rounded-lg bg-stone-900 px-5 py-2 text-sm font-semibold text-white">
            영상 선택
          </button>
        </div>
      </div>

      {/* 보유 영상 목록 */}
      <div>
        <h3 className="font-bold text-stone-900">보유 영상</h3>
        <div className="mt-3 divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          {videos.map((v) => (
            <div key={v.url} className="flex items-center gap-4 p-4">
              <div className="grid h-12 w-16 shrink-0 place-items-center rounded-lg bg-stone-900 text-lg">
                ▶️
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-stone-800">{v.title}</p>
                <p className="truncate text-xs text-stone-400">{v.url}</p>
              </div>
              <button className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50">
                URL 복사
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── 리뷰 관리 탭 (course_reviews, 숨김/PDF 발송, md §9.2) ── */
function ReviewsTab() {
  const { courseReviews, getCoursesByExpert, getCourse } = useBizData()
  const reviews = courseReviews.filter((r) =>
    getCoursesByExpert(CURRENT_EXPERT_ID).some((c) => c.id === r.courseId),
  )

  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-16 text-center">
        <div className="text-4xl">📝</div>
        <p className="mt-3 font-semibold text-stone-700">아직 등록된 리뷰가 없어요</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-stone-500">
        리뷰를 확인하고 작성자에게 강의 PDF를 보내거나, 부적절한 리뷰는 숨길 수 있어요.
      </p>
      {reviews.map((r) => {
        const course = getCourse(r.courseId)
        return (
          <div
            key={r.id}
            className={`rounded-2xl border p-5 ${
              r.hidden ? 'border-stone-200 bg-stone-50 opacity-70' : 'border-stone-200 bg-white'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-stone-800">{r.userName}</span>
                <span className="text-xs text-stone-400">· {r.userEmail}</span>
                {r.hidden && (
                  <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[11px] font-semibold text-stone-600">
                    숨김
                  </span>
                )}
              </div>
              <span className="text-xs text-stone-400">{r.createdAt}</span>
            </div>
            <div className="mt-1 text-xs font-medium text-amber-600">{course?.title}</div>
            <p className="mt-2 leading-relaxed text-stone-600">{r.content}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                📄 PDF 보내기
                {r.pdfSentCount > 0 && (
                  <span className="ml-1 text-indigo-200">({r.pdfSentCount}회 발송됨)</span>
                )}
              </button>
              <button className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50">
                {r.hidden ? '숨김 해제' : '숨기기'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── 수익 분석 탭 (RevenueAnalyticsTab 재사용, md §9.3) ── */
function RevenueTab() {
  const bars = [40, 65, 55, 80, 72, 95]
  const months = ['1월', '2월', '3월', '4월', '5월', '6월']
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="이번 달 매출" value="₩2,310,000" icon="📈" accent />
        <StatCard label="이번 달 판매" value="38건" icon="🛒" />
        <StatCard label="정산 예정액" value="₩1,848,000" icon="💸" />
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h3 className="font-bold text-stone-900">월별 매출 추이</h3>
        <div className="mt-6 flex h-48 items-end justify-between gap-3">
          {bars.map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-amber-400 to-orange-400"
                style={{ height: `${h}%` }}
              />
              <span className="text-xs text-stone-400">{months[i]}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-stone-400">
          * 정산 비율 80:20 적용 (settlement-system.md 기준) — 데모 데이터
        </p>
      </div>
    </div>
  )
}

/* ── 정산 탭 (PayoutSettingsTab 재사용, md §9.3) ── */
function PayoutTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="text-sm text-stone-600">출금 가능 금액</div>
        <div className="mt-1 text-3xl font-black text-stone-900">₩1,848,000</div>
        <button className="mt-4 rounded-xl bg-stone-900 px-6 py-3 font-semibold text-white hover:bg-stone-800">
          출금 신청
        </button>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h3 className="font-bold text-stone-900">정산 계좌</h3>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-stone-500">예금주</dt>
            <dd className="font-medium text-stone-800">김도장</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone-500">은행</dt>
            <dd className="font-medium text-stone-800">○○은행</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone-500">계좌번호</dt>
            <dd className="font-medium text-stone-800">123-456-****</dd>
          </div>
        </dl>
        <button className="mt-4 rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50">
          계좌 변경
        </button>
      </div>
    </div>
  )
}
