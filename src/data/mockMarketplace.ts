// pudufu 스타일 개편용 가짜(마켓플레이스) 데이터 — 실제 DB에 없는 보강용
// 명세서: pudufu-style-ui-spec.md §5

export interface PromoBanner {
  title: string
  subtitle: string
  gradient: string // Tailwind 그라데이션 클래스
  cta: string
}

export const PROMO_BANNERS: PromoBanner[] = [
  {
    title: '이번 주 무료 강의',
    subtitle: '체육관 마케팅 첫걸음을 무료로 먼저 들어보세요',
    gradient: 'from-violet-600 to-purple-500',
    cta: '무료로 보기',
  },
  {
    title: 'AI로 회원관리 자동화',
    subtitle: '반복 업무는 줄이고 운영에만 집중하세요',
    gradient: 'from-fuchsia-600 to-violet-600',
    cta: '보러가기',
  },
  {
    title: '이달의 무료 전자책',
    subtitle: '관장이 꼭 봐야 할 운영 체크리스트 PDF',
    gradient: 'from-indigo-600 to-purple-600',
    cta: '받기',
  },
]

export interface SuccessStory {
  name: string
  role: string
  headline: string
  courseId: string
}

export const SUCCESS_STORIES: SuccessStory[] = [
  { name: '박관장', role: '오픈 1년차 관장', headline: '6개월 만에 회원 3배', courseId: 'c1' },
  { name: '이대표', role: '2호점 준비 중', headline: '입지 분석 후 폐업 걱정 끝', courseId: 'c2' },
  { name: '최코치', role: '5년차 운영', headline: '재등록률 40% → 72%', courseId: 'c4' },
  { name: '정관장', role: '예비 창업자', headline: '창업 손익을 한눈에 정리', courseId: 'c6' },
]

export interface LivePurchase {
  maskedName: string
  courseId: string
  minutesAgo: number
}

export const LIVE_PURCHASES: LivePurchase[] = [
  { maskedName: '김○○', courseId: 'c4', minutesAgo: 0 },
  { maskedName: '이○○', courseId: 'c1', minutesAgo: 3 },
  { maskedName: '박○○', courseId: 'c2', minutesAgo: 7 },
  { maskedName: '최○○', courseId: 'c1', minutesAgo: 12 },
  { maskedName: '정○○', courseId: 'c5', minutesAgo: 18 },
  { maskedName: '강○○', courseId: 'c4', minutesAgo: 24 },
  { maskedName: '조○○', courseId: 'c3', minutesAgo: 31 },
  { maskedName: '윤○○', courseId: 'c6', minutesAgo: 38 },
  { maskedName: '장○○', courseId: 'c1', minutesAgo: 45 },
  { maskedName: '임○○', courseId: 'c2', minutesAgo: 52 },
  { maskedName: '한○○', courseId: 'c4', minutesAgo: 64 },
  { maskedName: '오○○', courseId: 'c5', minutesAgo: 73 },
  { maskedName: '서○○', courseId: 'c1', minutesAgo: 88 },
  { maskedName: '신○○', courseId: 'c3', minutesAgo: 102 },
  { maskedName: '권○○', courseId: 'c4', minutesAgo: 121 },
]

// 전문가 약력 불릿 (상세 §4.5)
export const EXPERT_CREDENTIALS: Record<string, string[]> = {
  e1: ['프랜차이즈 40개 지점 직접 운영', '체육관 경영 컨설팅 15년', '누적 자문 체육관 300곳'],
  e2: ['로컬 마케팅 캠페인 200건 집행', '체험 전환율 평균 2배 개선', '소상공인 마케팅 강연 다수'],
  e3: ['공공데이터 기반 입지 분석 1,000건', '컨설팅 후 평균 폐업률 30% 감소', '상권분석 데이터 애널리스트'],
  e4: ['자영업자 재무자문 12년', '노란우산·IRP 절세 설계 전문', '누적 상담 800건'],
}

// 강의 마케팅 메타 (카드/상세 가격·배지)
export interface CourseMeta {
  isNew?: boolean
  originalPrice?: number // 정가(취소선). 없으면 할인 없음
  accessPeriod?: string // 수강 기한
}

export const COURSE_META: Record<string, CourseMeta> = {
  c1: { isNew: true, originalPrice: 149000, accessPeriod: '평생 수강' },
  c2: { originalPrice: 179000, accessPeriod: '360일' },
  c3: { isNew: true, accessPeriod: '평생 수강' },
  c4: { originalPrice: 129000, accessPeriod: '평생 수강' },
  c5: { originalPrice: 79000, accessPeriod: '99일' },
  c6: { accessPeriod: '평생 수강' },
}

export function getCourseMeta(courseId: string): CourseMeta {
  return COURSE_META[courseId] ?? {}
}

export function discountPct(price: number, originalPrice?: number): number | null {
  if (!originalPrice || originalPrice <= price) return null
  return Math.round((1 - price / originalPrice) * 100)
}

// 강의 리뷰엔 별점이 없어서 deterministic하게 4~5점 보강 (상세 §4.7, 메인 §3.7)
export function pseudoRating(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return [5, 5, 4, 5][h % 4]
}

// 상대 시간 표기
export function relativeTime(minutesAgo: number): string {
  if (minutesAgo < 1) return '방금 전'
  if (minutesAgo < 60) return `${minutesAgo}분 전`
  return `${Math.floor(minutesAgo / 60)}시간 전`
}

// 이름 마스킹 (성 + ○○). 이미 마스킹된 값은 그대로.
export function maskName(name: string): string {
  if (name.includes('○')) return name
  return name.charAt(0) + '○○'
}
