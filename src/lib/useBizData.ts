import { useEffect, useState } from 'react'
import { fetchBizData, type BizData } from './api'
import type { Course, Expert, ExpertReview, CourseReview } from '../data/mock'
import type { Ebook, EbookReview } from '../data/mockEbooks'

// 모듈 레벨 캐시 — 앱 내에서 한 번만 로드
let cache: BizData | null = null
let inflight: Promise<BizData> | null = null

function load(): Promise<BizData> {
  if (cache) return Promise.resolve(cache)
  if (!inflight) {
    inflight = fetchBizData().then((d) => {
      cache = d
      inflight = null
      return d
    })
  }
  return inflight
}

// 강의/리뷰 mutation 후 캐시 무효화 — 다음 load()에서 실데이터를 다시 가져온다.
export function invalidateBizData() {
  cache = null
  inflight = null
}

export interface BizDataApi extends BizData {
  loading: boolean
  refetch: () => void
  getExpert: (id: string) => Expert | undefined
  getCourse: (id: string) => Course | undefined
  getCoursesByExpert: (expertId: string) => Course[]
  getExpertReviews: (expertId: string) => ExpertReview[]
  getCourseReviews: (courseId: string) => CourseReview[]
  getEbook: (id: string) => Ebook | undefined
  getEbooksByExpert: (expertId: string) => Ebook[]
  getEbookReviews: (ebookId: string) => EbookReview[]
  // 실제 후기 별점에서 산출한 평점/개수 (고정 mock rating 대체)
  getCourseRating: (courseId: string) => { rating: number; count: number }
  getEbookRating: (ebookId: string) => { rating: number; count: number }
  getExpertStats: (expertId: string) => {
    rating: number
    reviewCount: number
    courseCount: number
    studentCount: number
    categories: Course['category'][]
  }
}

const EMPTY: BizData = {
  courses: [],
  experts: [],
  expertReviews: [],
  courseReviews: [],
  ebooks: [],
  ebookReviews: [],
  banners: [],
  live: false,
}

export function useBizData(): BizDataApi {
  const [data, setData] = useState<BizData | null>(cache)
  const [loading, setLoading] = useState(!cache)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (cache && tick === 0) return
    let active = true
    setLoading(true)
    load().then((d) => {
      if (active) {
        setData(d)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [tick])

  const refetch = () => {
    invalidateBizData()
    setTick((t) => t + 1)
  }

  const d = data ?? EMPTY

  return {
    ...d,
    loading,
    refetch,
    getExpert: (id) => d.experts.find((e) => e.id === id),
    getCourse: (id) => d.courses.find((c) => c.id === id),
    getCoursesByExpert: (expertId) => d.courses.filter((c) => c.expertId === expertId),
    getExpertReviews: (expertId) => d.expertReviews.filter((r) => r.expertId === expertId),
    getCourseReviews: (courseId) => d.courseReviews.filter((r) => r.courseId === courseId),
    getEbook: (id) => d.ebooks.find((e) => e.id === id),
    getEbooksByExpert: (expertId) => d.ebooks.filter((e) => e.expertId === expertId),
    getEbookReviews: (ebookId) => d.ebookReviews.filter((r) => r.ebookId === ebookId),
    getCourseRating: (courseId) => {
      const rs = d.courseReviews.filter(
        (r) => r.courseId === courseId && !r.hidden && typeof r.rating === 'number',
      )
      const count = rs.length
      const rating = count ? rs.reduce((s, r) => s + (r.rating ?? 0), 0) / count : 0
      return { rating, count }
    },
    getEbookRating: (ebookId) => {
      const rs = d.ebookReviews.filter(
        (r) => r.ebookId === ebookId && !r.hidden && typeof r.rating === 'number',
      )
      const count = rs.length
      const rating = count ? rs.reduce((s, r) => s + (r.rating ?? 0), 0) / count : 0
      return { rating, count }
    },
    getExpertStats: (expertId) => {
      const courses = d.courses.filter((c) => c.expertId === expertId)
      const ebooks = d.ebooks.filter((e) => e.expertId === expertId)
      const courseIds = new Set(courses.map((c) => c.id))
      const ebookIds = new Set(ebooks.map((e) => e.id))
      // 실제 후기 별점에서 산출 (가짜 expert_reviews 고정값 대체) — 강의+전자책 후기 통합
      const ratings = [
        ...d.courseReviews
          .filter((r) => courseIds.has(r.courseId) && !r.hidden && typeof r.rating === 'number')
          .map((r) => r.rating as number),
        ...d.ebookReviews
          .filter((r) => ebookIds.has(r.ebookId) && !r.hidden && typeof r.rating === 'number')
          .map((r) => r.rating as number),
      ]
      const reviewCount = ratings.length
      const avg = reviewCount ? ratings.reduce((s, n) => s + n, 0) / reviewCount : 0
      return {
        rating: avg,
        reviewCount,
        courseCount: courses.length,
        studentCount: courses.reduce((s, c) => s + c.studentCount, 0),
        categories: Array.from(new Set(courses.map((c) => c.category))),
      }
    },
  }
}
