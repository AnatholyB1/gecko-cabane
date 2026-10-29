import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { localizedPageMetadata } from '@/utils/page-metadata'

type Props = {
  params: Promise<{ locale: string }>
}

const CONTACT_EMAIL = 'geckocabanerestaurant@gmail.com'
const CONTACT_PHONE_DISPLAY = '+66 81 958 5945'
const CONTACT_PHONE_TEL = '+66819585945'

// Number of item1..itemN keys per section (lists are encoded as flat keys).
const SECTIONS = [
  { id: 'who', items: 0, contact: true },
  { id: 'data', items: 7, contact: false },
  { id: 'purpose', items: 3, contact: false },
  { id: 'rights', items: 6, contact: false },
  { id: 'retention', items: 3, contact: false },
  { id: 'sharing', items: 4, contact: false },
  { id: 'contact', items: 0, contact: true },
] as const

const linkClass = 'text-gc-jungle underline hover:text-gc-void'
const headingClass = 'font-cinzel font-normal text-[20px] leading-[1.2] tracking-wide text-gc-text-dark'
const bodyClass = 'font-cormorant text-[17px] leading-[1.5] text-gc-text-dark max-w-[65ch]'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params
  return localizedPageMetadata({
    rawLocale,
    key: '/privacy',
    namespace: 'privacy',
    titleKey: 'metaTitle',
    descriptionKey: 'metaDescription',
  })
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'privacy' })

  return (
    <main className="min-h-screen bg-gc-void py-16 px-4">
      <div className="relative max-w-2xl mx-auto bg-gc-parchment border border-gc-aged p-8 sm:p-12">
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gc-gold pointer-events-none" aria-hidden="true" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gc-gold pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gc-gold pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gc-gold pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 space-y-12">
          <header>
            <div className="w-10 h-px bg-gc-gold mb-6" />
            <h1 className={headingClass}>{t('title')}</h1>
            <p className="font-cormorant text-[14px] leading-[1.5] text-gc-text-mid mt-2">
              {t('lastUpdated')}
            </p>
          </header>

          {SECTIONS.map(({ id, items, contact }) => (
            <section key={id} className="space-y-4">
              <h2 className={headingClass}>{t(`${id}.title`)}</h2>
              <p className={bodyClass}>{t(`${id}.body`)}</p>
              {items > 0 && (
                <ul className="space-y-2">
                  {Array.from({ length: items }, (_, i) => (
                    <li key={i} className={`${bodyClass} list-disc ml-5`}>
                      {t(`${id}.item${i + 1}`)}
                    </li>
                  ))}
                </ul>
              )}
              {contact && (
                <ul className="space-y-2">
                  <li className={bodyClass}>
                    {t('contact.phoneLabel')}:{' '}
                    <a href={`tel:${CONTACT_PHONE_TEL}`} className={linkClass}>
                      {CONTACT_PHONE_DISPLAY}
                    </a>
                  </li>
                  <li className={bodyClass}>
                    {t('contact.emailLabel')}:{' '}
                    <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
                      {CONTACT_EMAIL}
                    </a>
                  </li>
                </ul>
              )}
            </section>
          ))}

          <Link
            href="/"
            className="inline-flex min-h-11 items-center font-cormorant text-[17px] text-gc-jungle underline hover:text-gc-void"
          >
            {t('back')}
          </Link>
        </div>
      </div>
    </main>
  )
}
