import { useEffect, useState } from 'react'
import { fetchBizData, type BizData } from './api'
import type { Course, Expert, ExpertReview, CourseReview } from '../data/mock'

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

export interface BizDataApi extends BizData {
  loading: boolean
  getExpert: (id: string) => Expert | undefined
  getCourse: (id: string) => Course | undefined
  getCoursesByExpert: (expertId: string) => Course[]
  getExpertReviews: (expertId: string) => ExpertReview[]
  getCourseReviews: (courseId: string) => CourseReview[]
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
  live: false,
}

export function useBizData(): BizDataApi {
  const [data, setData] = useState<BizData | null>(cache)
  const [loading, setLoading] = useState(!cache)

  useEffect(() => {
    if (cache) return
    let active = true
    load().then((d) => {
      if (active) {
        setData(d)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const d = data ?? EMPTY

  return {
    ...d,
    loading,
    getExpert: (id) => d.experts.find((e) => e.id === id),
    getCourse: (id) => d.courses.find((c) => c.id === id),
    getCoursesByExpert: (expertId) => d.courses.filter((c) => c.expertId === expertId),
    getExpertReviews: (expertId) => d.expertReviews.filter((r) => r.expertId === expertId),
    getCourseReviews: (courseId) => d.courseReviews.filter((r) => r.courseId === courseId),
    getExpertStats: (expertId) => {
      const reviews = d.expertReviews.filter((r) => r.expertId === expertId)
      const courses = d.courses.filter((c) => c.expertId === expertId)
      const avg = reviews.length
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0
      return {
        rating: avg,
        reviewCount: reviews.length,
        courseCount: courses.length,
        studentCount: courses.reduce((s, c) => s + c.studentCount, 0),
        categories: Array.from(new Set(courses.map((c) => c.category))),
      }
    },
  }
}
