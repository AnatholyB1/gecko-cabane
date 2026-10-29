/**
 * Decorative botanical line drawings, inlined (SEO-08).
 * As <img>, the very faint hero SVGs were picked as the LCP element by Lighthouse and delayed
 * the metric; an inline <svg> is never an LCP candidate, so the hero title becomes the LCP.
 * Same paths and colors as public/botanical-*.svg (those files stay for other uses).
 */

const common = {
  fill: 'none',
  stroke: '#C69B3C',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const,
  focusable: 'false' as const,
  className: 'w-full h-full',
}

export function BotanicalHeliconia() {
  return (
    <svg viewBox="0 0 200 420" preserveAspectRatio="xMidYMax meet" {...common}>
      <path d="M100 400 C99 340 97 280 100 200" />
      <path d="M100 200 C118 178 148 162 142 135 C137 114 112 124 100 200" />
      <path d="M102 260 C122 238 152 224 150 196 C148 174 122 182 102 260" />
      <path d="M100 230 C80 208 50 198 48 170 C46 148 74 154 100 230" />
      <path d="M100 290 C78 268 48 262 44 234 C40 212 70 218 100 290" />
      <path d="M100 350 C68 320 40 290 30 258 C22 232 60 238 100 350" />
      <path d="M100 380 C102 360 101 340 100 320" />
      <path d="M115 185 C122 178 135 172 138 163" strokeWidth={0.8} />
      <path d="M118 245 C126 238 138 233 142 222" strokeWidth={0.8} />
      <path d="M85 218 C76 210 64 206 58 196" strokeWidth={0.8} />
      <path d="M84 278 C74 270 62 268 55 258" strokeWidth={0.8} />
    </svg>
  )
}

export function BotanicalPalm() {
  return (
    <svg viewBox="0 0 300 420" preserveAspectRatio="xMidYMid meet" {...common}>
      <path d="M152 400 C150 340 148 270 150 180" />
      <path d="M150 180 C155 145 178 118 168 88 C160 64 142 72 150 180" />
      <path d="M150 192 C178 168 208 162 218 134 C228 110 202 105 150 192" />
      <path d="M150 192 C122 168 92 162 82 134 C72 110 98 105 150 192" />
      <path d="M150 205 C188 190 215 198 228 172 C240 150 214 142 150 205" />
      <path d="M150 205 C112 190 85 198 72 172 C60 150 86 142 150 205" />
      <path d="M150 220 C195 212 228 225 244 200 C258 180 228 168 150 220" />
      <path d="M150 220 C105 212 72 225 56 200 C42 180 72 168 150 220" />
      <path d="M158 170 C165 155 172 145 168 132" strokeWidth={0.8} />
      <path d="M168 182 C182 168 194 162 200 148" strokeWidth={0.8} />
      <path d="M132 182 C118 168 106 162 100 148" strokeWidth={0.8} />
      <path d="M175 198 C192 188 204 192 212 180" strokeWidth={0.8} />
      <path d="M125 198 C108 188 96 192 88 180" strokeWidth={0.8} />
      <path d="M149 240 C151 260 150 280 151 300" strokeWidth={0.8} strokeDasharray="4 6" />
      <path d="M153 300 C151 320 150 350 152 380" strokeWidth={0.8} strokeDasharray="4 6" />
    </svg>
  )
}
