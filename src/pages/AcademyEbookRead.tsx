import { useEffect, useState } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { useBizData } from '../lib/useBizData'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import PdfReader from '../components/PdfReader'
import { watermarkText } from '../lib/pdfWatermark'

const NOTICES = [
  '전자책은 마이페이지 > 내 강의에서 다시 열람할 수 있습니다.',
  '다운로드는 제공되지 않으며, 모든 페이지에 열람자 정보가 워터마크로 표시됩니다.',
  '콘텐츠의 무단 복제·배포·공유는 저작권법에 의해 금지됩니다.',
]

export default function AcademyEbookRead() {
  const { id } = useParams()
  const { getEbook, loading } = useBizData()
  const { user } = useAuth()
  const ebook = getEbook(id ?? '')

  const [enrolled, setEnrolled] = useState<boolean | null>(null)

  useEffect(() => {
    if (!user || !supabase || !id) {
      setEnrolled(false)
      return
    }
    let active = true
    supabase
      .from('enrollments')
      .select('item_id')
      .eq('user_id', user.id)
      .eq('item_type', 'ebook')
      .eq('item_id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setEnrolled(!!data)
      })
    return () => {
      active = false
    }
  }, [user, id])

  if (loading || enrolled === null) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    )
  }

  if (!ebook) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="text-5xl">🤔</div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">전자책을 찾을 수 없어요</h1>
        <Link to="/ebooks" className="mt-6 inline-block rounded-xl bg-zinc-900 px-6 py-3 font-semibold text-white hover:bg-zinc-800">
          전자책 목록으로
        </Link>
      </div>
    )
  }

  // 미등록자는 판매(상세) 페이지로
  if (!enrolled) {
    return <Navigate to={`/ebooks/${ebook.id}`} replace />
  }

  return (
    <div className="bg-stone-900 text-white">
      {/* 상단 바 */}
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link to="/my" className="text-xl text-white/80 hover:text-white">
          ←
        </Link>
        <span className="truncate font-bold">{ebook.title}</span>
        <span className="ml-auto shrink-0 text-sm text-white/50">{ebook.pageCount}쪽</span>
      </div>

      {/* PDF 뷰어 — 다운로드 불가(canvas 렌더) + 워터마크 */}
      <div className="mx-auto max-w-5xl px-4 pb-6 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <PdfReader url={ebook.pdfUrl} watermark={watermarkText(user?.email)} />
        </div>

        <ul className="mt-4 space-y-1.5 text-xs text-white/50">
          {NOTICES.map((n, i) => (
            <li key={i} className="flex gap-2">
              <span>{i + 1}.</span> {n}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
