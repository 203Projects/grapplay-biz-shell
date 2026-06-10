import { supabase } from './supabase'

// 사용자 데이터(수강/위시/주문) read + 위시·무료수강 mutation
export type ItemType = 'course' | 'ebook'

// 후기 작성 — 구매(수강)자만. 별점(1~5) + 텍스트. RLS가 enrolled 여부를 강제한다.
export async function addCourseReview(input: {
  courseId: string
  userName: string
  userEmail: string
  content: string
  rating: number
}) {
  if (!supabase) return { error: '연결이 설정되지 않았습니다.' }
  const { error } = await supabase.from('course_reviews').insert({
    id: `cr_${crypto.randomUUID().slice(0, 8)}`,
    course_id: input.courseId,
    user_name: input.userName,
    user_email: input.userEmail,
    content: input.content,
    rating: input.rating,
    hidden: false,
    pdf_sent_count: 0,
    created_at: new Date().toISOString().slice(0, 10),
  })
  return { error: error?.message ?? null }
}

export async function addEbookReview(input: {
  ebookId: string
  userName: string
  userEmail: string
  content: string
  rating: number
}) {
  if (!supabase) return { error: '연결이 설정되지 않았습니다.' }
  const { error } = await supabase.from('ebook_reviews').insert({
    id: `ebr_${crypto.randomUUID().slice(0, 8)}`,
    ebook_id: input.ebookId,
    user_name: input.userName,
    user_email: input.userEmail,
    content: input.content,
    rating: input.rating,
    hidden: false,
    created_at: new Date().toISOString().slice(0, 10),
  })
  return { error: error?.message ?? null }
}

// 마이페이지 — 본인 프로필(이름/사진) 수정. RLS가 본인 행만 허용.
export async function updateMyProfile(
  userId: string,
  patch: { display_name?: string; avatar_url?: string | null },
) {
  if (!supabase) return { error: '연결이 설정되지 않았습니다.' }
  let res = await supabase.from('profiles').update(patch).eq('id', userId).select('id')
  // avatar_url 컬럼 미마이그레이션 시: 사진 제외하고 이름만이라도 저장
  if (res.error && 'avatar_url' in patch) {
    const { avatar_url: _omit, ...rest } = patch
    res = await supabase.from('profiles').update(rest).eq('id', userId).select('id')
  }
  if (res.error) return { error: res.error.message }
  if (!res.data || res.data.length === 0) return { error: '프로필을 수정할 수 없습니다.' }
  return { error: null }
}

export interface EnrollmentRow {
  item_type: ItemType
  item_id: string
  progress: number
}

export interface WishlistRow {
  item_type: ItemType
  item_id: string
}

export interface OrderRow {
  id: string
  order_key: string
  item_type: ItemType
  item_id: string
  amount: number
  status: 'pending' | 'paid' | 'failed' | 'canceled'
  created_at: string
  paid_at: string | null
}

export async function getMyEnrollments(userId: string): Promise<EnrollmentRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('enrollments')
    .select('item_type, item_id, progress')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[userData] getMyEnrollments:', error.message)
    return []
  }
  return (data as EnrollmentRow[]) ?? []
}

export async function getMyWishlist(userId: string): Promise<WishlistRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('wishlist')
    .select('item_type, item_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[userData] getMyWishlist:', error.message)
    return []
  }
  return (data as WishlistRow[]) ?? []
}

export async function getMyOrders(userId: string): Promise<OrderRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_key, item_type, item_id, amount, status, created_at, paid_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[userData] getMyOrders:', error.message)
    return []
  }
  return (data as OrderRow[]) ?? []
}

export async function addWishlist(userId: string, type: ItemType, id: string) {
  if (!supabase) return { error: '로그인이 필요합니다.' }
  const { error } = await supabase
    .from('wishlist')
    .insert({ user_id: userId, item_type: type, item_id: id })
  return { error: error?.message ?? null }
}

export async function removeWishlist(userId: string, type: ItemType, id: string) {
  if (!supabase) return { error: '로그인이 필요합니다.' }
  const { error } = await supabase
    .from('wishlist')
    .delete()
    .eq('user_id', userId)
    .eq('item_type', type)
    .eq('item_id', id)
  return { error: error?.message ?? null }
}

// 영상강의 회차별 재생 위치 — { "<lessonIdx>": { s: 마지막위치초, d: 영상길이초 } }
export interface LessonPos {
  s: number
  d: number
}
export type LessonProgress = Record<string, LessonPos>

// 강의 진도 조회 — 전체 %(progress) + 회차별 위치(lesson_progress)
export async function getCourseProgress(
  userId: string,
  courseId: string,
): Promise<{ progress: number; lessons: LessonProgress }> {
  if (!supabase) return { progress: 0, lessons: {} }
  const { data } = await supabase
    .from('enrollments')
    .select('progress, lesson_progress')
    .eq('user_id', userId)
    .eq('item_type', 'course')
    .eq('item_id', courseId)
    .maybeSingle()
  return {
    progress: (data?.progress as number) ?? 0,
    lessons: (data?.lesson_progress as LessonProgress) ?? {},
  }
}

// 강의 진도 저장 — 회차별 위치 + 전체 % 동시 업데이트(RLS "update own progress")
export async function saveCourseProgress(
  userId: string,
  courseId: string,
  lessons: LessonProgress,
  progressPct: number,
) {
  if (!supabase) return { error: '로그인이 필요합니다.' }
  const pct = Math.max(0, Math.min(100, Math.round(progressPct)))
  const { error } = await supabase
    .from('enrollments')
    .update({ progress: pct, lesson_progress: lessons })
    .eq('user_id', userId)
    .eq('item_type', 'course')
    .eq('item_id', courseId)
  return { error: error?.message ?? null }
}

// 읽기/학습 진도(0~100%) 저장 — enrollments.progress 재활용. RLS "update own progress"로 본인 행만 허용.
export async function updateProgress(userId: string, type: ItemType, id: string, progress: number) {
  if (!supabase) return { error: '로그인이 필요합니다.' }
  const pct = Math.max(0, Math.min(100, Math.round(progress)))
  const { error } = await supabase
    .from('enrollments')
    .update({ progress: pct })
    .eq('user_id', userId)
    .eq('item_type', type)
    .eq('item_id', id)
  return { error: error?.message ?? null }
}

// 무료 강의/전자책 즉시 수강 등록 (RLS가 price=0만 허용)
export async function enrollFree(userId: string, type: ItemType, id: string) {
  if (!supabase) return { error: '로그인이 필요합니다.' }
  const { error } = await supabase
    .from('enrollments')
    .insert({ user_id: userId, item_type: type, item_id: id })
  // 이미 등록된 경우(unique 위반)는 성공으로 간주
  if (error && !error.message.toLowerCase().includes('duplicate')) {
    return { error: error.message }
  }
  return { error: null }
}
