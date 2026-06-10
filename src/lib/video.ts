// YouTube/Vimeo 일반 URL → 임베드 URL 변환
export function toEmbedUrl(url?: string): string | null {
  if (!url) return null
  const u = url.trim()

  // YouTube
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`

  // 이미 player.vimeo 임베드 URL이면 그대로
  if (/player\.vimeo\.com\/video\//.test(u)) return u

  // Vimeo: vimeo.com/<id> 또는 비공개 vimeo.com/<id>/<hash>
  const vimeo = u.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/(\w+))?/)
  if (vimeo) {
    const base = `https://player.vimeo.com/video/${vimeo[1]}`
    return vimeo[2] ? `${base}?h=${vimeo[2]}` : base // 비공개 영상 해시 보존
  }

  return u // 그 외(직접 mp4 등)는 그대로
}

// Vimeo oEmbed로 영상 가로/세로 판별. 세로(9:16 등)면 true, 가로면 false.
// 판별 불가(YouTube·직접 링크·네트워크 오류 등)면 null → 호출부에서 기본(가로)로 처리.
export async function fetchVimeoPortrait(url?: string): Promise<boolean | null> {
  if (!url) return null
  // player.vimeo.com/video/<id>?h=<hash> 또는 vimeo.com/<id>/<hash> 모두 처리
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:[/?](?:h=)?(\w+))?/)
  if (!m) return null
  const page = m[2] ? `https://vimeo.com/${m[1]}/${m[2]}` : `https://vimeo.com/${m[1]}`
  try {
    const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(page)}`)
    if (!res.ok) return null
    const data = await res.json()
    if (typeof data.width === 'number' && typeof data.height === 'number') {
      return data.height > data.width
    }
    return null
  } catch {
    return null
  }
}
