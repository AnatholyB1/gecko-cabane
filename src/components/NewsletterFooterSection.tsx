import { getTranslations } from 'next-intl/server'
import NewsletterForm from '@/components/NewsletterForm'

type Props = {
  locale: string
  idPrefix: string
}

export default async function NewsletterFooterSection({ locale, idPrefix }: Props) {
  const t = await getTranslations({ locale, namespace: 'newsletter.footer' })

  return (
    <div className="border-t border-gc-gold/10 py-8 md:grid md:grid-cols-2 md:gap-12">
      <div className="mb-6 md:mb-0">
        <h2 className="font-cinzel font-normal text-[20px] leading-[1.2] tracking-wide text-gc-ivory">
          {t('title')}
        </h2>
        <p className="font-cormorant text-[17px] leading-normal text-gc-ivory/70 mt-2">{t('pitch')}</p>
      </div>
      <NewsletterForm source="footer" variant="dark" showResident={false} idPrefix={idPrefix} />
    </div>
  )
}
