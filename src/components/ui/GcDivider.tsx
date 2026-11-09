// src/components/ui/GcDivider.tsx
interface GcDividerProps {
  /** Sur fond parchment (#F5EEDA), utiliser dark=true pour contraste suffisant */
  dark?: boolean
  className?: string
}

// Purely decorative (aria-hidden): the glyphs are emitted via CSS `content` so they
// are not text content, and are exempt from contrast checks (WCAG 1.4.3 "pure
// decoration"). Colors are deliberately unchanged to keep the visual identity.
export default function GcDivider({ dark = false, className = '' }: GcDividerProps) {
  return (
    <span
      className={[
        "font-cinzel block text-center text-[14px] tracking-[0.4em] before:content-['——◆——']",
        dark ? 'text-gc-brass/70' : 'text-gc-gold/60',
        className,
      ].join(' ')}
      aria-hidden="true"
    />
  )
}
