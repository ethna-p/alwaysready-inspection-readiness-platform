import { redirect } from 'next/navigation'

// Team management has moved to the Account settings page.
export default function TeamPageRedirect() {
  redirect('/dashboard/account')
}
