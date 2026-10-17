import { getRequestConfig } from 'next-intl/server'
import { locales, type Locale } from './config'

type Msgs = { [k: string]: string | Msgs }

/** Deep merge: values of `over` win; anything missing falls back to `base`. */
function deepMerge(base: Msgs, over: Msgs): Msgs {
  const out: Msgs = { ...base }
  for (const [k, v] of Object.entries(over)) {
    const b = out[k]
    out[k] =
      typeof v === 'object' && v !== null && typeof b === 'object' && b !== null
        ? deepMerge(b, v)
        : v
  }
  return out
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  // Validate against the whitelist before the dynamic import (T-06-30)
  if (!locale || !locales.includes(locale as Locale)) {
    locale = 'fr'
  }

  const own = (await import(`../../messages/${locale}.json`)).default as Msgs
  // de/sv: missing strings fall back to English, never to a raw key path
  const messages =
    locale === 'de' || locale === 'sv'
      ? deepMerge((await import('../../messages/en.json')).default as Msgs, own)
      : own

  return { locale, messages }
})
