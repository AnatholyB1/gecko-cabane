# Phase 4: Tunnel d'avis et fiche Google - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-17
**Phase:** 4-Tunnel d'avis et fiche Google
**Areas discussed:** « Honorée » par défaut, Planification des emails, Page /review et clics, QR code et supports, Fiche Google (OPS-01)

---

## « Honorée » par défaut

| Option | Description | Selected |
|--------|-------------|----------|
| Calcul à l'envoi | Cron cible `confirmed` à date passée, pas de migration de statut | ✓ |
| Passage auto en `completed` | Le cron bascule le statut | |
| Nouveau statut `honored` | Statut distinct, touche type/SQL/UI | |

**User's choice:** Calcul à l'envoi.
**Notes:** Éligibles = `confirmed` + `completed` (pas `pending`). Fenêtre no-show = jusqu'à J+1 11h, pas de rattrapage après envoi. Badge de suivi sur la carte de réservation admin.

---

## Planification des emails

| Option | Description | Selected |
|--------|-------------|----------|
| Vercel Cron quotidien | 04:00 UTC = 11:00 Krabi, `CRON_SECRET` | ✓ |
| pg_cron Supabase + HTTP | Base partagée | |
| Cron externe | Service tiers | |

**User's choice:** Vercel Cron quotidien.
**Notes:** Idempotence par colonnes sur `gecko_reservations` (pas de table dédiée). Rattrapage borné à J+3. Email en locale de la réservation, gabarit Resend existant ; de/sv retombent sur en.

---

## Page /review et clics

| Option | Description | Selected |
|--------|-------------|----------|
| Une page, 3 chemins | Alias vers `/{locale}/review`, noindex, hors sitemap | ✓ |
| Pages localisées fr/en seulement | `/fr/avis`, `/en/review` | |

**User's choice:** Une page, 3 chemins ; langue = locale de la réservation via `rid`.
**Notes:** Le rendu serveur avec `rid` pose `review_clicked_at` ; clics sortants par source reportés en phase 5. Lien Google = `search.google.com/local/writereview?placeid=…`.

---

## QR code et supports

| Option | Description | Selected |
|--------|-------------|----------|
| 2 PDF : addition + chevalet | Prêts à imprimer, FR/EN/DE | ✓ |
| 1 planche A4 découpable | | |
| QR seul | | |

**User's choice:** 2 PDF ; QR par script local, fichiers commités.
**Notes:** DE rédigé par Claude, marqué « à relire » par le propriétaire. Ton chaleureux sans promesse ni contrepartie.

---

## Fiche Google (OPS-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Claude prépare, propriétaire applique | Checklist et textes | |
| Claude pilote GBP via Chrome après accord | Validation avant chaque clic | ✓ |

**User's choice:** Claude pilote via Chrome après accord.
**Notes:** Photos : réutiliser `public/` d'abord (~7 pour 20 demandées) ; publier l'existant, complément noté côté propriétaire. Lien de réservation `/{locale}#reservation` avec UTM + lien `/menu`.

---

## Claude's Discretion

Format des PDF, nom de la route cron, structure du module d'envoi, clés i18n, forme du badge admin, numéro de migration, schéma du lien TripAdvisor, rendu des alias, tests.

## Deferred Ideas

- Clics sortants par source et tableau mensuel (phase 5, REV-06)
- Modèle WhatsApp `src=wa` (phase 5, REV-05)
- « Un souci ? » (phase 5, REV-07)
- Textes DE/SV après relecture (phase 6)
- Table `gecko_review_invitations` si la phase 5 en a besoin
- Complément jusqu'à 20 photos (propriétaire)
