// Vimeo 업로드 티켓 발급 (Supabase Edge Function, Deno)
// - 로그인 전문가만 호출. Vimeo 액세스 토큰은 서버에만.
// - tus 업로드 링크 + 영상 id + 임베드 URL 반환
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const VIMEO_TOKEN = Deno.env.get('VIMEO_ACCESS_TOKEN')
    if (!VIMEO_TOKEN) return json({ ok: false, message: 'VIMEO_ACCESS_TOKEN 미설정' }, 500)

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

    // 1) 사용자 검증 + 전문가 확인
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
    const {
      data: { user },
    } = await admin.auth.getUser(token)
    if (!user) return json({ ok: false, message: '인증이 필요합니다.' }, 401)
    const { data: profile } = await admin
      .from('profiles')
      .select('role, expert_id')
      .eq('id', user.id)
      .maybeSingle()
    // 전문가는 본인 강의에, 관리자는 모든 지도자 강의에 업로드 가능
    const isExpert = profile?.role === 'expert' && !!profile?.expert_id
    const isAdmin = profile?.role === 'admin'
    if (!isExpert && !isAdmin) {
      return json({ ok: false, message: '전문가 또는 관리자만 업로드할 수 있습니다.' }, 403)
    }

    // 2) 입력
    const { size, name } = await req.json()
    if (!size || typeof size !== 'number' || size <= 0) {
      return json({ ok: false, message: '파일 크기가 올바르지 않습니다.' }, 400)
    }

    // 3) Vimeo 업로드 생성 (tus)
    const vimeoRes = await fetch('https://api.vimeo.com/me/videos', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VIMEO_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.vimeo.*+json;version=3.4',
      },
      body: JSON.stringify({
        upload: { approach: 'tus', size },
        name: name || `course-video-${Date.now()}`,
        privacy: { view: 'unlisted', embed: 'public' },
      }),
    })
    const data = await vimeoRes.json()
    if (!vimeoRes.ok) {
      return json(
        { ok: false, message: data?.error || 'Vimeo 업로드 생성 실패', detail: data },
        400,
      )
    }

    const uploadLink: string = data?.upload?.upload_link
    const videoUri: string = data?.uri ?? '' // 예: /videos/123456789
    const videoId = videoUri.split('/').pop() ?? ''
    const embedUrl: string = data?.player_embed_url || `https://player.vimeo.com/video/${videoId}`

    if (!uploadLink) {
      return json({ ok: false, message: '업로드 링크를 받지 못했습니다.', detail: data }, 400)
    }

    return json({ ok: true, uploadLink, videoId, embedUrl })
  } catch (e) {
    return json({ ok: false, message: String(e) }, 500)
  }
})
