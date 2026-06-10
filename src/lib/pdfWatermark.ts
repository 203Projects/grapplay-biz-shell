// 캔버스에 반복·회전 워터마크 그리기 — 전자책 무단 캡처/배포 억제 (요청 ⑫)
export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string,
) {
  if (!text) return
  ctx.save()
  ctx.globalAlpha = 0.1
  ctx.fillStyle = '#475569'
  const font = Math.max(14, Math.round(width / 30))
  ctx.font = `600 ${font}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.translate(width / 2, height / 2)
  ctx.rotate(-Math.PI / 6)
  const stepX = Math.max(220, width / 2)
  const stepY = Math.max(120, height / 6)
  for (let y = -height; y <= height; y += stepY) {
    for (let x = -width; x <= width; x += stepX) {
      ctx.fillText(text, x, y)
    }
  }
  ctx.restore()
}

// 워터마크 문구 — 사용자 이메일 + 열람일시
export function watermarkText(email?: string | null): string {
  const who = email || '구매자 본인'
  const today = new Date().toISOString().slice(0, 10)
  return `${who} · ${today}`
}
