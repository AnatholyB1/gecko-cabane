/**
 * Customer email locales. Kept free of server-only imports (no resend SDK) so that
 * client bundles can import review-invitations.ts safely. Re-exported by resend.ts.
 */

export type EmailLocale = 'fr' | 'en' | 'de' | 'sv'

/**
 * Locales that get their own customer email copy. 'de' listed after the owner's written
 * validation of docs/ph6/review/de/emails.md (2026-10-18, plan 13); 'sv' after the owner's written validation of docs/ph6/review/sv/emails.md (2026-10-29, plan 15).
 */
export const EMAIL_LOCALES: readonly EmailLocale[] = ['fr', 'en', 'de', 'sv']
