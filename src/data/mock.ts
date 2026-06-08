// 그래플레이 비즈 — 껍데기용 목업 데이터 (실제 API/DB 연동 전)
// 카테고리 4종: 마케팅 · 상권분석 · 연금 · 체육관 운영 (md 문서 §1 기준)

export type Category = '마케팅' | '상권분석' | '연금' | '체육관 운영'

export const CATEGORIES: { key: Category; emoji: string; desc: string }[] = [
  { key: '마케팅', emoji: '📣', desc: '신규 회원 모집과 브랜딩 전략' },
  { key: '상권분석', emoji: '📍', desc: '입지 선정과 상권 데이터 읽는 법' },
  { key: '연금', emoji: '💰', desc: '관장을 위한 노후·자산 설계' },
  { key: '체육관 운영', emoji: '🏋️', desc: '운영 효율과 수익 구조 설계' },
]

export interface Expert {
  id: string
  name: string
  title: string
  avatar: string // emoji placeholder
  bio: string
}

export interface Course {
  id: string
  title: string
  subtitle: string
  category: Category
  expertId: string
  price: number // 0 = 무료
  isSubscriptionExcluded: boolean // true = 단품판매 전용 (구독 제외)
  cover: string // gradient class placeholder
  thumbEmoji: string
  lessonCount: number
  durationMin: number
  rating: number
  reviewCount: number
  studentCount: number
  summary: string
  curriculum: { title: string; durationMin: number }[]
  whatYouLearn: string[]
}

export const EXPERTS: Expert[] = [
  {
    id: 'e1',
    name: '김도장',
    title: '15년차 체육관 운영 컨설턴트',
    avatar: '🥋',
    bio: '전국 40개 지점 프랜차이즈를 직접 운영하며 다져온 현장 노하우를 전합니다.',
  },
  {
    id: 'e2',
    name: '이마케팅',
    title: '로컬 비즈니스 마케터',
    avatar: '📈',
    bio: '동네 단위 소상공인 마케팅 캠페인 200건 이상을 집행한 퍼포먼스 마케터.',
  },
  {
    id: 'e3',
    name: '박상권',
    title: '상권분석 데이터 애널리스트',
    avatar: '🗺️',
    bio: '공공데이터와 유동인구 분석으로 폐업률을 낮추는 입지 컨설팅 전문가.',
  },
  {
    id: 'e4',
    name: '최재무',
    title: '소상공인 전문 재무설계사',
    avatar: '💼',
    bio: '자영업자 맞춤 연금·절세·자산배분을 12년간 자문해 온 FP.',
  },
]

