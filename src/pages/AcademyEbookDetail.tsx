import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { formatPrice } from '../data/mock'
import { useBizData } from '../lib/useBizData'
import { EXPERT_CREDENTIALS, pseudoRating, maskName } from '../data/mockMarketplace'
import { getEbook, ebookDiscountPct, EBOOKS } from '../data/mockEbooks'
import EbookCard from '../components/EbookCard'

// 전자책 후기 (목업)
const REVIEWS = [
  { id: 'er_a', name: '관장 J', text: '바로 써먹을 수 있는 내용이라 좋았어요. 실무에 딱입니다.' },
  { id: 'er_b', name: '도장 운영 K', text: '정리가 깔끔해서 이해가 빨라요. 분량도 적당합니다.' },
  { id: 'er_c', name: '예비 창업 P', text: '이 가격에 이 정보면 충분히 만족합니다. 추천해요.' },
]

const NOTICES = [
  '전자책은 구매 후 마이페이지 > 내 자료에서 다시 열람할 수 있습니다.',
  '콘텐츠의 무단 복제·배포·공유는 저작권법에 의해 금지됩니다.',
  '디지털 상품 특성상 열람 후 환불이 제한될 수 있습니다. 자세한 내용은 고객센터로 문의해 주세요.',
]

const TABS = [
  { id: 'intro', label: '소개' },
  { id: 'reader', label: '미리보기' },
  { id: 'author', label: '저자소개' },
  { id: 'reviews', label: '후기' },
]

