'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="
        text-sm font-medium text-[#014D4E]
        hover:underline
        focus:outline-none focus:ring-2 focus:ring-[#014D4E] focus:ring-offset-2
        rounded
      "
    >
      Sign out
    </button>
  )
}
