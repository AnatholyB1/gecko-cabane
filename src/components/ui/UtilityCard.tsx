import type { ReactNode } from 'react'

type Props = {
  title: string
  titleSize?: 'heading' | 'display'
  children: ReactNode
}

// Parchment card shell shared by the utility pages (review, newsletter, wifi, confirm, unsubscribe).
export default function UtilityCard({ title, titleSize = 'heading', children }: Props) {
  const h1Size = titleSize === 'display' ? 'text-[20px] sm:text-[28px]' : 'text-[20px]'
  return (
    <div className="relative max-w-md mx-auto bg-gc-parchment border border-gc-aged p-8 sm:p-12">
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gc-gold pointer-events-none" aria-hidden="true" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gc-gold pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gc-gold pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gc-gold pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 text-center">
        <p className="font-raleway text-[14px] uppercase tracking-[0.2em] text-gc-text-mid">Gecko Cabane</p>
        <div className="w-10 h-px bg-gc-gold mx-auto mt-4" />
        <h1 className={`font-cinzel font-normal ${h1Size} leading-[1.2] tracking-wide text-gc-text-dark mt-4`}>
          {title}
        </h1>
        {children}
      </div>
    </div>
  )
}
