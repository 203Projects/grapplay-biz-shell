import { supabase } from './supabase'

// 공개 'covers' 버킷에 이미지 업로드 → public URL 반환
export async function uploadToCovers(
  file: File,
  folder: string,
): Promise<{ url: string | null; error: string | null }> {
  if (!supabase) return { url: null, error: '연결이 설정되지 않았습니다.' }
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from('covers')
    .upload(path, file, { upsert: true, cacheControl: '3600' })
  if (error) return { url: null, error: error.message }
  const { data } = supabase.storage.from('covers').getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}
