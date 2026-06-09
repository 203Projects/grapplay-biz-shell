import { useState } from 'react'
import { useBizData } from '../../../lib/useBizData'
import { createExpert, updateExpert, type ExpertInput } from '../../../lib/adminApi'
import { CATEGORIES, type Category, type Expert } from '../../../data/mock'

// 전문가 관리 — 전문가 레코드 생성/수정 (회원을 전문가로 승격하기 전 단계)
export default function ExpertsTab() {
  const { experts, refetch, loading } = useBizData()
  const [editing, setEditing] = useState<Expert | 'new' | null>(null)

  if (loading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-stone-100" />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500">
          전문가 {experts.length}명. 회원 탭에서 전문가로 승격하려면 먼저 여기서 전문가를 만들어
          연결하세요.
        </p>
        <button
          onClick={() => setEditing('new')}
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700"
        >
          + 새 전문가
        </button>
      </div>

      {editing && (
        <ExpertForm
          expert={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            refetch()
          }}
        />
      )}

      <div className="space-y-3">
        {experts.map((e) => (
          <div
            key={e.id}
            className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4"
          >
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-violet-100 text-2xl">
              {e.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-stone-900">{e.name}</h3>
                {e.category && (
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-700">
                    {e.category}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500">{e.title}</p>
              <p className="font-mono text-[11px] text-stone-400">{e.id}</p>
            </div>
            <button
              onClick={() => setEditing(e)}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50"
            >
              편집
            </button>
          </div>
        ))}
        {experts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-12 text-center text-sm text-stone-500">
            아직 등록된 전문가가 없어요.
          </div>
        )}
      </div>
    </div>
  )
}

function ExpertForm({
  expert,
  onClose,
  onSaved,
}: {
  expert: Expert | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(expert?.name ?? '')
  const [title, setTitle] = useState(expert?.title ?? '')
  const [avatar, setAvatar] = useState(expert?.avatar ?? '🧑‍🏫')
  const [bio, setBio] = useState(expert?.bio ?? '')
  const [category, setCategory] = useState<Category | undefined>(expert?.category)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!name.trim() || !title.trim()) return alert('이름과 직함을 입력하세요.')
    setBusy(true)
    const input: ExpertInput = { name: name.trim(), title: title.trim(), avatar, bio: bio.trim(), category }
    const { error } = expert
      ? await updateExpert(expert.id, input)
      : await createExpert(input)
    setBusy(false)
    if (error) return alert('저장 실패: ' + error)
    onSaved()
  }

  const input = 'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-violet-400'

  return (
    <div className="space-y-3 rounded-2xl border border-violet-200 bg-violet-50 p-5">
      <h3 className="font-bold text-stone-900">{expert ? '전문가 편집' : '새 전문가 등록'}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" />
        <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="직함 (예: 주짓수 블랙벨트)" />
      </div>
      <input className={input} value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="아바타 이모지 (예: 🥋)" />
      <div>
        <div className="mb-1.5 text-xs font-medium text-stone-500">전문 분야 (카테고리)</div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(category === c.key ? undefined : c.key)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                category === c.key
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-300 bg-white text-stone-600 hover:bg-stone-100'
              }`}
            >
              {c.emoji} {c.key}
            </button>
          ))}
        </div>
      </div>
      <textarea className={input} rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="소개" />
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={busy}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          저장
        </button>
        <button
          onClick={onClose}
          className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-white"
        >
          취소
        </button>
      </div>
    </div>
  )
}
