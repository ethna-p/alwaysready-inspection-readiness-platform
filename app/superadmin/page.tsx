import { redirect } from 'next/navigation'

// Root /superadmin → /superadmin/provision
export default function SuperadminRoot() {
  redirect('/superadmin/provision')
}
