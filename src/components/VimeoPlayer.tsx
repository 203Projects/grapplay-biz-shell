import { useEffect, useRef } from 'react'
import Player from '@vimeo/player'

// Vimeo 임베드 iframe에 Player SDK를 붙여 재생 위치를 추적한다.
// - startSeconds: 이어보기 시작 지점(로드 후 seek)
// - onTime(seconds, duration): 재생 중 위치 보고(약 4초 간격) — 부모가 디바운스 저장
// Vimeo 임베드 URL(player.vimeo.com)에만 사용. 그 외(YouTube 등)는 부모가 일반 iframe으로 처리.
export default function VimeoPlayer({
  embed,
  startSeconds,
  onTime,
  title,
}: {
  embed: string
  startSeconds: number
  onTime: (seconds: number, duration: number) => void
  title?: string
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const onTimeRef = useRef(onTime)
  onTimeRef.current = onTime
  const startRef = useRef(startSeconds)
  startRef.current = startSeconds

  useEffect(() => {
    const el = iframeRef.current
    if (!el) return
    const player = new Player(el)
    let lastSent = -10

    // 로드되면 저장된 위치로 이동(영상 길이 근처는 처음부터)
    player
      .ready()
      .then(async () => {
        const s = startRef.current
        if (s <= 0) return
        const dur = await player.getDuration().catch(() => 0)
        if (dur && s < dur - 5) await player.setCurrentTime(s).catch(() => {})
      })
      .catch(() => {})

    const handleTime = (d: { seconds: number; duration: number }) => {
      // 4초 간격 또는 되감기 시에만 보고(과도한 저장 방지)
      if (d.seconds - lastSent >= 4 || d.seconds < lastSent - 1) {
        lastSent = d.seconds
        onTimeRef.current(d.seconds, d.duration)
      }
    }
    const handleEnded = (d: { duration: number }) => onTimeRef.current(d.duration, d.duration)

    player.on('timeupdate', handleTime)
    player.on('ended', handleEnded)

    return () => {
      player.off('timeupdate', handleTime)
      player.off('ended', handleEnded)
      player.destroy().catch(() => {})
    }
  }, [embed])

  return (
    <iframe
      ref={iframeRef}
      key={embed}
      src={embed}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="h-full w-full"
    />
  )
}
