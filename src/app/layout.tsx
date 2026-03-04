import type { Metadata } from "next";
import { Playfair_Display, Lora } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Gecko Cabane Restaurant | Franco-Thai Cuisine in Krabi",
  description: "Restaurant gastronomique Franco-Thaï à Krabi. Chef Jariya vous accueille dans un cadre intime pour une cuisine fusion française et thaïlandaise. Réservations pour 40 places maximum.",
  keywords: ["restaurant", "Krabi", "Thai", "French", "fusion", "gastronomique", "Gecko Cabane"],
  openGraph: {
    title: "Gecko Cabane Restaurant | Franco-Thai Cuisine in Krabi",
    description: "Restaurant gastronomique Franco-Thaï à Krabi avec Chef Jariya",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${playfair.variable} ${lora.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
