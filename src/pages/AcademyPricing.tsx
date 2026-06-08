import { Link } from 'react-router-dom'

const PLANS = [
  {
    name: '개별 구매',
    price: '강의별',
    period: '1회 결제',
    desc: '필요한 강의만 골라서 평생 소장',
    highlight: false,
    features: [
      '원하는 강의 단품 구매',
      '구매한 강의 평생 다시보기',
      '모바일·PC 시청',
      '환불 정책 적용',
    ],
    cta: '강의 둘러보기',
    to: '/academy/library',
  },
  {
    name: '비즈 구독',
    price: '₩49,000',
    period: '월',
    desc: '비즈니스 교육 콘텐츠 전체 무제한',
    highlight: true,
    features: [
      '비즈 강의 전체 무제한 시청',
      '신규 강의 자동 추가',
      '전문가 디렉터리 열람',
      '언제든 해지 가능',
    ],
    cta: '비즈 구독 시작',
    to: '/academy/library',
  },
  {
    name: '번들 구독',
    price: '₩59,000',
    period: '월',
    desc: '그래플레이 + 비즈 동시 구독',
    highlight: false,
    features: [
      '비즈 강의 전체 무제한',
      '그래플레이 주짓수 콘텐츠 포함',
      '가장 합리적인 조합',
      '언제든 해지 가능',
    ],
    cta: '번들로 시작',
    to: '/academy/library',
  },
]

const FAQ = [
  {
    q: '단품 구매와 구독은 어떻게 다른가요?',
    a: '단품 구매는 고른 강의를 1회 결제로 평생 소장하는 방식이고, 구독은 월정액으로 비즈 강의 전체를 무제한 시청하는 방식입니다.',
  },
  {
    q: '구독은 언제든 해지할 수 있나요?',
    a: '네, 언제든 해지 가능합니다. 해지하면 다음 결제일부터 청구되지 않습니다.',
  },
  {
    q: '번들 구독은 무엇을 포함하나요?',
    a: '비즈니스 교육 콘텐츠와 그래플레이 주짓수 학습 콘텐츠를 모두 시청할 수 있는 통합 구독입니다.',
  },
  {
    q: '환불이 가능한가요?',
    a: '기존 그래플레이 환불 정책이 동일하게 적용됩니다. 자세한 내용은 고객센터로 문의해 주세요.',
  },
]

export default function AcademyPricing() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-black text-stone-900 sm:text-4xl">합리적인 요금제</h1>
        <p className="mx-auto mt-3 max-w-lg text-stone-500">
          필요한 강의만 사거나, 구독으로 전체를 누리세요. 정답은 없습니다.
        </p>
      </div>

      {/* 플랜 */}
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={`relative flex flex-col rounded-3xl border p-7 ${
              p.highlight
                ? 'border-amber-400 bg-white shadow-xl shadow-amber-100 ring-1 ring-amber-200'
                : 'border-stone-200 bg-white'
            }`}
          >
            {p.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-1 text-xs font-bold text-stone-900">
                가장 인기
              </span>
            )}
            <h3 className="text-lg font-bold text-stone-900">{p.name}</h3>
            <p className="mt-1 text-sm text-stone-500">{p.desc}</p>
            <div className="mt-5 flex items-end gap-1">
              <span className="text-3xl font-black text-stone-900">{p.price}</span>
              <span className="mb-1 text-sm text-stone-400">/ {p.period}</span>
            </div>
            <ul className="mt-6 flex-1 space-y-3 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-stone-600">
                  <span className="mt-0.5 text-amber-500">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to={p.to}
              className={`mt-7 rounded-xl py-3 text-center font-semibold ${
                p.highlight
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-stone-900 hover:opacity-90'
                  : 'border border-stone-300 text-stone-700 hover:bg-stone-50'
              }`}
            >
              {p.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="mx-auto mt-20 max-w-3xl">
        <h2 className="text-center text-2xl font-black text-stone-900">자주 묻는 질문</h2>
        <div className="mt-8 space-y-3">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-stone-200 bg-white p-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-stone-800">
                {f.q}
                <span className="text-stone-400 transition group-open:rotate-180">⌄</span>
              </summary>
              <p className="mt-3 leading-relaxed text-stone-600">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}
