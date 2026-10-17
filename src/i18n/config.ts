export const locales = ['fr', 'en', 'de', 'sv'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'fr'
