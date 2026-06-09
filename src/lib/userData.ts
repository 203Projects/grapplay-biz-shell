import { supabase } from './supabase'

// 사용자 데이터(수강/위시/주문) read + 위시·무료수강 mutation
export type ItemType = 'course' | 'ebook'

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
