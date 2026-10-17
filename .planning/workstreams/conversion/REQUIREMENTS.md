# Requirements (workstream: conversion): Gecko Cabane

**Source:** `.planning/REQUIREMENTS.md` (filtré sur la phase 5). Échéance P1 : 1er novembre 2026 pour les exigences [P1].

## v1 Requirements

### SEO technique (SEO)

- [ ] **SEO-08** (T7): Images hero en WebP/AVIF, `loading="lazy"` hors écran, LCP < 2,5 s en 4G, PageSpeed mobile ≥ 85

### Carte (MENU)

- [x] **MENU-03** (R2): La mention « espèces, cartes, PromptPay » et les éventuels frais carte (5 %) sont visibles sur la carte et la page réservation

### Réservation (RESA)

- [ ] **RESA-05** (R1): Un bouton LINE est présent pour les Thaïlandais
- [x] **RESA-06**: Chaque réservation porte un champ « source » (site, WhatsApp, téléphone, sans réservation) ; les événements « réservation envoyée » et « clic WhatsApp » sont mesurés

### Conversion (CONV)

- [x] **CONV-01** (C2): Un bloc de preuve sociale (note Google 4,7 pour 1 062 avis, badge Travellers' Choice TripAdvisor, 3 à 4 avis réels avec prénom et pays, lien « Laisser un avis ») est visible au-dessus de la réservation
- [ ] **CONV-02** (C3): Une section « Qui sommes-nous » présente la cheffe Jariya, le propriétaire, la photo du couple et l'origine du lieu, en FR/EN/DE
- [ ] **CONV-03** (C4): Un bloc « Comment venir » (depuis Ao Nang 20 min en taxi, songthaew 50 bahts, 3 min du Walking Street, 15 min de Chao Fah Pier) affiche une carte intégrée et un bouton d'itinéraire Google Maps

### Tunnel d'avis (REV)

- [ ] **REV-05** (A5): L'admin fournit un modèle de message WhatsApp avec lien `/review?src=wa`
- [ ] **REV-06** (A6): Les clics sur `/review` sont comptés par source (email, QR, WhatsApp) et un tableau de suivi mensuel compare avis Google et TripAdvisor
- [ ] **REV-07**: Le champ « Un souci ? » de `/review` envoie un email au propriétaire dès réception, affiché en même temps que les boutons d'avis, sans filtrage

### KPI et reporting (KPI)

- [x] **KPI-01**: GA4 ou Plausible est installé avec les événements « réservation envoyée » et « clic WhatsApp »

