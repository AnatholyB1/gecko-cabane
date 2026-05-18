import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gecko Cabane Restaurant',
    short_name: 'Gecko Cabane',
    description: 'Restaurant gastronomique Franco-Thaï à Krabi, Thaïlande',
    start_url: '/',
    display: 'standalone',
    background_color: '#0D1F17',
    theme_color: '#C69B3C',
    lang: 'fr',
    icons: [
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
    ],
  }
}
