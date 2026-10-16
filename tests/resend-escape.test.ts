/**
 * Email escaping tests: customer-controlled values must never reach HTML or subjects raw.
 */

import { describe, it, expect } from 'vitest'
import { escapeHtml, stripLineBreaks } from '../src/utils/html'
import {
  customerPendingEmail,
  customerStatusEmail,
  restaurantNotificationEmail,
} from '../src/utils/resend'

const base = {
  customer_name: 'Alice',
  customer_email: 'alice@example.com',
  customer_phone: '+33612345678',
  reservation_date: '2026-10-24',
  reservation_time: '19:00',
  party_size: 2,
  occasion: null as string | null,
}

describe('escapeHtml', () => {
  it('escapes special characters', () => {
    expect(escapeHtml('<script>alert("x")</script> & \'')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;'
    )
  })
  it('handles null, undefined and numbers', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
    expect(escapeHtml(4)).toBe('4')
  })
})

describe('stripLineBreaks', () => {
  it('replaces CR and LF with a space', () => {
    expect(stripLineBreaks('a\r\nb\nc')).not.toMatch(/[\r\n]/)
  })
})

describe('templates escape user data', () => {
  const payload = '<img src=x onerror=alert(1)>'

  it('escapes name in restaurant notification', () => {
    const { html } = restaurantNotificationEmail({ ...base, customer_name: payload })
    expect(html).not.toContain('<img src=x')
    expect(html).toContain('&lt;img')
  })

  it('escapes occasion and email', () => {
    const { html } = restaurantNotificationEmail({
      ...base,
      occasion: payload,
      customer_email: payload,
    })
    expect(html).not.toContain('<img src=x')
    const c = customerPendingEmail({ ...base, occasion: payload, customer_name: payload })
    expect(c.html).not.toContain('<img src=x')
    const s = customerStatusEmail({ ...base, customer_name: payload }, 'confirmed')
    expect(s.html).not.toContain('<img src=x')
  })

  it('strips CR/LF from subject', () => {
    const { subject } = restaurantNotificationEmail({
      ...base,
      customer_name: 'Bob\r\nBcc: x@y.z',
    })
    expect(subject).not.toMatch(/[\r\n]/)
  })
})
