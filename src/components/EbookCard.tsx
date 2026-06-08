import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../data/mock'
import { Ebook, ebookDiscountPct } from '../data/mockEbooks'

export default function EbookCard({ ebook }: { ebook: Ebook }) {
  const [wished, setWished] = useState(false)
  const isPaid = ebook.price > 0
  const off = ebookDiscountPct(ebook.price, ebook.originalPrice)

  return (
    <Link
      to={`/academy/ebooks/${ebook.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60"
    >
      {/* 표지 — 가로 비율 */}
      <div className={`relative aspect-[16/10] bg-gradient-to-br ${ebook.cover}`}>
        <span className="absolute inset-0 grid place-items-center text-5xl">{ebook.emoji}</span>
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700">
          전자책
        </span>
        {ebook.isNew && (
          <span className="absolute left-3 bottom-3 rounded-full bg-violet-600 px-2 py-0.5 text-[11px] font-bold text-white">
            NEW
          </span>
        )}
        <button
          onClick={(e) => {
            e.preventDefault()
            setWished((v) => !v)
          }}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-sm shadow-sm transition hover:scale-110"
          aria-label="찜하기"
        >
          {wished ? '❤️' : '🤍'}
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-bold leading-snug text-slate-900 group-hover:text-violet-700">
          {ebook.title}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
          <span>
            {ebook.avatar} {ebook.author}
          </span>
          <span>· ★ {ebook.rating.toFixed(1)}</span>
          <span>· {ebook.pageCount}p</span>
        </div>

        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            {off && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-rose-500">{off}%</span>
                <span className="text-slate-400 line-through">
                  ₩{ebook.originalPrice!.toLocaleString()}
                </span>
              </div>
            )}
            <span
              className={`text-lg font-black ${isPaid ? 'text-slate-900' : 'text-emerald-600'}`}
            >
              {formatPrice(ebook.price)}
            </span>
          </div>
          <span className="text-sm font-semibold text-violet-600 group-hover:underline">
            보기 →
          </span>
        </div>
      </div>
    </Link>
  )
}
