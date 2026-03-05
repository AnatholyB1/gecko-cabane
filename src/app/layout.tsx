import type { Metadata } from "next";
import { Playfair_Display, Lora } from "next/font/google";
import { getLocale } from "next-intl/server";
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
  title: {
    default: "Gecko Cabane Restaurant | Cuisine Franco-Thaï à Krabi",
    template: "%s | Gecko Cabane Restaurant",
  },
  description: "Restaurant gastronomique Franco-Thaï à Krabi, Thaïlande. Chef Jariya vous accueille dans un cadre intime de 40 places pour une cuisine fusion française et thaïlandaise. Options végétariennes et sans gluten disponibles.",
  keywords: [
    "restaurant Krabi",
    "cuisine franco-thaï",
    "restaurant français Thaïlande",
    "Gecko Cabane",
    "Chef Jariya",
    "restaurant gastronomique Krabi",
    "cuisine fusion",
    "restaurant végétarien Krabi",
    "sans gluten Krabi",
    "French Thai restaurant",
    "Krabi Town restaurant",
  ],
  authors: [{ name: "Gecko Cabane Restaurant" }],
  creator: "selenium-studio.com",
  publisher: "Gecko Cabane Restaurant",
  formatDetection: {
    email: false,
    address: true,
    telephone: true,
  },
  metadataBase: new URL("https://gecko-cabane.com"),
  alternates: {
    canonical: "/",
    languages: {
      "fr-FR": "/",
      "en-US": "/en",
      "th-TH": "/th",
    },
  },
  openGraph: {
    title: "Gecko Cabane Restaurant | Cuisine Franco-Thaï à Krabi",
    description: "Restaurant gastronomique Franco-Thaï à Krabi. Chef Jariya vous accueille pour une expérience culinaire unique mêlant saveurs françaises et thaïlandaises.",
    url: "https://gecko-cabane.com",
    siteName: "Gecko Cabane Restaurant",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gecko Cabane Restaurant | Franco-Thaï à Krabi",
    description: "Restaurant gastronomique Franco-Thaï à Krabi avec Chef Jariya 🦎🌿",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "restaurant",
};

// Structured data for Restaurant (JSON-LD)
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Gecko Cabane Restaurant",
  image: "https://gecko-cabane.com/opengraph-image",
  description: "Restaurant gastronomique Franco-Thaï à Krabi, Thaïlande. Cuisine fusion française et thaïlandaise par Chef Jariya.",
  url: "https://gecko-cabane.com",
  telephone: "+66819585945",
  address: {
    "@type": "PostalAddress",
    streetAddress: "1/36-37 Soi Ruamjit, Maharat Road",
    addressLocality: "Krabi Town",
    postalCode: "81000",
    addressCountry: "TH",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 8.0863,
    longitude: 98.9063,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "11:00",
      closes: "23:00",
    },
  ],
  servesCuisine: ["French", "Thai", "Fusion"],
  priceRange: "$$",
  acceptsReservations: true,
  menu: "https://gecko-cabane.com/menu",
  paymentAccepted: "Cash, Credit Card",
  currenciesAccepted: "THB",
  hasMenu: {
    "@type": "Menu",
    hasMenuSection: [
      {
        "@type": "MenuSection",
        name: "Dîner",
      },
      {
        "@type": "MenuSection",
        name: "Brunch",
      },
      {
        "@type": "MenuSection",
        name: "Boissons",
      },
    ],
  },
  amenityFeature: [
    { "@type": "LocationFeatureSpecification", name: "WiFi gratuit", value: true },
    { "@type": "LocationFeatureSpecification", name: "Options végétariennes", value: true },
    { "@type": "LocationFeatureSpecification", name: "Options sans gluten", value: true },
    { "@type": "LocationFeatureSpecification", name: "Chaises hautes", value: true },
    { "@type": "LocationFeatureSpecification", name: "Bar complet", value: true },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "150",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  
  return (
    <html lang={locale}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${playfair.variable} ${lora.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
