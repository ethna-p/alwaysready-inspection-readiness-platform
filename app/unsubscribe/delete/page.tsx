import { redirect } from 'next/navigation'
import Image from 'next/image'
import { verifySubscriberToken } from '@/lib/unsubscribe-token'
import { deleteBlogSubscriberData } from './actions'

interface Props {
  searchParams: Promise<{ email?: string; token?: string; done?: string }>
}

// Deletion is destructive and irreversible, so unlike /unsubscribe (which
// acts on the GET request itself), this page only ever reads state on GET.
// The actual delete only happens from the confirm button below, via a POST
// form action, then redirects back here with ?done=1 to show the result.
export default async function DeleteMyDataPage({ searchParams }: Props) {
  const { email, token, done } = await searchParams

  const tokenValid = !!(email && token && verifySubscriberToken(email, token))

  async function confirmDelete() {
    'use server'
    if (!email || !token) return
    await deleteBlogSubscriberData(email, token)
    redirect(`/unsubscribe/delete?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}&done=1`)
  }

  let heading: string
  let body: string
  let showConfirmForm = false

  if (!tokenValid) {
    heading = 'This link is not valid.'
    body = 'The link may have expired or already been used. If you would still like your data deleted, please reply to any email from us and ask to be removed.'
  } else if (done === '1') {
    heading = 'Your data has been deleted.'
    body = 'Your email address, name, and subscription record have been permanently removed. You will not receive any further emails from us unless you subscribe again in future.'
  } else {
    heading = 'Delete your AlwaysReady blog subscriber data?'
    body = 'This permanently removes your email address, name, and subscription record from our systems. It cannot be undone. If you would prefer to simply stop receiving emails while we keep your subscription record, use the unsubscribe link instead.'
    showConfirmForm = true
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#faf9f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    }}>
      <div style={{
        maxWidth: 520,
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(1,77,78,0.12)',
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#014D4E',
          padding: '28px 40px',
          borderBottom: '4px solid #ffd700',
        }}>
          <Image
            src="/alwaysready-logo.svg"
            alt="AlwaysReady"
            width={180}
            height={40}
            priority
          />
        </div>

        {/* Body */}
        <div style={{ padding: '40px 40px 32px' }}>
          <h1 style={{
            margin: '0 0 16px',
            fontSize: 20,
            fontWeight: 700,
            color: '#014D4E',
          }}>
            {heading}
          </h1>
          <p style={{
            margin: '0 0 24px',
            fontSize: 15,
            lineHeight: 1.7,
            color: '#1a1a1a',
          }}>
            {body}
          </p>

          {showConfirmForm ? (
            <form action={confirmDelete}>
              <button
                type="submit"
                style={{
                  display: 'inline-block',
                  backgroundColor: '#b91c1c',
                  color: '#ffffff',
                  padding: '10px 20px',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Yes, permanently delete my data
              </button>
            </form>
          ) : (
            <a
              href="https://alwaysready.uk"
              style={{
                display: 'inline-block',
                backgroundColor: '#014D4E',
                color: '#ffffff',
                padding: '10px 20px',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Return to alwaysready.uk
            </a>
          )}
        </div>

        {/* Footer */}
        <div style={{
          backgroundColor: '#faf9f6',
          borderTop: '1px solid #e8e6e0',
          padding: '16px 40px',
          textAlign: 'center',
        }}>
          <p style={{ margin: 0, fontSize: 12, color: '#888', lineHeight: 1.6 }}>
            AlwaysReady is a product of Parker Digital &amp; Print Services<br />
            82A James Carter Road, Mildenhall, IP28 7DE
          </p>
        </div>
      </div>
    </div>
  )
}
