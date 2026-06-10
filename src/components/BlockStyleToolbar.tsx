import type { DetailBlock } from '../data/mock'
import {
  SIZE_OPTIONS,
  WEIGHT_OPTIONS,
  ALIGN_OPTIONS,
  COLOR_SWATCHES,
} from '../lib/detailBlocks'

// heading/text 블록용 텍스트 꾸미기 툴바 — 크기/굵기/색상/정렬 (요청 ⑨)
export type BlockStyle = Pick<DetailBlock, 'size' | 'weight' | 'color' | 'align'>

export default function BlockStyleToolbar({
  value,
  onChange,
}: {
  value: BlockStyle
  onChange: (patch: BlockStyle) => void
}) {
  const chip = (active: boolean) =>
    `rounded-md px-2 py-1 text-xs font-medium transition ${
      active ? 'bg-stone-900 text-white' : 'border border-stone-300 bg-white text-stone-600 hover:bg-stone-100'
    }`

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 p-2">
      {/* 크기 */}
      <div className="flex items-center gap-1">
        <span className="mr-1 text-[11px] font-semibold text-stone-400">크기</span>
        {SIZE_OPTIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange({ ...value, size: o.key })}
            className={chip(value.size === o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* 굵기 */}
      <div className="flex items-center gap-1">
        <span className="mr-1 text-[11px] font-semibold text-stone-400">굵기</span>
        {WEIGHT_OPTIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange({ ...value, weight: o.key })}
            className={chip(value.weight === o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* 정렬 */}
      <div className="flex items-center gap-1">
        <span className="mr-1 text-[11px] font-semibold text-stone-400">정렬</span>
        {ALIGN_OPTIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange({ ...value, align: o.key })}
            className={chip(value.align === o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* 색상 */}
      <div className="flex items-center gap-1">
        <span className="mr-1 text-[11px] font-semibold text-stone-400">색상</span>
        {COLOR_SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange({ ...value, color: c })}
            style={{ backgroundColor: c }}
            className={`h-6 w-6 rounded-full ring-offset-1 transition ${
              value.color === c ? 'ring-2 ring-stone-900' : ''
            }`}
            aria-label={c}
          />
        ))}
        <input
          type="color"
          value={value.color ?? '#0f172a'}
          onChange={(e) => onChange({ ...value, color: e.target.value })}
          className="h-6 w-8 cursor-pointer rounded border border-stone-300 bg-white"
          aria-label="색상 직접 선택"
        />
        {value.color && (
          <button
            type="button"
            onClick={() => onChange({ ...value, color: undefined })}
            className="text-[11px] text-stone-400 underline hover:text-stone-600"
          >
            기본
          </button>
        )}
      </div>
    </div>
  )
}