export default function AcademyEbookDetail() {
  const { id } = useParams()
  const { experts } = useBizData()
  const ebook = getEbook(id ?? '')
  // 데모: 무료책은 처음부터 열람, 유료책은 '구매하기'를 누르면 전체 열람(결제 연동 전)
  const [unlocked, setUnlocked] = useState(false)

  if (!ebook) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="text-5xl">🤔</div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">전자책을 찾을 수 없어요</h1>
        <Link
          to="/academy/ebooks"
          className="mt-6 inline-block rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white"
        >
          전자책 목록으로
        </Link>
      </div>
    )
  }

  const isPaid = ebook.price > 0
  const off = ebookDiscountPct(ebook.price, ebook.originalPrice)
  const canRead = !isPaid || unlocked
  // 저자명을 강사 데이터와 매칭해 약력/크리덴셜 재사용
  const authorExpert = experts.find((e) => e.name === ebook.author)
  const credentials = authorExpert ? EXPERT_CREDENTIALS[authorExpert.id] ?? [] : []
  const related = EBOOKS.filter((e) => e.author === ebook.author && e.id !== ebook.id)

  return (
    <div className="pb-28">
      {/* 1. 히어로 (강의 상세와 동일 레이아웃) */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 md:py-14">
          <div
            className={`grid aspect-video place-items-center rounded-2xl bg-gradient-to-br ${ebook.cover} text-7xl`}
          >
            {ebook.emoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-700">
                전자책
              </span>
              {ebook.isNew && (
                <span className="rounded-full bg-violet-600 px-2.5 py-1 text-xs font-bold text-white">
                  NEW
                </span>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-black leading-tight text-slate-900 sm:text-3xl">
              {ebook.title}
            </h1>
            <p className="mt-2 text-slate-600">{ebook.subtitle}</p>

            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-violet-100 text-base">
                {ebook.avatar}
              </span>
              <span className="font-semibold text-slate-700">{ebook.author}</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="font-semibold text-amber-400">
                ★ <span className="text-slate-700">{ebook.rating.toFixed(1)}</span>
              </span>
              <span>· 구매 {ebook.buyerCount.toLocaleString()}명</span>
              <span>· {ebook.pageCount}쪽</span>
            </div>

            <div className="mt-5 flex items-end gap-2">
              {off && (
                <>
                  <span className="text-lg font-bold text-rose-500">{off}%</span>
                  <span className="mb-0.5 text-slate-400 line-through">
                    ₩{ebook.originalPrice!.toLocaleString()}
                  </span>
                </>
              )}
              <span
                className={`text-3xl font-black ${isPaid ? 'text-slate-900' : 'text-emerald-600'}`}
              >
                {formatPrice(ebook.price)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 스티키 앵커 탭 */}
      <nav className="sticky top-[7.25rem] z-30 border-b border-slate-200 bg-white/90 backdrop-blur md:top-[7rem]">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6">
          {TABS.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className="whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-sm font-medium text-slate-600 hover:border-violet-500 hover:text-violet-600"
            >
              {t.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-3xl space-y-14 px-4 py-12 sm:px-6">
        {/* 3. 소개 */}
        <section id="intro" className="scroll-mt-32">
          <h2 className="text-xl font-black text-slate-900">소개</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
              📅 업데이트 26.03.13
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
              📄 {ebook.pageCount}쪽
            </span>
          </div>
          <p className="mt-4 leading-relaxed text-slate-600">{ebook.summary}</p>
          <div className="mt-6 grid aspect-[16/7] place-items-center rounded-2xl border border-slate-200 bg-slate-100 text-sm text-slate-400">
            🖼️ 상세 이미지 영역 (저자가 편집)
          </div>
        </section>

        {/* 4. 미리보기 — 강의의 '커리큘럼/영상' 자리를 PDF 뷰어로 대체 */}
        <section id="reader" className="scroll-mt-32">
          <h2 className="text-xl font-black text-slate-900">{canRead ? '전체 읽기' : '미리보기'}</h2>
          <p className="mt-1 text-sm text-slate-500">총 {ebook.pageCount}쪽</p>

          <div className="relative mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            <iframe
              src={`${ebook.pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
              title={ebook.title}
              className="h-[520px] w-full"
            />
            {!canRead && (
              <div className="absolute inset-x-0 bottom-0 flex h-2/3 flex-col items-center justify-end bg-gradient-to-t from-white via-white/90 to-transparent p-6 text-center">
                <div className="text-3xl">🔒</div>
                <p className="mt-2 font-bold text-slate-800">미리보기는 여기까지예요</p>
                <p className="mt-1 text-sm text-slate-500">
                  구매하면 전체 {ebook.pageCount}쪽을 모두 읽을 수 있어요.
                </p>
                <button
                  onClick={() => setUnlocked(true)}
                  className="mt-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 px-6 py-2.5 font-bold text-white hover:opacity-90"
                >
                  {formatPrice(ebook.price)} · 구매하고 전체 읽기
                </button>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            * 데모용 샘플 PDF예요. 실제 전자책은 업로드한 파일로 표시됩니다.
          </p>
        </section>

        {/* 5. 저자소개 (강의의 '강사소개'와 동일) */}
        <section id="author" className="scroll-mt-32">
          <h2 className="text-xl font-black text-slate-900">저자소개</h2>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-violet-100 text-4xl">
                {ebook.avatar}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{ebook.author}</h3>
                {authorExpert && (
                  <p className="text-sm font-medium text-violet-600">{authorExpert.title}</p>
                )}
                {authorExpert?.bio && (
                  <p className="mt-2 leading-relaxed text-slate-600">{authorExpert.bio}</p>
                )}
              </div>
            </div>
            {credentials.length > 0 && (
              <ul className="mt-4 grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2">
                {credentials.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-violet-500">✓</span> {c}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* 6. 이 책의 핵심 (강의의 '이런 걸 배워요'와 동일) */}
        <section className="scroll-mt-32">
          <h2 className="text-xl font-black text-slate-900">이 책의 핵심</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {ebook.highlights.map((w, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4"
              >
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet-100 text-sm text-violet-600">
                  ✓
                </span>
                <span className="text-slate-700">{w}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 7. 후기 */}
        <section id="reviews" className="scroll-mt-32">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-black text-slate-900">독자 후기</h2>
            <span className="text-sm text-slate-500">
              <span className="font-bold text-amber-400">★</span>{' '}
              <span className="font-semibold text-slate-700">{ebook.rating.toFixed(1)}</span> ·{' '}
              {REVIEWS.length}개
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {REVIEWS.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">{maskName(r.name)}</span>
                </div>
                <div className="mt-1 text-amber-400">{'★'.repeat(pseudoRating(r.id))}</div>
                <p className="mt-2 leading-relaxed text-slate-600">{r.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 9. 주의사항 */}
        <section className="scroll-mt-32">
          <h2 className="text-xl font-black text-slate-900">⚠️ 주의사항</h2>
          <ul className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            {NOTICES.map((n, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-slate-400">{i + 1}.</span> {n}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* 8. 이 저자의 다른 전자책 (강의의 '강사의 다른 강의'와 동일) */}
      {related.length > 0 && (
        <section className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h2 className="text-xl font-black text-slate-900">{ebook.author} 저자의 다른 전자책</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((e) => (
                <EbookCard key={e.id} ebook={e} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 하단 고정 구매바 */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            {off && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-rose-500">{off}%</span>
                <span className="text-slate-400 line-through">
                  ₩{ebook.originalPrice!.toLocaleString()}
                </span>
              </div>
            )}
            <div
              className={`text-xl font-black sm:text-2xl ${
                isPaid ? 'text-slate-900' : 'text-emerald-600'
              }`}
            >
              {formatPrice(ebook.price)}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <a
              href="#reader"
              className="hidden h-11 items-center rounded-xl border border-slate-300 px-4 font-semibold text-slate-700 hover:bg-slate-50 sm:flex"
            >
              미리보기
            </a>
            {canRead ? (
              <a
                href="#reader"
                className="flex h-11 items-center rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 px-6 font-bold text-white hover:opacity-90"
              >
                바로 읽기
              </a>
            ) : (
              <button
                onClick={() => setUnlocked(true)}
                className="h-11 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 px-6 font-bold text-white hover:opacity-90"
              >
                구매하기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
