import type { Metadata } from "next";
import { Cinzel, Cinzel_Decorative, Cormorant_Garamond, Raleway } from "next/font/google";
import { getLocale } from "next-intl/server";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const cinzelDecorative = Cinzel_Decorative({
  variable: "--font-cinzel-decorative",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["300", "400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Gecko Cabane Restaurant | Cuisine Franco-Thaï à Krabi",
    template: "%s | Gecko Cabane Restaurant",
  },
  description: "Restaurant gastronomique Franco-Thaï à Krabi, Thaïlande. Chef Jariya vous accueille dans un cadre intime de 40 places pour une cuisine fusion française et thaïlandaise. Options végétariennes et sans gluten disponibles.",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
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
      "fr-FR": "/fr",
      "en-US": "/en",
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
    description: "Restaurant gastronomique Franco-Thaï à Krabi. Chef Jariya, cuisine fusion française et thaïlandaise, 40 couverts.",
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
        className={`${cinzel.variable} ${cinzelDecorative.variable} ${cormorant.variable} ${raleway.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
