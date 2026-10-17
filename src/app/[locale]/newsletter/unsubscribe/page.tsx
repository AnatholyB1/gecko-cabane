import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import UtilityCard from '@/components/ui/UtilityCard'
import NewsletterUnsubscribeButton from '@/components/NewsletterUnsubscribeButton'
import { createAdminClient } from '@/utils/supabase/server'
import { parseLinkParams, verifyNewsletterLink } from '@/utils/newsletter-links'
import { maskEmail } from '@/utils/newsletter-withdrawal'
import { LOCALES, type SeoLocale } from '@/utils/seo'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const CONTACT_EMAIL = 'geckocabanerestaurant@gmail.com'

function resolveLocale(raw: string): SeoLocale {
  return (LOCALES as readonly string[]).includes(raw) ? (raw as SeoLocale) : 'fr'
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params
  const t = await getTranslations({ locale: resolveLocale(raw), namespace: 'newsletter.unsubscribe' })
  return {
    title: t('metaTitle'),
    robots: { index: false, follow: false },
  }
}

const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v : null)

// GET only renders. The withdrawal happens on POST (button or RFC 8058 one-click),
// so link scanners never unsubscribe anyone.
export default async function NewsletterUnsubscribePage({ params, searchParams }: Props) {
  const { locale: raw } = await params
  const sp = await searchParams
  const t = await getTranslations({ locale: resolveLocale(raw), namespace: 'newsletter.unsubscribe' })
  const r = one(sp.r)
  const s = one(sp.s)

  let masked: string | null = null
  const secret = process.env.NEWSLETTER_SIGNING_SECRET
  const parsed = secret ? parseLinkParams({ r, s }) : null
  // Unsubscribe links never expire (no exp), so the current time is irrelevant here.
  if (secret && parsed && verifyNewsletterLink(secret, 'unsubscribe', parsed.rowId, undefined, parsed.sig, 0)) {
    // Read-only service-role select: needed to show the masked address; no write.
    const { data } = await createAdminClient()
      .from('gecko_marketing_consents')
      .select('email')
      .eq('id', parsed.rowId)
      .maybeSingle()
    if (data && typeof (data as { email?: unknown }).email === 'string') {
      masked = maskEmail((data as { email: string }).email)
    }
  }

  return (
    <main className="min-h-screen bg-gc-void pt-16 pb-24 sm:pb-16 px-4">
      <UtilityCard title={t('title')}>
        {masked && r && s ? (
          <div className="mt-6">
            <p className="font-cormorant text-[17px] leading-[1.5] text-gc-text-dark">
              {t('intro', { email: masked })}
            </p>
            <NewsletterUnsubscribeButton r={r} s={s} />
          </div>
        ) : (
          <div className="mt-6" role="alert">
            <p className="font-cormorant text-[17px] leading-[1.5] text-gc-text-dark">
              {t('invalid', { email: CONTACT_EMAIL })}
            </p>
          </div>
        )}
      </UtilityCard>
    </main>
  )
}
