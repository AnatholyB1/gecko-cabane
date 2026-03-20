import Link from 'next/link'

// Global not-found fallback (no locale context available)
// Displayed when a 404 occurs outside the [locale] segment
export default function GlobalNotFound() {
  return (
    <html lang="fr">
      <body className="m-0 bg-[#F5F9F4] font-serif">
        <div className="min-h-screen flex items-center justify-center p-6 text-center">
          <div className="max-w-[480px]">
            <div className="relative inline-block mb-6">
              <span className="text-[9rem] font-bold text-[#D4E5C9] leading-none select-none">
                404
              </span>
              <span className="absolute inset-0 flex items-center justify-center text-[5rem]">
                🦎
              </span>
            </div>

            <h1 className="text-4xl font-bold text-[#1E3D2A] mb-4">
              Page introuvable
            </h1>
            <p className="text-[#4A5D4A] mb-10 leading-relaxed">
              Cette page n'existe pas ou a été déplacée.
            </p>

            <Link
              href="/fr"
              className="inline-block bg-[#2D5A3D] text-white px-8 py-3 rounded-full font-semibold no-underline"
            >
              ← Retour à l'accueil
            </Link>

            <p className="mt-12 text-sm text-[#4A5D4A] opacity-50">
              🦎 Gecko Cabane — Krabi, Thaïlande
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
