import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Gecko Cabane Restaurant - Franco-Thai Cuisine in Krabi'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

const COPY = {
  fr: {
    tagline: 'Restaurant Franco-Thaï', // i18n-ignore: OG image copy, edge runtime without next-intl
    place: '🌿 Krabi, Thaïlande 🌿', // i18n-ignore: OG image copy, edge runtime without next-intl
    style: '🍽️ Gastronomique', // i18n-ignore: OG image copy, edge runtime without next-intl
  },
  en: {
    tagline: 'French-Thai Restaurant', // i18n-ignore: OG image copy, edge runtime without next-intl
    place: '🌿 Krabi, Thailand 🌿', // i18n-ignore: OG image copy, edge runtime without next-intl
    style: '🍽️ Fine dining', // i18n-ignore: OG image copy, edge runtime without next-intl
  },
}

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const copy = COPY[locale === 'fr' ? 'fr' : 'en']
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1B4332 0%, #2D5A3D 50%, #4CAF50 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        {/* Decorative leaves */}
        <div style={{ position: 'absolute', top: 20, left: 40, fontSize: 80, opacity: 0.2 }}>🌿</div>
        <div style={{ position: 'absolute', top: 60, right: 60, fontSize: 60, opacity: 0.2 }}>🍃</div>
        <div style={{ position: 'absolute', bottom: 40, left: 80, fontSize: 70, opacity: 0.2 }}>🌴</div>
        <div style={{ position: 'absolute', bottom: 60, right: 100, fontSize: 50, opacity: 0.2 }}>🌿</div>
        
        {/* Main content */}
        <div style={{ fontSize: 100, marginBottom: 20 }}>🦎</div>
        <h1
          style={{
            fontSize: 72,
            color: 'white',
            margin: 0,
            textShadow: '2px 2px 10px rgba(0,0,0,0.3)',
            fontWeight: 'bold',
          }}
        >
          Gecko Cabane
        </h1>
        <p
          style={{
            fontSize: 36,
            color: '#D4E5C9',
            margin: '20px 0 10px 0',
          }}
        >
          {copy.tagline}
        </p>
        <p
          style={{
            fontSize: 24,
            color: '#A67C52',
            margin: 0,
          }}
        >
          {copy.place}
        </p>
        
        {/* Bottom tagline */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            color: 'white',
            opacity: 0.9,
            fontSize: 20,
          }}
        >
          <span>{copy.style}</span>
          <span>•</span>
          <span>👩‍🍳 Chef Jariya</span>
          <span>•</span>
          <span>📞 +66 81 958 5945</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}