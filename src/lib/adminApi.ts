import { supabase } from './supabase'
import { getPayoutAccount, type PayoutAccount, type SettlementRow } from './expertApi'
import type { Category } from '../data/mock'

// 관리자(admin) 전용 데이터 모듈. 접근 권한은 RLS의 is_admin()이 강제한다.
// expertApi와 동일한 컨벤션: supabase 미설정 시 안전 기본값 반환.

// ── 플랫폼 개요(KPI) ──
export interface PlatformStats {
  users: number
  experts: number
  courses: number
  ebooks: number
  paidOrders: number
  gmv: number
  pendingSettlements: number
}

async function countOf(table: string, build?: (q: any) => any): Promise<number> {
  if (!supabase) return 0
  let q = supabase.from(table).select('*', { count: 'exact', head: true })
  if (build) q = build(q)
  const { count } = await q
  return count ?? 0
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const empty: PlatformStats = {
    users: 0, experts: 0, courses: 0, ebooks: 0, paidOrders: 0, gmv: 0, pendingSettlements: 0,
  }
  if (!supabase) return empty

  const [users, experts, courses, ebooks, paidOrders, pendingSettlements] = await Promise.all([
    countOf('profiles'),
    countOf('experts'),
    countOf('courses'),
    countOf('ebooks'),
    countOf('orders', (q) => q.eq('status', 'paid')),
    countOf('settlements', (q) => q.in('status', ['requested', 'approved'])),
  ])

  // GMV — 결제 완료 주문 금액 합
  const { data: paid } = await supabase.from('orders').select('amount').eq('status', 'paid')
  const gmv = (paid ?? []).reduce((s: number, o: any) => s + (o.amount ?? 0), 0)

  return { users, experts, courses, ebooks, paidOrders, gmv, pendingSettlements }
}

// ── 정산 관리 (전 전문가 대상) ──
export interface AdminSettlement extends SettlementRow {
  expert_id: string
  note: string | null
}

export async function listAllSettlements(): Promise<AdminSettlement[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('settlements')
    .select('id, expert_id, amount, gross_amount, fee_rate, status, requested_at, paid_at, note')
    .order('requested_at', { ascending: false })
  return (data as AdminSettlement[]) ?? []
}

export async function updateSettlementStatus(
  id: string,
  status: 'approved' | 'paid' | 'rejected',
  note?: string,
) {
  if (!supabase) return { error: '연결이 설정되지 않았습니다.' }
  const patch: Record<string, unknown> = { status }
  if (status === 'paid') patch.paid_at = new Date().toISOString()
  if (note !== undefined) patch.note = note
  // .select()로 영향 행을 받아 0건이면 RLS 차단(관리자 아님)으로 간주
  const { data, error } = await supabase
    .from('settlements')
    .update(patch)
    .eq('id', id)
    .select('id')
  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: '권한이 없거나 정산 건을 찾을 수 없습니다.' }
  return { error: null }
}

// 전문가 정산 계좌 조회 (expertApi 재사용 — 관리자도 payout_accounts read 허용됨)
export async function getPayoutAccountFor(expertId: string): Promise<PayoutAccount | null> {
  return getPayoutAccount(expertId)
}

// ── 회원 관리 ──
export type UserRole = 'user' | 'expert' | 'admin'
export interface AdminUser {
  id: string
  email: string | null
  display_name: string | null
  role: UserRole
  expert_id: string | null
  created_at: string
}

export async function listUsers(search?: string): Promise<AdminUser[]> {
  if (!supabase) return []
  let q = supabase
    .from('profiles')
    .select('id, email, display_name, role, expert_id, created_at')
    .order('created_at', { ascending: false })
  if (search?.trim()) {
    const term = `%${search.trim()}%`
    q = q.or(`email.ilike.${term},display_name.ilike.${term}`)
  }
  const { data } = await q
  return (data as AdminUser[]) ?? []
}

// 역할 변경 — admin_set_user_role RPC (서버에서 is_admin 검증 + expert_id 무결성 검사)
export async function setUserRole(userId: string, role: UserRole, expertId?: string | null) {
  if (!supabase) return { error: '연결이 설정되지 않았습니다.' }
  const { error } = await supabase.rpc('admin_set_user_role', {
    target_user: userId,
    new_role: role,
    new_expert_id: role === 'expert' ? expertId ?? null : null,
  })
  if (error) {
    if (error.message.includes('expert_id required')) return { error: '연결할 전문가를 선택하세요.' }
    if (error.message.includes('not admin')) return { error: '관리자 권한이 없습니다.' }
    return { error: error.message }
  }
  return { error: null }
}

// ── 전문가 관리 ──
export interface ExpertInput {
  name: string
  title: string
  avatar?: string
  bio?: string
  category?: Category
}

function genExpertId() {
  return `e_${crypto.randomUUID().slice(0, 8)}`
}

export async function createExpert(input: ExpertInput) {
  if (!supabase) return { data: null, error: '연결이 설정되지 않았습니다.' }
  const row = {
    id: genExpertId(),
    name: input.name,
    title: input.title,
    avatar: input.avatar || '🧑‍🏫',
    bio: input.bio ?? '',
    category: input.category ?? null,
  }
  const { data, error } = await supabase.from('experts').insert(row).select().single()
  return { data, error: error?.message ?? null }
}

export async function updateExpert(id: string, patch: ExpertInput) {
  if (!supabase) return { data: null, error: '연결이 설정되지 않았습니다.' }
  const { data, error } = await supabase
    .from('experts')
    .update({
      name: patch.name,
      title: patch.title,
      avatar: patch.avatar || '🧑‍🏫',
      bio: patch.bio ?? '',
      category: patch.category ?? null,
    })
    .eq('id', id)
    .select()
    .single()
  return { data, error: error?.message ?? null }
}

// ── 주문 관리 ──
export interface AdminOrder {
  id: string
  user_id: string
  item_type: 'course' | 'ebook'
  item_id: string
  amount: number
  status: 'pending' | 'paid' | 'failed' | 'canceled'
  method: string | null
  created_at: string
  paid_at: string | null
}

export async function listAllOrders(opts?: { status?: string }): Promise<AdminOrder[]> {
  if (!supabase) return []
  let q = supabase
    .from('orders')
    .select('id, user_id, item_type, item_id, amount, status, method, created_at, paid_at')
    .order('created_at', { ascending: false })
  if (opts?.status) q = q.eq('status', opts.status)
  const { data } = await q
  return (data as AdminOrder[]) ?? []
}
