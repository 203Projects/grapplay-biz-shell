// 전자책 목업 데이터 — 실제 PDF는 추후 Supabase Storage에 올리고 pdfUrl만 교체
// 지금은 브라우저 내장 PDF 뷰어(iframe)로 샘플을 띄운다.

// 데모용 공개 샘플 PDF (실제 서비스에선 Supabase Storage URL로 교체)
const SAMPLE_PDF = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'

import type { Category, DetailBlock } from './mock'

export interface Ebook {
  id: string
  title: string
  subtitle: string
  author: string
  category?: Category
  expertId?: string
  avatar: string // 이모지
  cover: string // Tailwind 그라데이션 (이미지 없을 때 폴백)
  coverImage?: string // 업로드한 표지 이미지 URL
  emoji: string
  price: number // 0 = 무료
  originalPrice?: number
  pageCount: number
  previewPages?: number // 상세에서 공개할 앞 페이지 수
  rating: number
  buyerCount: number
  summary: string
  highlights: string[]
  pdfUrl: string
  isNew?: boolean
  useLandingPage?: boolean
  detailBlocks?: DetailBlock[]
}

export const EBOOKS: Ebook[] = [
  {
    id: 'eb1',
    title: '체육관 운영 체크리스트 50',
    subtitle: '오픈부터 운영까지 빠짐없이 챙기는 50가지',
    author: '김도장',
    category: '경영',
    avatar: '🥋',
    cover: 'from-violet-500 to-fuchsia-500',
    emoji: '📋',
    price: 0,
    pageCount: 42,
    rating: 4.9,
    buyerCount: 1280,
    summary:
      '체육관을 처음 열거나 운영 중인 관장님이 놓치기 쉬운 항목 50가지를 체크리스트로 정리했습니다. 인쇄해서 바로 쓰세요.',
    highlights: ['오픈 전 준비 항목 한눈에', '월별 운영 점검 리스트', '바로 인쇄해서 사용'],
    pdfUrl: SAMPLE_PDF,
    isNew: true,
  },
  {
    id: 'eb2',
    title: '관장이 꼭 아는 세무 가이드',
    subtitle: '자영업자 절세, 이것만 알아도 충분',
    author: '최재무',
    category: '연금',
    avatar: '💼',
    cover: 'from-emerald-500 to-teal-500',
    emoji: '📗',
    price: 19000,
    originalPrice: 29000,
    pageCount: 88,
    rating: 4.8,
    buyerCount: 342,
    summary:
      '복잡한 세무를 체육관 경영자 눈높이로 풀었습니다. 노란우산공제부터 부가세·종소세 신고까지 핵심만 담았어요.',
    highlights: ['노란우산공제 활용법', '부가세·종소세 신고 절차', '놓치기 쉬운 절세 포인트'],
    pdfUrl: SAMPLE_PDF,
  },
  {
    id: 'eb3',
    title: '회원 상담 스크립트 모음',
    subtitle: '체험 → 등록 전환을 높이는 대화 템플릿',
    author: '이마케팅',
    category: '마케팅',
    avatar: '📈',
    cover: 'from-rose-500 to-pink-500',
    emoji: '📕',
    price: 14000,
    pageCount: 56,
    rating: 4.7,
    buyerCount: 211,
    summary:
      '체험 수업 상담에서 바로 쓰는 멘트와 흐름을 상황별로 정리했습니다. 그대로 읽기만 해도 전환율이 올라갑니다.',
    highlights: ['체험 상담 오프닝 멘트', '가격 안내 시 대응법', '등록 클로징 스크립트'],
    pdfUrl: SAMPLE_PDF,
  },
  {
    id: 'eb4',
    title: '상권분석 실전 워크북',
    subtitle: '후보지를 점수로 비교하는 양식 포함',
    author: '박상권',
    category: '상권분석',
    avatar: '🗺️',
    cover: 'from-sky-500 to-indigo-500',
    emoji: '📘',
    price: 24000,
    originalPrice: 34000,
    pageCount: 64,
    rating: 4.8,
    buyerCount: 156,
    summary:
      '공공데이터로 상권을 직접 분석하는 절차와, 후보지를 점수로 비교하는 워크시트를 담은 실습형 전자책입니다.',
    highlights: ['후보지 점수 비교 양식', '유동인구 데이터 읽기', '임대료 대비 손익 계산'],
    pdfUrl: SAMPLE_PDF,
    isNew: true,
  },
]

export function getEbook(id: string): Ebook | undefined {
  return EBOOKS.find((e) => e.id === id)
}

export function ebookDiscountPct(price: number, originalPrice?: number): number | null {
  if (!originalPrice || originalPrice <= price) return null
  return Math.round((1 - price / originalPrice) * 100)
}
