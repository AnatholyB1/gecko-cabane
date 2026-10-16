import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/utils/seo'

// Disallow is crawl hygiene only, not access control (admin is guarded by
// middleware + RLS).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/auth', '/monitoring'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
