"use client";

import "./globals.css";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Global error boundary — catches errors in the root layout itself
// Must include its own <html> and <body> tags
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="m-0 bg-[#F5F9F4] font-serif">
        <div className="min-h-screen flex items-center justify-center p-6 text-center">
          <div className="max-w-120">
            <div className="relative inline-block mb-6">
              <span className="text-[9rem] font-bold text-[#D4E5C9] leading-none select-none">
                500
              </span>
              <span className="absolute inset-0 flex items-center justify-center text-[5rem]">
                🦎
              </span>
            </div>

            <h1 className="text-4xl font-bold text-[#1E3D2A] mb-4">
              Une erreur s'est produite
            </h1>
            <p className="text-[#4A5D4A] mb-10 leading-relaxed">
              Quelque chose s'est mal passé. Veuillez réessayer.
            </p>

            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={reset}
                className="bg-[#2D5A3D] text-white px-8 py-3 rounded-full border-none font-semibold cursor-pointer text-base"
              >
                🔄 Réessayer
              </button>
              <a
                href="/fr"
                className="inline-block border-2 border-[#2D5A3D] text-[#2D5A3D] px-8 py-3 rounded-full no-underline font-semibold"
              >
                ← Accueil
              </a>
            </div>

            {error.digest && (
              <p className="mt-8 text-xs text-[#4A5D4A] opacity-40">
                Ref: {error.digest}
              </p>
            )}

            <p className="mt-6 text-sm text-[#4A5D4A] opacity-50">
              🦎 Gecko Cabane — Krabi, Thaïlande
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
