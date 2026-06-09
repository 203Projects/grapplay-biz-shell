import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useBizData } from '../lib/useBizData'
import { useAuth } from '../lib/auth'
import {
  getMyEnrollments,
  getMyWishlist,
  getMyOrders,
  type EnrollmentRow,
  type WishlistRow,
  type OrderRow,
} from '../lib/userData'
import { formatPrice } from '../data/mock'

type Tab = '수강 중' | '관심 강의' | '주문/결제'
const TAB_BY_PARAM: Record<string, Tab> = {
  enrolled: '수강 중',
  wishlist: '관심 강의',
  orders: '주문/결제',
}
const PARAM_BY_TAB: Record<Tab, string> = {
  '수강 중': 'enrolled',
  '관심 강의': 'wishlist',
  '주문/결제': 'orders',
}

export default function AcademyMyPage() {
  const { getCourse, getExpert, getEbook } = useBizData()
  const { user, profile } = useAuth()
  const [params, setParams] = useSearchParams()
  // 탭은 URL(?tab=) 기준 — /my?tab=orders 처럼 들어오면 항상 해당 탭이 열린다
  const tab = TAB_BY_PARAM[params.get('tab') ?? ''] ?? '수강 중'
  const setTab = (t: Tab) => setParams({ tab: PARAM_BY_TAB[t] }, { replace: true })

  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([])
  const [wishlist, setWishlist] = useState<WishlistRow[]>([])
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let active = true
    setLoading(true)
    Promise.all([getMyEnrollments(user.id), getMyWishlist(user.id), getMyOrders(user.id)]).then(
      ([e, w, o]) => {
        if (!active) return
        setEnrollments(e)
        setWishlist(w)
        setOrders(o)
        setLoading(false)
      },
    )
    return () => {
      active = false
    }
  }, [user])

  const name = profile?.display_name || '관장님'

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* 프로필 헤더 */}
      <div className="flex items-center gap-4 rounded-3xl border border-stone-200 bg-white p-6">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-2xl font-black text-white">
          {name.charAt(0)}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-black text-stone-900">{name}님, 환영합니다</h1>
          <p className="truncate text-sm text-stone-500">{user?.email}</p>
        </div>
        <div className="ml-auto hidden gap-6 text-center sm:flex">
          <div>
            <div className="text-2xl font-black text-stone-900">{enrollments.length}</div>
            <div className="text-xs text-stone-500">수강 강의</div>
          </div>
          <div>
            <div className="text-2xl font-black text-stone-900">{wishlist.length}</div>
            <div className="text-xs text-stone-500">관심 강의</div>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="mt-8 flex gap-1 border-b border-stone-200">
        {(['수강 중', '관심 강의', '주문/결제'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition ${
              tab === t
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      ) : tab === '주문/결제' ? (
        <OrdersTab orders={orders} getCourse={getCourse} getEbook={getEbook} />
      ) : (
        <ItemsTab
          rows={tab === '수강 중' ? enrollments : wishlist}
          showProgress={tab === '수강 중'}
          emptyKind={tab}
          getCourse={getCourse}
          getExpert={getExpert}
          getEbook={getEbook}
        />
      )}
    </div>
  )
}

