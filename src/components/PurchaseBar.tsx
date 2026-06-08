import { useState } from 'react'
import { Course, formatPrice } from '../data/mock'
import { getCourseMeta, discountPct } from '../data/mockMarketplace'

// 강의 상세 하단 고정 구매바 (pudufu 방식)
export default function PurchaseBar({ course }: { course: Course }) {
  const [wished, setWished] = useState(false)
  const isPaid = course.price > 0
  const meta = getCourseMeta(course.id)
  const off = discountPct(course.price, meta.originalPrice)

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        {/* 가격 */}
        <div className="min-w-0">
          {off && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-rose-500">{off}%</span>
              <span className="text-slate-400 line-through">
                ₩{meta.originalPrice!.toLocaleString()}
              </span>
            </div>
          )}
          <div
            className={`text-xl font-black sm:text-2xl ${
              isPaid ? 'text-slate-900' : 'text-emerald-600'
            }`}
          >
            {formatPrice(course.price)}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setWished((v) => !v)}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-300 text-lg hover:bg-slate-50"
            aria-label="찜하기"
          >
            {wished ? '❤️' : '🤍'}
          </button>
          <button className="hidden h-11 rounded-xl border border-slate-300 px-4 font-semibold text-slate-700 hover:bg-slate-50 sm:block">
            무료 보기
          </button>
          <button className="h-11 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 px-6 font-bold text-white hover:opacity-90">
            {isPaid ? '구매하기' : '무료로 시청하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
