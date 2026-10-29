/**
 * WhatsApp review invitation templates (REV-05, D-10). Pure module, admin-only use.
 * Static texts: no incentive wording, no star request; sending stays a manual owner action.
 */

import { buildWhatsAppUrl } from '@/utils/whatsapp'

export const REVIEW_WA_LINK = 'https://geckocabanerestaurant.com/review?src=wa'

export const REVIEW_WA_TEMPLATES: ReadonlyArray<{
  lang: 'fr' | 'en' | 'de'
  label: string
  needsReview: boolean
  text: string
}> = [
  {
    lang: 'fr',
    label: 'Français',
    needsReview: false,
    text: `Bonjour, merci d'être venu(e) chez Gecko Cabane ! Si vous avez apprécié votre moment chez nous, votre avis nous aiderait beaucoup : ${REVIEW_WA_LINK}\nMerci et à bientôt à Krabi !\nJariya et l'équipe de Gecko Cabane`,
  },
  {
    lang: 'en',
    label: 'English',
    needsReview: false,
    text: `Hello, thank you for visiting Gecko Cabane! If you enjoyed your time with us, your feedback would mean a lot to us: ${REVIEW_WA_LINK}\nThank you, and see you soon in Krabi!\nJariya and the Gecko Cabane team`,
  },
  {
    // D-10: DE text to be proofread by a human (PROJECT constraint)
    lang: 'de',
    label: 'Deutsch',
    needsReview: true,
    text: `Hallo, vielen Dank für Ihren Besuch im Gecko Cabane! Wenn es Ihnen bei uns gefallen hat, würden wir uns sehr über Ihre Rückmeldung freuen: ${REVIEW_WA_LINK}\nVielen Dank und bis bald in Krabi!\nJariya und das Team von Gecko Cabane`,
  },
]

/** Empty number: WhatsApp lets the owner pick the contact. */
export function reviewWhatsAppShareUrl(text: string): string {
  return buildWhatsAppUrl('', text)
}
