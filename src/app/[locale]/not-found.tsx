import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export default async function NotFound() {
  const t = await getTranslations('errors.notFound')

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 font-(family-name:--font-playfair)">
      {/* Background jungle decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-8xl opacity-5 -rotate-12">🌿</div>
        <div className="absolute top-20 right-16 text-7xl opacity-5 rotate-12">🍃</div>
        <div className="absolute bottom-20 left-20 text-9xl opacity-5 rotate-6">🌴</div>
        <div className="absolute bottom-10 right-10 text-8xl opacity-5 -rotate-6">🌿</div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-accent-light rounded-full blur-3xl opacity-20"></div>
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-(--tropical) rounded-full blur-3xl opacity-10"></div>
      </div>

      <div className="relative z-10 text-center max-w-lg">
        {/* Error code */}
        <div className="relative inline-block mb-6">
          <span className="text-[10rem] font-bold text-accent-light leading-none select-none">
            {t('code')}
          </span>
          <span className="absolute inset-0 flex items-center justify-center text-8xl">🦎</span>
        </div>

        <h1 className="text-4xl font-bold text-primary-dark mb-4">
          {t('title')}
        </h1>

        <p className="text-lg text-warm-gray font-(family-name:--font-lora) leading-relaxed mb-10">
          {t('subtitle')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-3 rounded-full hover:bg-primary-dark transition-colors font-(family-name:--font-lora) font-semibold shadow-md"
          >
            ← {t('backHome')}
          </Link>
          <Link
            href="/#menu"
            className="inline-flex items-center justify-center gap-2 border-2 border-primary text-primary px-8 py-3 rounded-full hover:bg-accent-light transition-colors font-(family-name:--font-lora) font-semibold"
          >
            🍽️ {t('goMenu')}
          </Link>
        </div>

        <p className="mt-12 text-sm text-warm-gray opacity-50 font-(family-name:--font-lora)">
          🦎 Gecko Cabane — Krabi, Thaïlande
        </p>
      </div>
    </div>
  )
}
