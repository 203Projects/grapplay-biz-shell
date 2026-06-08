import { EBOOKS } from '../data/mockEbooks'
import EbookCard from '../components/EbookCard'

export default function AcademyEbooks() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">전자책</h1>
      <p className="mt-2 text-slate-500">바로 읽는 체육관 경영 가이드 · 워크북</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {EBOOKS.map((e) => (
          <EbookCard key={e.id} ebook={e} />
        ))}
      </div>
    </div>
  )
}
