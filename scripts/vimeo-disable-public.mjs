// 기존 Vimeo 영상 전체를 임베드 전용(view: 'disable')으로 일괄 변경.
// vimeo.com 공개 페이지를 없애 플레이어 우클릭 "Vimeo에서 보기"를 차단한다.
//
// 사용법 (PowerShell):
//   $env:VIMEO_ACCESS_TOKEN = "여기에_토큰"; node scripts/vimeo-disable-public.mjs
//   (미리보기만:  ... node scripts/vimeo-disable-public.mjs --dry)
//
// 토큰은 vimeo-create-upload 엣지 함수가 쓰는 VIMEO_ACCESS_TOKEN 과 동일.
// 권한(scope)에 'edit' 가 있어야 PATCH 가 된다. Plus 플랜에서 view:'disable' 지원.

const TOKEN = process.env.VIMEO_ACCESS_TOKEN
const DRY = process.argv.includes('--dry')

if (!TOKEN) {
  console.error('환경변수 VIMEO_ACCESS_TOKEN 이 필요합니다.')
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.vimeo.*+json;version=3.4',
}

async function listAll() {
  const videos = []
  let next = '/me/videos?per_page=100&fields=uri,name,privacy.view'
  while (next) {
    const res = await fetch(`https://api.vimeo.com${next}`, { headers })
    if (!res.ok) {
      throw new Error(`목록 조회 실패 ${res.status}: ${await res.text()}`)
    }
    const data = await res.json()
    videos.push(...data.data)
    next = data.paging?.next ?? null
  }
  return videos
}

async function disable(uri) {
  const res = await fetch(`https://api.vimeo.com${uri}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ privacy: { view: 'disable', embed: 'public' } }),
  })
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
}

const all = await listAll()
console.log(`총 ${all.length}개 영상 발견.`)

let changed = 0
let skipped = 0
for (const v of all) {
  const id = v.uri.split('/').pop()
  const view = v.privacy?.view
  if (view === 'disable') {
    skipped++
    continue
  }
  if (DRY) {
    console.log(`[dry] ${id}  ${view} → disable   "${v.name ?? ''}"`)
    changed++
    continue
  }
  try {
    await disable(v.uri)
    changed++
    console.log(`✓ ${id}  ${view} → disable   "${v.name ?? ''}"`)
  } catch (e) {
    console.error(`✗ ${id}  실패: ${e.message}`)
  }
}

console.log(`\n완료. 변경 ${changed}개, 이미 disable ${skipped}개${DRY ? ' (dry-run, 실제 변경 없음)' : ''}.`)
