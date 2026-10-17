# Phase 5: Conversion et mesure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-17
**Phase:** 5-Conversion et mesure
**Areas discussed:** Mesure et sources, Preuve sociale, Qui sommes-nous et Comment venir, Paiement/LINE/« Un souci ? »

---

## Mesure et sources

| Question | Options | Selected |
|----------|---------|----------|
| Outil d'analytics | Plausible / GA4 / Tu décides | Plausible (Recommandé) |
| Hébergement Plausible | Cloud / Auto-hébergé / Compte déjà créé | Cloud (Recommandé) |
| Champ « source » | Auto + admin / Site uniquement / Tu décides | Auto + admin (Recommandé) |
| Clics /review par source | Visites par src + clics sortants + tableau admin / Visites seulement / Via Plausible | Visites /review par src (Recommandé) |

**Notes:** Plausible évite le bandeau de consentement. Création du compte = action du propriétaire.

---

## Preuve sociale

| Question | Options | Selected |
|----------|---------|----------|
| Origine des avis | Propriétaire choisit / Propriétaire fournit / Tu décides | Propriétaire choisit (Recommandé) |
| Stockage | Fichier de config / Table + admin / API Places | Fichier de config (Recommandé) |
| Langue et schema | Original + aggregateRating / Original sans schema / Traduits | Original + schema (Recommandé) |
| Placement | Juste avant #reservation / Bandeau hero / Tu décides | Juste avant #reservation (Recommandé) |

---

## Qui sommes-nous et Comment venir

| Question | Options | Selected |
|----------|---------|----------|
| Section | Enrichir #about / Nouvelle section / Tu décides | Enrichir #about (Recommandé) |
| Photo/récit | Propriétaire fournit / Brouillon Claude / Photo plus tard | Photo plus tard |
| Source du texte | Je dicte ici / Chercher dans l'existant / Texte générique | Chercher dans l'existant |
| Carte | Iframe au clic / Iframe lazy / Image statique | Iframe au clic (Recommandé) |
| Placement Comment venir | Dans #contact / Section séparée / Tu décides | Dans #contact (Recommandé) |

---

## Paiement, LINE et « Un souci ? »

| Question | Options | Selected |
|----------|---------|----------|
| Frais carte | Mention claire / + astuce espèces / Sans pourcentage | Mention claire (Recommandé) |
| LINE | Lien ID fourni / Pas de compte / Dans le formulaire | Lien ID fourni (Recommandé) |
| « Un souci ? » | Message + email optionnel / Stocké en base / Message seul | Message + email optionnel (Recommandé) |
| Modèle WhatsApp | Page Avis / Sur chaque réservation / Les deux | Dans la page Avis (Recommandé) |

**Notes:** L'ID LINE n'a pas encore été communiqué ; le bouton reste masqué tant que `NEXT_PUBLIC_LINE_URL` est absent.

---

## Claude's Discretion

- Performance (SEO-08) : images WebP/AVIF, lazy loading, chargement différé de Plausible.
- Schémas de tables, route de redirection comptée, noms d'événements, anti-bot, composants.

## Deferred Ideas

- Historique « Un souci ? » en admin, avis admin/Places, bouton WhatsApp par réservation, traduction des avis, texte DE (phase 6).
