import { useEffect, useState } from 'react'
import { formatPrice } from '../../../data/mock'
import { getPlatformStats, type PlatformStats } from '../../../lib/adminApi'
import { StatCard } from '../ui'

// 플랫폼 개요 — 회원/전문가/콘텐츠/주문/매출 KPI
export default function OverviewTab() {
  const [stats, setStats] = useState<PlatformStats | null>(null)

  useEffect(() => {
    getPlatformStats().then(setStats)
  }, [])

  if (!stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-stone-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="총매출 (GMV)" value={formatPrice(stats.gmv)} icon="💰" accent />
        <StatCard label="결제 완료 주문" value={`${stats.paidOrders.toLocaleString()}건`} icon="🛒" />
        <StatCard label="정산 대기" value={`${stats.pendingSettlements}건`} icon="💸" />
        <StatCard label="회원" value={`${stats.users.toLocaleString()}명`} icon="👤" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="전문가" value={`${stats.experts.toLocaleString()}명`} icon="🧑‍🏫" />
        <StatCard label="강의" value={`${stats.courses.toLocaleString()}개`} icon="📚" />
        <StatCard label="전자책" value={`${stats.ebooks.toLocaleString()}권`} icon="📕" />
        <div className="rounded-2xl border border-dashed border-stone-200 p-5 text-sm text-stone-400">
          더 자세한 운영 지표는 각 탭에서 확인하세요.
        </div>
      </div>
    </div>
  )
}