export const COURSES: Course[] = [
  {
    id: 'c1',
    title: '체육관 첫 100명 회원 만들기',
    subtitle: '오픈 6개월 안에 손익분기 넘기는 마케팅 플레이북',
    category: '마케팅',
    expertId: 'e2',
    price: 99000,
    isSubscriptionExcluded: true,
    cover: 'from-amber-400 to-orange-500',
    thumbEmoji: '📣',
    lessonCount: 12,
    durationMin: 210,
    rating: 4.9,
    reviewCount: 38,
    studentCount: 412,
    summary:
      '체육관을 막 오픈했거나 회원 수가 정체된 관장님을 위한 실전 마케팅 코스입니다. 지역 타겟 광고부터 추천 이벤트, 체험 수업 전환까지 검증된 순서로 알려드립니다.',
    curriculum: [
      { title: '왜 체육관 마케팅은 동네 싸움인가', durationMin: 14 },
      { title: '인스타·네이버 플레이스 기본 세팅', durationMin: 22 },
      { title: '체험 수업 전환율 2배 만드는 스크립트', durationMin: 19 },
      { title: '회원 추천이 끊기지 않는 리워드 구조', durationMin: 18 },
      { title: '광고비 회수 계산법과 손익분기 추적', durationMin: 25 },
    ],
    whatYouLearn: [
      '월 50만원 예산으로 신규 회원 모으는 광고 세팅',
      '체험 수업을 정식 등록으로 전환하는 상담 흐름',
      '입소문이 도는 추천 이벤트 설계',
      '마케팅 비용 대비 매출(ROAS) 추적하는 법',
    ],
  },
  {
    id: 'c2',
    title: '데이터로 고르는 체육관 입지',
    subtitle: '폐업 안 하는 자리, 숫자로 검증하기',
    category: '상권분석',
    expertId: 'e3',
    price: 129000,
    isSubscriptionExcluded: true,
    cover: 'from-emerald-400 to-teal-500',
    thumbEmoji: '📍',
    lessonCount: 9,
    durationMin: 165,
    rating: 4.8,
    reviewCount: 21,
    studentCount: 187,
    summary:
      '감이 아니라 데이터로 자리를 고르는 법. 공공 상권 데이터, 유동인구, 경쟁 밀도를 직접 읽고 후보지를 점수로 비교하는 실습형 코스입니다.',
    curriculum: [
      { title: '상권분석에 꼭 봐야 할 5가지 지표', durationMin: 17 },
      { title: '소상공인 상권정보시스템 200% 활용', durationMin: 24 },
      { title: '유동인구 데이터로 시간대 읽기', durationMin: 20 },
      { title: '경쟁 체육관 밀도 지도 그리기', durationMin: 19 },
    ],
    whatYouLearn: [
      '공공데이터로 후보지 3곳 점수 비교하기',
      '임대료 대비 적정 회원 수 역산하기',
      '경쟁 과밀 상권 피하는 기준선',
    ],
  },
  {
    id: 'c3',
    title: '관장님을 위한 연금·절세 설계',
    subtitle: '자영업자 노후, 늦기 전에 구조부터',
    category: '연금',
    expertId: 'e4',
    price: 0,
    isSubscriptionExcluded: false,
    cover: 'from-sky-400 to-indigo-500',
    thumbEmoji: '💰',
    lessonCount: 7,
    durationMin: 120,
    rating: 4.7,
    reviewCount: 15,
    studentCount: 320,
    summary:
      '들쭉날쭉한 자영업 소득에 맞춘 연금과 절세 전략. 노란우산공제부터 IRP, 소득 분산까지 관장님 상황에 맞게 정리해 드립니다.',
    curriculum: [
      { title: '자영업자 소득의 함정과 노후 리스크', durationMin: 16 },
      { title: '노란우산공제 제대로 쓰기', durationMin: 18 },
      { title: 'IRP·연금저축 절세 조합', durationMin: 21 },
    ],
    whatYouLearn: [
      '소득공제 한도를 채우는 가입 순서',
      '체육관 수익을 노후 자산으로 옮기는 흐름',
      '폐업·은퇴 시점 현금 흐름 시뮬레이션',
    ],
  },
  {
    id: 'c4',
    title: '회원 이탈 막는 운영 시스템',
    subtitle: '등록보다 어려운 건 재등록입니다',
    category: '체육관 운영',
    expertId: 'e1',
    price: 89000,
    isSubscriptionExcluded: true,
    cover: 'from-rose-400 to-pink-500',
    thumbEmoji: '🏋️',
    lessonCount: 14,
    durationMin: 240,
    rating: 5.0,
    reviewCount: 52,
    studentCount: 503,
    summary:
      '회원 한 명을 오래 머물게 하는 운영 디테일. 출석 관리, 등급 시스템, 커뮤니티 만들기까지 재등록률을 끌어올리는 운영 루틴을 담았습니다.',
    curriculum: [
      { title: '재등록률이 곧 매출인 이유', durationMin: 15 },
      { title: '출석·진도 관리 자동화', durationMin: 22 },
      { title: '띠/등급 시스템으로 동기부여', durationMin: 20 },
      { title: '회원 커뮤니티가 이탈을 막는다', durationMin: 18 },
      { title: '환불·클레임 응대 매뉴얼', durationMin: 17 },
    ],
    whatYouLearn: [
      '3개월 차 이탈 구간을 넘기는 케어 루틴',
      '등급·승급 시스템으로 장기 동기 만들기',
      '운영 업무를 줄이는 자동화 도구 셋업',
    ],
  },
  {
    id: 'c5',
    title: '체육관 SNS 콘텐츠 30일 챌린지',
    subtitle: '찍을 게 없다는 관장님을 위한 콘텐츠 공식',
    category: '마케팅',
    expertId: 'e2',
    price: 59000,
    isSubscriptionExcluded: true,
    cover: 'from-violet-400 to-purple-500',
    thumbEmoji: '🎬',
    lessonCount: 10,
    durationMin: 150,
    rating: 4.6,
    reviewCount: 29,
    studentCount: 271,
    summary:
      '체육관 일상을 매일 한 개씩 콘텐츠로 만드는 30일 루틴. 촬영·편집 부담을 줄이는 템플릿과 릴스 공식을 제공합니다.',
    curriculum: [
      { title: '체육관 콘텐츠 4가지 유형', durationMin: 14 },
      { title: '30초 릴스 촬영 세팅', durationMin: 19 },
      { title: '편집 없이 보이는 자막 공식', durationMin: 16 },
    ],
    whatYouLearn: [
      '하루 10분 콘텐츠 제작 루틴',
      '저장·공유를 부르는 릴스 구성',
      '체험 문의로 이어지는 CTA 문구',
    ],
  },
  {
    id: 'c6',
    title: '프랜차이즈 vs 개인관 손익 비교',
    subtitle: '창업 전에 숫자로 따져보기',
    category: '체육관 운영',
    expertId: 'e1',
    price: 0,
    isSubscriptionExcluded: false,
    cover: 'from-amber-300 to-yellow-500',
    thumbEmoji: '📊',
    lessonCount: 6,
    durationMin: 95,
    rating: 4.5,
    reviewCount: 11,
    studentCount: 142,
    summary:
      '프랜차이즈 가맹과 개인 창업, 무엇이 더 남을까. 초기 투자, 로열티, 운영 자유도를 실제 손익표로 비교해 의사결정을 돕습니다.',
    curriculum: [
      { title: '초기 투자금 항목별 비교', durationMin: 16 },
      { title: '로열티·관리비의 진짜 비용', durationMin: 18 },
      { title: '5년 누적 손익 시뮬레이션', durationMin: 21 },
    ],
    whatYouLearn: [
      '가맹 계약서에서 꼭 볼 비용 항목',
      '개인관 창업의 숨은 비용',
      '5년 손익 분기 시뮬레이션',
    ],
  },
]

