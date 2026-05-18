// src/components/ui/GcDivider.tsx
interface GcDividerProps {
  /** Sur fond parchment (#F5EEDA), utiliser dark=true pour contraste suffisant */
  dark?: boolean
  className?: string
}

export default function GcDivider({ dark = false, className = '' }: GcDividerProps) {
  return (
    <span
      className={[
        'font-cinzel block text-center text-[14px] tracking-[0.4em]',
        dark ? 'text-gc-brass/70' : 'text-gc-gold/60',
        className,
      ].join(' ')}
      aria-hidden="true"
    >
      ——◆——
    </span>
  )
}
