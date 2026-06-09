import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './auth'
import { supabase } from './supabase'
import { addWishlist, removeWishlist, type ItemType } from './userData'

// 위시리스트 전역 상태 — 한 번 로드해서 모든 하트(카드/구매바)가 동기화되게 함
interface WishlistCtx {
  isWished: (type: ItemType, id: string) => boolean
  toggle: (type: ItemType, id: string) => Promise<void>
}

const Ctx = createContext<WishlistCtx | null>(null)
const key = (type: ItemType, id: string) => `${type}:${id}`

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [set, setSet] = useState<Set<string>>(new Set())

  // 로그인 시 위시 전체 로드 (로그아웃 시 비움)
  useEffect(() => {
    if (!user || !supabase) {
      setSet(new Set())
      return
    }
    let active = true
    supabase
      .from('wishlist')
      .select('item_type, item_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (!active) return
        setSet(new Set((data ?? []).map((r: any) => key(r.item_type, r.item_id))))
      })
    return () => {
      active = false
    }
  }, [user])

  const isWished = useCallback((type: ItemType, id: string) => set.has(key(type, id)), [set])

  const toggle = useCallback(
    async (type: ItemType, id: string) => {
      if (!user) {
        navigate('/auth?returnTo=' + encodeURIComponent(window.location.pathname))
        return
      }
      const k = key(type, id)
      const next = !set.has(k)
      // 낙관적 업데이트
      setSet((prev) => {
        const n = new Set(prev)
        if (next) n.add(k)
        else n.delete(k)
        return n
      })
      const { error } = next
        ? await addWishlist(user.id, type, id)
        : await removeWishlist(user.id, type, id)
      if (error) {
        // 롤백
        setSet((prev) => {
          const n = new Set(prev)
          if (next) n.delete(k)
          else n.add(k)
          return n
        })
      }
    },
    [user, set, navigate],
  )

  return <Ctx.Provider value={{ isWished, toggle }}>{children}</Ctx.Provider>
}

export function useWishlist(): WishlistCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useWishlist must be used within <WishlistProvider>')
  return ctx
}
