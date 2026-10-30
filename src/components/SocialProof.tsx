import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import GcDivider from '@/components/ui/GcDivider'
import { SAME_AS, googleReadReviewsUrl, type SeoLocale } from '@/utils/seo'
import { SOCIAL_PROOF, visibleReviews } from '@/utils/social-proof'

const STAR_PATH = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'

function Stars({ count }: { count: number }) {
  return (
    <span className="flex gap-0.5" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <svg key={i} className="w-4 h-4 fill-gc-brass" viewBox="0 0 24 24">
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  )
}

const LINK_CLASS =
  'inline-flex items-center min-h-11 font-raleway text-[12px] tracking-[0.15em] uppercase text-gc-brass underline hover:text-gc-text-dark transition-colors'

export default async function SocialProof({ locale }: { locale: SeoLocale }) {
  const t = await getTranslations({ locale, namespace: 'socialProof' })
  const nf = new Intl.NumberFormat(locale)
  const languageName = new Intl.DisplayNames([locale], { type: 'language' })
  const googleUrl = googleReadReviewsUrl()
  const tripadvisorUrl = SAME_AS.find((u) => u.includes('tripadvisor.'))
  const facebookUrl = SAME_AS.find((u) => u.includes('facebook.com'))
  const reviews = visibleReviews()
  const { travellersChoice } = SOCIAL_PROOF
  const rating = nf.format(SOCIAL_PROOF.rating)
  const count = nf.format(SOCIAL_PROOF.reviewCount)

  const links = [
    { href: googleUrl, label: t('googleReviews') },
    { href: tripadvisorUrl, label: t('tripadvisorReviews') },
    { href: facebookUrl, label: t('facebook') },
  ].filter((l): l is { href: string; label: string } => Boolean(l.href))

  return (
    <section
      aria-labelledby="social-proof-title"
      className="py-24 px-6 bg-gc-parchment border-t border-gc-aged relative overflow-hidden"
    >
      <div className="max-w-[1100px] mx-auto relative z-10">
        <div className="text-center mb-10">
          <p className="font-raleway font-light text-[11px] tracking-[0.3em] uppercase text-gc-brass mb-4">
            {t('eyebrow')}
          </p>
          <h2
            id="social-proof-title"
            className="font-cinzel font-normal text-gc-text-dark mb-4"
            style={{ fontSize: 'clamp(26px, 3.5vw, 42px)' }}
          >
            {t('title')}
          </h2>
          <GcDivider dark />
        </div>

        <div
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mb-6"
          aria-label={t('ratingAria', { rating, count })}
        >
          <span className="font-cinzel font-semibold text-[20px] text-gc-text-dark">{rating}</span>
          <Stars count={5} />
          <span className="font-cormorant italic text-[17px] text-gc-text-mid">
            {t('countLabel', { count })}
          </span>
          {travellersChoice.awarded && (
            <span className="inline-flex items-center border border-gc-gold px-4 py-2 min-h-11 font-raleway text-[12px] tracking-[0.15em] uppercase text-gc-text-dark">
              {travellersChoice.year
                ? t('travellersChoiceYear', { year: travellersChoice.year })
                : t('travellersChoice')}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1 mb-12">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className={LINK_CLASS}
            >
              {l.label}
            </a>
          ))}
        </div>

        {reviews.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
            {reviews.map((review, i) => (
              <figure key={i} className="bg-gc-jungle border-t-2 border-gc-gold p-6">
                <blockquote
                  lang={review.lang}
                  className="font-cormorant whitespace-pre-line italic text-[17px] leading-[1.5] text-gc-ivory/90"
                >
                  {review.text}
                </blockquote>
                <figcaption className="mt-4 flex flex-col gap-2">
                  <span className="font-cinzel font-semibold text-[15px] text-gc-ivory">
                    {review.name}
                  </span>
                  <span className="font-raleway text-[12px] tracking-[0.15em] uppercase text-gc-celadon">
                    {review.country}
                  </span>
                  <span className="font-raleway text-[12px] text-gc-ivory/65">
                    {t('originalLanguage', {
                      language: languageName.of(review.lang) ?? review.lang,
                    })}
                  </span>
                  <span className="flex items-center gap-2">
                    <Stars count={review.rating} />
                    <span className="sr-only">{t('starsSr', { rating: review.rating })}</span>
                  </span>
                  <a
                    href={review.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t('viewSource', { name: review.name, source: review.source })}
                    className="inline-flex items-center min-h-11 font-raleway text-[12px] tracking-[0.15em] uppercase text-gc-gold underline"
                  >
                    {review.source === 'google' ? 'Google' : 'TripAdvisor'}
                  </a>
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        <div className="text-center">
          <Link
            href={{ pathname: '/review', query: { src: 'site' } }}
            prefetch={false}
            className="font-cinzel text-[12px] tracking-[0.15em] uppercase border border-gc-text-dark text-gc-text-dark px-6 py-3 min-h-11 inline-flex items-center hover:bg-gc-text-dark hover:text-gc-parchment transition-colors"
          >
            {t('leaveReview')}
          </Link>
        </div>
      </div>
    </section>
  )
}
