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
