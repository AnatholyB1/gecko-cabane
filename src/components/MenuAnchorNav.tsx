import type { MenuPageWithContent } from '@/utils/menu'

type Props = {
  pages: MenuPageWithContent[]
  label: string
}

export default function MenuAnchorNav({ pages, label }: Props) {
  return (
    <nav
      aria-label={label}
      className="sticky top-0 z-30 h-12 bg-gc-ivory/95 border-b border-gc-aged overflow-x-auto [scrollbar-width:none]"
    >
      <ul className="flex flex-nowrap items-center gap-2 h-full max-w-3xl mx-auto px-2">
        {pages.map((page) => (
          <li key={page.id} className="shrink-0">
            <a
              href={`#${page.slug}`}
              className="inline-flex items-center min-h-11 px-4 font-raleway text-[12px] uppercase tracking-[0.15em] text-gc-text-dark whitespace-nowrap border-b-2 border-transparent hover:border-gc-gold focus-visible:border-gc-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gc-gold"
            >
              {page.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
