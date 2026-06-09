import * as tus from 'tus-js-client'
import { supabase } from './supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

interface CreateResult {
  uploadLink: string
  videoId: string
  embedUrl: string
}

// Edge Function에 업로드 티켓 요청 (전문가 인증 필요)
async function createVimeoUpload(file: File): Promise<CreateResult> {
  if (!supabase) throw new Error('연결이 설정되지 않았습니다.')
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('로그인이 필요합니다.')

  const res = await fetch(`${SUPABASE_URL}/functions/v1/vimeo-create-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ size: file.size, name: file.name }),
  })
  const data = await res.json()
  if (!res.ok || !data.ok) throw new Error(data.message || 'Vimeo 업로드 생성 실패')
  return { uploadLink: data.uploadLink, videoId: data.videoId, embedUrl: data.embedUrl }
}

// tus로 Vimeo에 직접 업로드. onProgress(0~100) 콜백. 완료 시 임베드 URL 반환.
export function uploadVideoToVimeo(
  file: File,
  onProgress: (pct: number) => void,
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const { uploadLink, embedUrl } = await createVimeoUpload(file)
      const upload = new tus.Upload(file, {
        uploadUrl: uploadLink, // Vimeo가 발급한 tus 엔드포인트
        retryDelays: [0, 1000, 3000, 5000],
        metadata: { filename: file.name, filetype: file.type },
        onError: (err) => reject(err),
        onProgress: (sent, total) => onProgress(Math.round((sent / total) * 100)),
        onSuccess: () => resolve(embedUrl),
      })
      upload.start()
    } catch (e) {
      reject(e)
    }
  })
}
