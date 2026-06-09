import { useSearchParams, Link } from 'react-router-dom'

export default function PaymentFail() {
  const [params] = useSearchParams()
  const code = params.get('code')
  const message = params.get('message')

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <div className="text-6xl">⚠️</div>
      <h1 className="mt-4 text-2xl font-black text-slate-900">결제가 취소됐어요</h1>
      <p className="mt-2 text-sm text-slate-500">{message || '결제가 완료되지 않았습니다.'}</p>
      {code && <p className="mt-1 text-xs text-slate-400">오류 코드: {code}</p>}
      <div className="mt-8 flex flex-col gap-2">
        <Link
          to="/"
          className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800"
        >
          홈으로
        </Link>
      </div>
    </div>
  )
}
