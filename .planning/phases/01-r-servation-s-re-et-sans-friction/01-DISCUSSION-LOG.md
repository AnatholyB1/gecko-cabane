# Phase 1: Réservation sûre et sans friction - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-16
**Phase:** 1-Réservation sûre et sans friction
**Areas discussed:** Confirmation sans SMS, Anti-abus (rate limit), Consentement + fin du lookup phone, Bouton WhatsApp flottant

---

## Confirmation sans SMS

| Question | Options | Choix |
|---|---|---|
| Sort du code SMS | Facultatif / **Supprimé du parcours public** / Seulement +66 | Supprimé |
| Statut après envoi | **Pending + email « demande reçue »** / Auto-confirmé / Lien de confirmation email | Pending |
| Validation créneau | Plafond 40 + mardi/horaires / **Capacité complète par créneau** / Hors périmètre | Capacité complète |
| Téléphone | **Sélecteur pays + E.164** / Champ libre / Facultatif | Sélecteur + E.164 |

---

## Anti-abus (rate limit)

| Question | Options | Choix |
|---|---|---|
| Stockage compteurs | **Table Supabase** / Upstash / Vercel Firewall | Table Supabase |
| Seuils | **5/h IP, 3/j email+tél** / plus strict / plus souple | 5/h, 3/j |
| Anti-bot | **Honeypot + délai** / Turnstile / Aucun | Honeypot + délai |
| Routes /api/verify | **Supprimer routes, table, twilio** / Garder derrière rate limit / Flag env | Supprimer |

---

## Consentement + fin du lookup phone

| Question | Options | Choix |
|---|---|---|
| Stockage consentement | **Table gecko_marketing_consents** / Colonnes sur reservations | Table dédiée |
| GET ?phone= | **Suppression pure** / Lien de gestion signé | Suppression |
| Case et base légale | **Case non cochée, double opt-in en phase 7** / Double opt-in dès phase 1 | Phase 7 |
| Page confidentialité | **Créer /privacy FR/EN** / Texte court sans lien | Créer /privacy |

---

## Bouton WhatsApp flottant

| Question | Options | Choix |
|---|---|---|
| Numéro et message | **+66 81 958 5945, message par langue** / Autre numéro / Sans message | +66 81 958 5945 |
| Position | **Bas droite, rond 56px, label hover** / Pilule texte / Masqué sur formulaire | Bas droite rond |

---

## Claude's Discretion

SEC-03 (requireAdmin), SEC-04 (migrations 007+), SEC-05 (webhooks serveur), SEC-06 (zod).

## Deferred Ideas

Lien de gestion signé, double opt-in (phase 7), Turnstile, mesure/source (phase 5).
