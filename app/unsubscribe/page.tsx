import { verifyUnsubscribeToken, verifySubscriberToken } from '@/lib/unsubscribe-token'
import { createAdminClient } from '@/lib/supabase/admin'
import Image from 'next/image'

interface Props {
  searchParams: Promise<{ uid?: string; email?: string; token?: string }>
}

export default async function UnsubscribePage({ searchParams }: Props) {
  const { uid, email, token } = await searchParams

  let status: 'success' | 'already' | 'invalid' = 'invalid'
  let isBlogSubscriber = false

  if (email && token && verifySubscriberToken(email, token)) {
    // ── Blog subscriber unsubscribe ──
    isBlogSubscriber = true
    try {
      const supabase = createAdminClient()

      const { data: subscriber } = await supabase
        .from('blog_subscribers')
        .select('unsubscribed_at')
        .eq('email', email.toLowerCase().trim())
        .single()

      if (!subscriber) {
        status = 'invalid'
      } else if (subscriber.unsubscribed_at) {
        status = 'already'
      } else {
        const { error } = await supabase
          .from('blog_subscribers')
          .update({ unsubscribed_at: new Date().toISOString() })
          .eq('email', email.toLowerCase().trim())

        status = error ? 'invalid' : 'success'
      }
    } catch {
      status = 'invalid'
    }

  } else if (uid && token && verifyUnsubscribeToken(uid, token)) {
    // ── Platform user unsubscribe ──
    try {
      const supabase = createAdminClient()

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
      body: isBlogSubscriber
        ? 'You will no longer receive blog updates from AlwaysReady.'
        : 'You will no longer receive tips and updates from AlwaysReady. You will still receive important account and billing notices.',
    },
    already: {
      heading: 'You are already unsubscribed.',
      body: 'Your email address is not receiving any non-essential emails from AlwaysReady.',
    },
    invalid: {
      heading: 'This link is not valid.',
      body: isBlogSubscriber
        ? 'The unsubscribe link may have expired or already been used. If you continue to receive unwanted emails, please reply to any email from us and ask to be removed.'
        : 'The unsubscribe link may have expired or already been used. If you continue to receive unwanted emails, please contact us via the Support tab inside the platform.',
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