// 수강/위시 공통 목록 (강의 + 전자책)
function ItemsTab({
  rows,
  showProgress,
  emptyKind,
  getCourse,
  getExpert,
  getEbook,
}: {
  rows: (EnrollmentRow | WishlistRow)[]
  showProgress: boolean
  emptyKind: Tab
  getCourse: ReturnType<typeof useBizData>['getCourse']
  getExpert: ReturnType<typeof useBizData>['getExpert']
  getEbook: ReturnType<typeof useBizData>['getEbook']
}) {
  if (rows.length === 0) {
    return (
      <div className="mt-10 rounded-3xl border border-dashed border-stone-300 bg-white py-20 text-center">
        <div className="text-5xl">📚</div>
        <p className="mt-4 text-lg font-bold text-stone-800">
          {emptyKind === '수강 중' ? '아직 수강 중인 강의가 없어요' : '관심 강의가 비어 있어요'}
        </p>
        <p className="mt-1 text-sm text-stone-500">마음에 드는 강의를 찾아 학습을 시작해 보세요.</p>
        <Link
          to="/library"
          className="mt-6 inline-block rounded-xl bg-stone-900 px-6 py-3 font-semibold text-white hover:bg-stone-800"
        >
          강의 둘러보기
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-4">
      {rows.map((row) => {
        if (row.item_type === 'ebook') {
          const eb = getEbook(row.item_id)
          if (!eb) return null
          return (
            <Link
              key={`ebook-${row.item_id}`}
              to={showProgress ? `/read/${eb.id}` : `/ebooks/${eb.id}`}
              className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4 transition hover:shadow-md sm:items-center"
            >
              <div
                className={`grid h-20 w-28 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${eb.cover} text-3xl`}
              >
                {eb.emoji}
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-violet-600">전자책</div>
                <h3 className="mt-0.5 font-bold text-stone-900">{eb.title}</h3>
                <p className="text-xs text-stone-500">
                  {eb.avatar} {eb.author}
                </p>
              </div>
              <div className="hidden items-center sm:flex">
                <span className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white">
                  보기
                </span>
              </div>
            </Link>
          )
        }

        const c = getCourse(row.item_id)
        if (!c) return null
        const expert = getExpert(c.expertId)
        const progress = 'progress' in row ? row.progress : 0
        return (
          <Link
            key={`course-${c.id}`}
            to={showProgress ? `/learn/${c.id}` : `/courses/${c.id}`}
            className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4 transition hover:shadow-md sm:items-center"
          >
            <div
              className={`grid h-20 w-28 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${c.cover} text-3xl`}
            >
              {c.thumbEmoji}
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-amber-600">{c.category}</div>
              <h3 className="mt-0.5 font-bold text-stone-900">{c.title}</h3>
              <p className="text-xs text-stone-500">
                {expert?.avatar} {expert?.name}
              </p>
              {showProgress && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-stone-500">{progress}%</span>
                </div>
              )}
            </div>
            <div className="hidden items-center sm:flex">
              <span className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white">
                {showProgress ? '이어보기' : '보러가기'}
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// 주문/결제 내역
function OrdersTab({
  orders,
  getCourse,
  getEbook,
}: {
  orders: OrderRow[]
  getCourse: ReturnType<typeof useBizData>['getCourse']
  getEbook: ReturnType<typeof useBizData>['getEbook']
}) {
  if (orders.length === 0) {
    return (
      <div className="mt-10 rounded-3xl border border-dashed border-stone-300 bg-white py-20 text-center">
        <div className="text-5xl">🧾</div>
        <p className="mt-4 text-lg font-bold text-stone-800">주문 내역이 없어요</p>
        <p className="mt-1 text-sm text-stone-500">강의를 결제하면 여기에서 확인할 수 있어요.</p>
      </div>
    )
  }

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-stone-200">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 text-left text-xs text-stone-500">
          <tr>
            <th className="px-4 py-3">상품</th>
            <th className="px-4 py-3">금액</th>
            <th className="px-4 py-3">상태</th>
            <th className="px-4 py-3">일시</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {orders.map((o) => {
            const title =
              o.item_type === 'course'
                ? getCourse(o.item_id)?.title ?? o.item_id
                : getEbook(o.item_id)?.title ?? o.item_id
            return (
              <tr key={o.id}>
                <td className="px-4 py-3 font-medium text-stone-800">{title}</td>
                <td className="px-4 py-3">{formatPrice(o.amount)}</td>
                <td className="px-4 py-3">
                  <OrderStatus status={o.status} />
                </td>
                <td className="px-4 py-3 text-stone-500">
                  {(o.paid_at ?? o.created_at)?.slice(0, 10)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function OrderStatus({ status }: { status: OrderRow['status'] }) {
  const map: Record<OrderRow['status'], { label: string; cls: string }> = {
    paid: { label: '결제완료', cls: 'bg-emerald-100 text-emerald-700' },
    pending: { label: '대기', cls: 'bg-stone-100 text-stone-600' },
    failed: { label: '실패', cls: 'bg-rose-100 text-rose-700' },
    canceled: { label: '취소', cls: 'bg-stone-100 text-stone-500' },
  }
  const s = map[status]
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${s.cls}`}>{s.label}</span>
}