// 전문가 리뷰 (biz_expert_reviews — 전문가 1명당 별점 리뷰, md §4.2)
export interface ExpertReview {
  id: string
  expertId: string
  userName: string
  rating: number
  content: string
  createdAt: string
}

export const EXPERT_REVIEWS: ExpertReview[] = [
  { id: 'er1', expertId: 'e1', userName: '관장 J', rating: 5, content: '현장 경험에서 나온 조언이라 바로 적용할 수 있었어요.', createdAt: '2026.05.20' },
  { id: 'er2', expertId: 'e1', userName: '도장 운영 K', rating: 5, content: '운영 디테일을 이렇게까지 알려주는 분은 처음입니다.', createdAt: '2026.05.12' },
  { id: 'er3', expertId: 'e1', userName: '신규 창업 P', rating: 4, content: '내용은 훌륭한데 분량이 조금 많아요. 그래도 추천.', createdAt: '2026.04.28' },
  { id: 'er4', expertId: 'e2', userName: '관장 L', rating: 5, content: '광고 세팅 그대로 따라 했더니 체험 문의가 늘었습니다.', createdAt: '2026.05.18' },
  { id: 'er5', expertId: 'e2', userName: '코치 M', rating: 4, content: '실전 예시가 많아 좋았어요.', createdAt: '2026.05.02' },
  { id: 'er6', expertId: 'e3', userName: '예비 창업 H', rating: 5, content: '입지 고를 때 막막했는데 기준이 생겼습니다.', createdAt: '2026.05.09' },
  { id: 'er7', expertId: 'e4', userName: '관장 S', rating: 5, content: '연금·절세를 자영업자 눈높이로 풀어줘서 좋았어요.', createdAt: '2026.04.30' },
]

// 강의별 리뷰 (course_reviews — 별점 없는 댓글형, 대시보드 리뷰관리용, md §9.2)
export interface CourseReview {
  id: string
  courseId: string
  userName: string
  userEmail: string
  content: string
  createdAt: string
  hidden: boolean
  pdfSentCount: number
}

export const COURSE_REVIEWS: CourseReview[] = [
  { id: 'cr1', courseId: 'c4', userName: '관장 J', userEmail: 'jgym@example.com', content: '재등록률 케어 루틴 도입 후 3개월차 이탈이 확 줄었어요.', createdAt: '2026.05.22', hidden: false, pdfSentCount: 1 },
  { id: 'cr2', courseId: 'c4', userName: '도장 K', userEmail: 'kdojang@example.com', content: '등급 시스템 그대로 적용했습니다. 감사합니다!', createdAt: '2026.05.15', hidden: false, pdfSentCount: 0 },
  { id: 'cr3', courseId: 'c6', userName: '예비창업 P', userEmail: 'pstart@example.com', content: '프랜차이즈 비교표 덕분에 결정이 쉬워졌어요.', createdAt: '2026.05.10', hidden: false, pdfSentCount: 0 },
  { id: 'cr4', courseId: 'c4', userName: '스팸의심', userEmail: 'spam@example.com', content: '광고성 댓글 ...', createdAt: '2026.05.08', hidden: true, pdfSentCount: 0 },
]

// 현재 로그인했다고 가정하는 전문가 (대시보드 시점)
export const CURRENT_EXPERT_ID = 'e1'

export function getExpert(id: string): Expert | undefined {
  return EXPERTS.find((e) => e.id === id)
}

export function getCoursesByExpert(expertId: string): Course[] {
  return COURSES.filter((c) => c.expertId === expertId)
}

export function getExpertReviews(expertId: string): ExpertReview[] {
  return EXPERT_REVIEWS.filter((r) => r.expertId === expertId)
}

export function getExpertStats(expertId: string) {
  const reviews = getExpertReviews(expertId)
  const courses = getCoursesByExpert(expertId)
  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0
  const students = courses.reduce((s, c) => s + c.studentCount, 0)
  const categories = Array.from(new Set(courses.map((c) => c.category)))
  return {
    rating: avg,
    reviewCount: reviews.length,
    courseCount: courses.length,
    studentCount: students,
    categories,
  }
}

export function getCourse(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id)
}

// 내 강의 페이지용 — 구매했다고 가정하는 코스 id
export const MY_PURCHASED_IDS = ['c1', 'c3']

export function formatPrice(price: number): string {
  if (price === 0) return '무료'
  return '₩' + price.toLocaleString('ko-KR')
}
