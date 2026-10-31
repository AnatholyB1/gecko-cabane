import { Inter } from 'next/font/google'

/**
 * Police de l'interface d'administration (DSN-02). Chargée uniquement par le
 * code admin : le site public ne paie pas Inter. Chiffres tabulaires fiables
 * pour heures, couverts et prix. Cormorant Garamond (titres de page) réutilise
 * la variable `--font-cormorant` du layout racine.
 */
export const admSans = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-adm-sans',
  display: 'swap',
})
