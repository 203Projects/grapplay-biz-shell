import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { drawWatermark } from '../lib/pdfWatermark'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

// 전자책 본문 뷰어 — 전체 페이지를 canvas로 렌더(브라우저 PDF 툴바=다운로드/인쇄 없음)
// + 페이지마다 워터마크. 우클릭/드래그 저장 방지(완전 차단 아님, 캐주얼 방지).
export default function PdfReader({
  url,
  watermark,
}: {
  url: string
  watermark?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false
    container.innerHTML = ''
    setLoading(true)
    setError(false)

    const task = pdfjsLib.getDocument({ url })
    task.promise
      .then(async (pdf) => {
        if (cancelled) return
        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p)
          if (cancelled) return
          const viewport = page.getViewport({ scale: 1.5 })
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          canvas.className = 'mx-auto mb-4 block w-full max-w-3xl rounded-lg shadow-lg'
          // 드래그로 이미지 저장 방지
          canvas.style.userSelect = 'none'
          ;(canvas.style as CSSStyleDeclaration & { webkitUserSelect?: string }).webkitUserSelect =
            'none'
          const ctx = canvas.getContext('2d')
          if (!ctx) continue
          container.appendChild(canvas)
          await page.render({ canvas, canvasContext: ctx, viewport }).promise
          if (cancelled) return
          drawWatermark(ctx, canvas.width, canvas.height, watermark ?? '')
        }
        if (!cancelled) setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
      task.destroy()
    }
  }, [url, watermark])

  return (
    <div
      className="select-none bg-stone-800 p-4"
      onContextMenu={(e) => e.preventDefault()}
    >
      {loading && (
        <div className="grid h-64 place-items-center text-sm text-white/50">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
        </div>
      )}
      {error && (
        <div className="grid h-64 place-items-center text-sm text-white/50">
          본문을 불러올 수 없어요.
        </div>
      )}
      <div ref={containerRef} />
    </div>
  )
}
