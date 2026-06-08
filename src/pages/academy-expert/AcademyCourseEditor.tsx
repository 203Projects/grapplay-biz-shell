import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCourse, CATEGORIES, Category } from '../../data/mock'

type BlockType = 'heading' | 'text' | 'image'
interface Block {
  id: number
  type: BlockType
  value: string
}

let blockSeq = 100

export default function AcademyCourseEditor() {
  const { id } = useParams()
  const existing = id ? getCourse(id) : undefined
  const isEdit = !!existing

  // 기본 정보
  const [title, setTitle] = useState(existing?.title ?? '')
  const [subtitle, setSubtitle] = useState(existing?.subtitle ?? '')
  const [category, setCategory] = useState<Category>(existing?.category ?? '마케팅')

  // 판매 방식 (md §2.2 — is_subscription_excluded + price)
  const [saleMode, setSaleMode] = useState<'subscription' | 'single'>(
    existing?.isSubscriptionExcluded ? 'single' : 'subscription',
  )
  const [price, setPrice] = useState(String(existing?.price ?? 0))

  // 랜딩 페이지 (md §9.1 — use_landing_page + detail_blocks)
  const [useLanding, setUseLanding] = useState(false)
  const [blocks, setBlocks] = useState<Block[]>([
    { id: 1, type: 'heading', value: '왜 이 강의가 필요할까요?' },
    { id: 2, type: 'text', value: '체육관 운영의 현실적인 고민을 풀어드립니다.' },
    { id: 3, type: 'image', value: '' },
  ])

  // 커리큘럼
  const [lessons, setLessons] = useState<string[]>(
    existing?.curriculum.map((c) => c.title) ?? ['1강. 강의 소개'],
  )

  // 리워드 PDF (md §9.2 — review_reward_pdf_url)
  const [pdfName, setPdfName] = useState<string>('')

  function addBlock(type: BlockType) {
    setBlocks((b) => [...b, { id: ++blockSeq, type, value: '' }])
  }
  function updateBlock(id: number, value: string) {
    setBlocks((b) => b.map((x) => (x.id === id ? { ...x, value } : x)))
  }
  function removeBlock(id: number) {
    setBlocks((b) => b.filter((x) => x.id !== id))
  }
  function moveBlock(id: number, dir: -1 | 1) {
    setBlocks((b) => {
      const i = b.findIndex((x) => x.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= b.length) return b
      const copy = [...b]
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
      return copy
    })
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* 헤더 바 */}
      <div className="flex items-center justify-between">
        <Link
          to="/academy-expert/dashboard"
          className="text-sm text-stone-500 hover:text-amber-600"
        >
          ← 대시보드
        </Link>
        <div className="flex gap-2">
          <button className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50">
            미리보기
          </button>
          <button className="rounded-lg bg-stone-900 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-800">
            저장
          </button>
        </div>
      </div>

      <h1 className="mt-4 text-2xl font-black text-stone-900">
        {isEdit ? '강의 편집' : '새 강의 만들기'}
      </h1>

      <div className="mt-8 space-y-8">
        {/* 기본 정보 */}
        <Section title="기본 정보">
          <Field label="강의 제목">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 체육관 첫 100명 회원 만들기"
              className="w-full rounded-xl border border-stone-300 px-4 py-2.5 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </Field>
          <Field label="한 줄 소개">
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="강의를 한 문장으로 설명해 주세요"
              className="w-full rounded-xl border border-stone-300 px-4 py-2.5 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </Field>
          <Field label="카테고리">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    category === c.key
                      ? 'bg-stone-900 text-white'
                      : 'border border-stone-300 bg-white text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {c.emoji} {c.key}
                </button>
              ))}
            </div>
          </Field>
          <Field label="대표 이미지">
            <div className="grid place-items-center rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 py-10 text-center">
              <div className="text-2xl">🖼️</div>
              <button className="mt-2 rounded-lg border border-stone-300 bg-white px-4 py-1.5 text-sm font-semibold text-stone-600">
                이미지 업로드
              </button>
            </div>
          </Field>
        </Section>

        {/* 판매 방식 */}
        <Section title="판매 방식">
          <div className="grid gap-3 sm:grid-cols-2">
            <ModeCard
              active={saleMode === 'subscription'}
              onClick={() => setSaleMode('subscription')}
              title="구독 포함"
              desc="비즈 구독자가 무제한 시청"
              icon="🔓"
            />
            <ModeCard
              active={saleMode === 'single'}
              onClick={() => setSaleMode('single')}
              title="단품 판매"
              desc="구독과 별도로 개별 구매"
              icon="🛒"
              accent
            />
          </div>
          {saleMode === 'single' && (
            <Field label="판매 가격 (원)">
              <div className="relative max-w-xs">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                  ₩
                </span>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))}
                  inputMode="numeric"
                  className="w-full rounded-xl border border-stone-300 py-2.5 pl-8 pr-4 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
              </div>
              {Number(price) > 0 && (
                <p className="mt-2 text-xs text-stone-500">
                  정산 예상액(80%):{' '}
                  <span className="font-semibold text-stone-700">
                    ₩{Math.round(Number(price) * 0.8).toLocaleString()}
                  </span>{' '}
                  · 판매가 ₩{Number(price).toLocaleString()}
                </p>
              )}
            </Field>
          )}
        </Section>

        {/* 커리큘럼 */}
        <Section title="커리큘럼">
          <div className="space-y-2">
            {lessons.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-stone-100 text-sm font-bold text-stone-500">
                  {i + 1}
                </span>
                <input
                  value={l}
                  onChange={(e) =>
                    setLessons((arr) => arr.map((x, idx) => (idx === i ? e.target.value : x)))
                  }
                  className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-400"
                />
                <button
                  onClick={() => setLessons((arr) => arr.filter((_, idx) => idx !== i))}
                  className="grid h-8 w-8 place-items-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-rose-500"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setLessons((arr) => [...arr, `${arr.length + 1}강. 새 레슨`])}
            className="mt-3 rounded-lg border border-dashed border-stone-300 px-4 py-2 text-sm font-semibold text-stone-500 hover:border-amber-300 hover:text-amber-600"
          >
            + 레슨 추가
          </button>
        </Section>

        {/* 리치 상세페이지 (블록 에디터) */}
        <Section title="상세페이지 (랜딩)">
          <label className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4">
            <div>
              <div className="font-semibold text-stone-800">리치 상세페이지 사용</div>
              <div className="text-sm text-stone-500">
                켜면 이미지·텍스트 블록으로 만든 판매 랜딩이 표시됩니다.
              </div>
            </div>
            <Toggle on={useLanding} onChange={() => setUseLanding((v) => !v)} />
          </label>

          {useLanding && (
            <div className="mt-4 space-y-3">
              {blocks.map((b, i) => (
                <div key={b.id} className="rounded-xl border border-stone-200 bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-500">
                      {b.type === 'heading' ? '제목' : b.type === 'text' ? '텍스트' : '이미지'}
                    </span>
                    <div className="flex items-center gap-1 text-stone-400">
                      <button
                        onClick={() => moveBlock(b.id, -1)}
                        disabled={i === 0}
                        className="grid h-7 w-7 place-items-center rounded hover:bg-stone-100 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveBlock(b.id, 1)}
                        disabled={i === blocks.length - 1}
                        className="grid h-7 w-7 place-items-center rounded hover:bg-stone-100 disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeBlock(b.id)}
                        className="grid h-7 w-7 place-items-center rounded hover:bg-stone-100 hover:text-rose-500"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {b.type === 'image' ? (
                    <div className="grid place-items-center rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 py-8 text-sm text-stone-400">
                      🖼️ 이미지 업로드
                    </div>
                  ) : b.type === 'heading' ? (
                    <input
                      value={b.value}
                      onChange={(e) => updateBlock(b.id, e.target.value)}
                      placeholder="제목을 입력하세요"
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 text-lg font-bold outline-none focus:border-amber-400"
                    />
                  ) : (
                    <textarea
                      value={b.value}
                      onChange={(e) => updateBlock(b.id, e.target.value)}
                      placeholder="본문을 입력하세요"
                      rows={3}
                      className="w-full resize-none rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
                    />
                  )}
                </div>
              ))}

              <div className="flex flex-wrap gap-2">
                <AddBlockBtn label="+ 제목" onClick={() => addBlock('heading')} />
                <AddBlockBtn label="+ 텍스트" onClick={() => addBlock('text')} />
                <AddBlockBtn label="+ 이미지" onClick={() => addBlock('image')} />
              </div>
            </div>
          )}
        </Section>

        {/* 리뷰 리워드 PDF */}
        <Section title="리뷰 리워드 PDF">
          <p className="text-sm text-stone-500">
            수강생이 리뷰를 남기면 보내줄 PDF를 강의별로 등록하세요. (전문가가 직접 발송)
          </p>
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-100 text-lg">
              📄
            </div>
            <div className="flex-1 text-sm">
              {pdfName ? (
                <span className="font-medium text-stone-800">{pdfName}</span>
              ) : (
                <span className="text-stone-400">등록된 PDF가 없습니다.</span>
              )}
            </div>
            <button
              onClick={() => setPdfName('리뷰_리워드_가이드.pdf')}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50"
            >
              PDF 업로드
            </button>
          </div>
        </Section>
      </div>

      {/* 하단 저장 바 */}
      <div className="mt-10 flex justify-end gap-2 border-t border-stone-200 pt-6">
        <Link
          to="/academy-expert/dashboard"
          className="rounded-lg border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50"
        >
          취소
        </Link>
        <button className="rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-2.5 text-sm font-bold text-stone-900 hover:opacity-90">
          {isEdit ? '변경사항 저장' : '강의 등록'}
        </button>
      </div>
    </div>
  )
}

/* ── 작은 컴포넌트들 ── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-stone-50/50 p-5 sm:p-6">
      <h2 className="text-lg font-black text-stone-900">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-stone-700">{label}</label>
      {children}
    </div>
  )
}

function ModeCard({
  active,
  onClick,
  title,
  desc,
  icon,
  accent,
}: {
  active: boolean
  onClick: () => void
  title: string
  desc: string
  icon: string
  accent?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        active
          ? accent
            ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-200'
            : 'border-amber-400 bg-amber-50 ring-1 ring-amber-200'
          : 'border-stone-200 bg-white hover:border-stone-300'
      }`}
    >
      <div className="text-xl">{icon}</div>
      <div className="mt-1 font-bold text-stone-900">{title}</div>
      <div className="text-sm text-stone-500">{desc}</div>
    </button>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        on ? 'bg-amber-500' : 'bg-stone-300'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
          on ? 'left-[1.375rem]' : 'left-0.5'
        }`}
      />
    </button>
  )
}

function AddBlockBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-dashed border-stone-300 px-4 py-2 text-sm font-semibold text-stone-500 hover:border-amber-300 hover:text-amber-600"
    >
      {label}
    </button>
  )
}
