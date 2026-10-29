// Shared button class strings (extracted from the review page, UI-SPEC phase 7).

export const buttonBase =
  'min-h-14 w-full px-6 inline-flex items-center justify-center gap-2 font-cinzel text-[14px] font-medium uppercase tracking-[0.1em] transition-colors duration-200 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gc-gold focus-visible:ring-offset-2 focus-visible:ring-offset-gc-parchment'

export const primaryLightClass = `${buttonBase} bg-gc-jungle text-gc-ivory hover:bg-gc-void`

export const secondaryLightClass = `${buttonBase} border border-gc-jungle text-gc-jungle hover:bg-gc-jungle/10`

export const primaryDarkClass = `${buttonBase.replace('ring-offset-gc-parchment', 'ring-offset-gc-jungle')} bg-gc-gold text-gc-void hover:bg-gc-brass`
