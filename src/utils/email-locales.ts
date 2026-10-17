/**
 * Customer email locales. Kept free of server-only imports (no resend SDK) so that
 * client bundles can import review-invitations.ts safely. Re-exported by resend.ts.
 */

export type EmailLocale = 'fr' | 'en' | 'de'

/**
 * Locales that get their own customer email copy. 'de' copy exists in resend.ts but is
 * NOT listed: de is appended at DE publication, after written review (D-09, plan 13).
 */
export const EMAIL_LOCALES: readonly EmailLocale[] = ['fr', 'en']
