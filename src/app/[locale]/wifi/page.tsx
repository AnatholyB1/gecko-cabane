import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import NewsletterForm from '@/components/NewsletterForm'
import WifiCopyButton from '@/components/WifiCopyButton'
import UtilityCard from '@/components/ui/UtilityCard'
import { LOCALES, type SeoLocale } from '@/utils/seo'

// Credentials are read per request and must never be cached or prerendered (D-13).
export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ locale: string }>
}

function resolveLocale(raw: string): SeoLocale {
  return (LOCALES as readonly string[]).includes(raw) ? (raw as SeoLocale) : 'fr'
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params
  const t = await getTranslations({ locale: resolveLocale(raw), namespace: 'wifi' })
  // D-13: utility page, never indexed, no self-referencing URL metadata.
  return {
    title: t('metaTitle'),
    robots: { index: false, follow: false },
  }
}

export default async function WifiPage({ params }: Props) {
  const { locale: raw } = await params
  const t = await getTranslations({ locale: resolveLocale(raw), namespace: 'wifi' })
  // Server-only env, never NEXT_PUBLIC_ (T-07-05-02).
  const ssid = process.env.WIFI_SSID
  const password = process.env.WIFI_PASSWORD

  return (
    <main className="min-h-screen bg-gc-void pt-16 pb-24 sm:pb-16 px-4">
      <UtilityCard title={t('title')}>
        <div className="mt-6 text-left">
          {ssid && password ? (
            <div className="bg-gc-aged/50 border border-gc-aged p-4">
              <p className="font-raleway text-[14px] font-medium text-gc-text-mid">{t('network')}</p>
              <p className="font-cormorant text-[17px] font-medium leading-[1.5] text-gc-text-dark">{ssid}</p>
              <p className="font-raleway text-[14px] font-medium text-gc-text-mid mt-4">{t('password')}</p>
              <p className="font-mono select-all text-[17px] font-medium leading-[1.5] tracking-[0.05em] text-gc-text-dark break-all">
                {password}
              </p>
              <div className="mt-4">
                <WifiCopyButton value={password} />
              </div>
            </div>
          ) : (
            <div className="bg-gc-aged/50 border border-gc-aged p-4 text-center" role="status">
              <p className="font-cinzel text-[20px] leading-[1.2] text-gc-text-dark">{t('unavailableTitle')}</p>
              <p className="font-cormorant text-[17px] leading-[1.5] text-gc-text-dark mt-2">
                {t('unavailableBody')}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gc-aged mt-8 pt-8 text-left">
          <h2 className="font-cinzel font-normal text-[20px] leading-[1.2] text-gc-text-dark">{t('optionalTitle')}</h2>
          <p className="font-cormorant text-[17px] leading-[1.5] text-gc-text-dark mt-2 mb-6">{t('optionalBody')}</p>
          <NewsletterForm source="wifi" variant="light" showResident idPrefix="nl-wifi" />
        </div>
      </UtilityCard>
    </main>
  )
}
