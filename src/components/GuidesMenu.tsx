'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

type Props = {
  items: { label: string; hint: string; href: string }[]
  toggleLabel: string
  navLabel: string
}

/** Disclosure listing the published SEO guides (D-04). Not an ARIA menu. */
export default function GuidesMenu({ items, toggleLabel, navLabel }: Props) {
  const [open, setOpen] = useState(false)
  const [prevPath, setPrevPath] = useState<string | null>(null)
  const pathname = usePathname()
  const rootRef = useRef<HTMLElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close on route change (state adjusted during render, no effect needed).
  if (prevPath !== pathname) {
    setPrevPath(pathname)
    if (open) setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  if (items.length === 0) return null

  return (
    <nav
      ref={rootRef}
      aria-label={navLabel}
      className="md:relative"
      onBlur={(e) => {
        if (open && !e.currentTarget.contains(e.relatedTarget as Node | null) && e.relatedTarget) setOpen(false)
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="guides-menu"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 min-h-11 font-cinzel text-[12px] tracking-[0.15em] uppercase text-gc-ivory/65 hover:text-gc-gold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gc-gold"
      >
        {toggleLabel}
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ul
          id="guides-menu"
          className="fixed top-16 left-0 right-0 max-h-[calc(100dvh-64px)] overflow-y-auto px-6 py-4 flex flex-col gap-2 bg-gc-ivory border-b border-gc-gold/40 z-50 md:absolute md:top-full md:left-auto md:right-0 md:w-72 md:max-h-none md:border md:p-4 transition-opacity duration-150 motion-reduce:transition-none"
        >
          {items.map((item) => {
            const current = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={current ? 'page' : undefined}
                  className={`block min-h-11 py-1 border-b-2 hover:border-gc-gold focus-visible:border-gc-gold focus-visible:outline-none ${current ? 'border-gc-gold' : 'border-transparent'}`}
                >
                  <span className="block font-raleway text-[12px] tracking-[0.15em] uppercase text-gc-jungle">
                    {item.label}
                  </span>
                  <span className="block font-cormorant italic text-[16px] text-gc-text-mid">{item.hint}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </nav>
  )
}
