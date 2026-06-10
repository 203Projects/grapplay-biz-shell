// 캔버스에 반복·회전 워터마크 그리기 — 전자책 무단 캡처/배포 억제 (요청 ⑫)
export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string,
) {
  if (!text) return
  ctx.save()
  ctx.globalAlpha = 0.05
  ctx.fillStyle = '#475569'
  const font = Math.max(13, Math.round(width / 42))
  ctx.font = `500 ${font}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.translate(width / 2, height / 2)
  ctx.rotate(-Math.PI / 6)
  // 타일 간격을 넓혀 반복 수를 이전의 1/3 수준으로 — 읽기 방해 최소화, 추적은 유지
  const stepX = Math.max(360, width / 1.5)
  const stepY = Math.max(260, height / 3)
  for (let y = -height; y <= height; y += stepY) {
    for (let x = -width; x <= width; x += stepX) {
      ctx.fillText(text, x, y)
    }
  }
  ctx.restore()
}

// 워터마크 문구 — 구매자 이메일(유출 시 누구인지 특정). 날짜는 추적에 불필요해 제외.
export function watermarkText(email?: string | null): string {
  return email || '구매자 본인'
}
