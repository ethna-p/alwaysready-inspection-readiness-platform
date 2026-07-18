import { verifyUnsubscribeToken } from '@/lib/unsubscribe-token'
import { createAdminClient } from '@/lib/supabase/admin'
import Image from 'next/image'

interface Props {
  searchParams: Promise<{ uid?: string; token?: string }>
}

export default async function UnsubscribePage({ searchParams }: Props) {
  const { uid, token } = await searchParams

  let status: 'success' | 'already' | 'invalid' = 'invalid'

  if (uid && token && verifyUnsubscribeToken(uid, token)) {
    try {
      const supabase = createAdminClient()

      // Check current state first
      const { data: userRow } = await supabase
        .from('users')
        .select('marketing_opt_out')
        .eq('id', uid)
        .single()

      if (userRow?.marketing_opt_out) {
        status = 'already'
      } else {
        const { error } = await supabase
          .from('users')
          .update({ marketing_opt_out: true })
          .eq('id', uid)

        status = error ? 'invalid' : 'success'
      }
    } catch {
      status = 'invalid'
    }
  }

  const messages = {
    success: {
      heading: 'You have been unsubscribed.',
      body: 'You will no longer receive tips and updates from AlwaysReady. You will still receive important account and billing notices.',
    },
    already: {
      heading: 'You are already unsubscribed.',
      body: 'Your email address is not receiving any non-essential emails from AlwaysReady.',
    },
    invalid: {
      heading: 'This link is not valid.',
      body: 'The unsubscribe link may have expired or already been used. If you continue to receive unwanted emails, please contact us via the Support tab inside the platform.',
    },
  }

  const { heading, body } = messages[status]

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
          <a
            href="https://alwaysready-inspection-readiness-pl-three.vercel.app/login"
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
            Return to AlwaysReady
          </a>
        </div>

        {/* Footer */}
        <div style={{
          backgroundColor: '#faf9f6',
          borderTop: '1px solid #e8e6e0',
          padding: '16px 40px',
          textAlign: 'center',
        }}>
          <p style={{ margin: 0, fontSize: 12, color: '#888', lineHeight: 1.6 }}>
            AlwaysReady is a product of Parker Digital &amp; Print Services Ltd<br />
            82A James Carter Road, Mildenhall, IP28 7DE
          </p>
        </div>
      </div>
    </div>
  )
}
