# Handoff: Contact Us Form → Platform Integration

## What this does
When someone submits the Contact Us form on www.alwaysready.uk, their message is sent directly to the AlwaysReady support desk as a ticket. AJ sees it in the superadmin panel and can reply from there.

## What you need to do
Update the Contact Us form on the marketing site so it submits to the platform webhook instead of its current destination.

## The endpoint
```
POST https://alwaysready-inspection-readiness-pl-three.vercel.app/api/contact-inbound
Content-Type: application/json
```

## Required fields
The form must send four fields, plus one optional:
- `name` — the sender's full name
- `email` — the sender's email address
- `subject` — whatever the sender types in the Subject field
- `message` — their message
- `blogSignup` — boolean (`true` / `false`); set to `true` if the blog signup checkbox is ticked. When true, the sender is also added to the blog_subscribers table automatically.

## Recommended implementation
Use a `fetch` call so the page does not navigate away on submission. Replace the existing form submit handler with something like this:

```javascript
document.querySelector('#contact-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  const name    = document.querySelector('[name="name"]').value.trim();
  const email   = document.querySelector('[name="email"]').value.trim();
  const message = document.querySelector('[name="message"]').value.trim();

  try {
    const res = await fetch(
      'https://alwaysready-inspection-readiness-pl-three.vercel.app/api/contact-inbound',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      }
    );

    const data = await res.json();

    if (data.success) {
      // Show a success message to the user
      document.querySelector('#contact-form').innerHTML =
        '<p>Thank you for your message. We will be in touch shortly.</p>';
    } else {
      alert('Something went wrong. Please try again.');
    }
  } catch {
    alert('Something went wrong. Please try again.');
  }
});
```

Adapt the selectors (`#contact-form`, `[name="name"]` etc.) to match the actual IDs and names used in the existing form markup.

## What not to do
- Do not add a mailto: link or advertise hello@alwaysready.uk anywhere on the site.
- Do not add a phone number unless AJ specifically asks for one.
- The confirmation message shown to the user should not include a contact email address.
