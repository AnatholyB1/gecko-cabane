# ACC-03 « Complet ce soir » : options de modèle (phase 17)

Décision du propriétaire (2026-10-31) : fermer le DÎNER d'une date en un tap, avec confirmation, réversible, par date, sans migration destructive. Éléments figés : `src/app/api/reservations/**`, `gecko_create_reservation` (migration 008), emails, cron J+1, KPI.

## 1. Investigation : qui lit quoi

| Élément | Lit | Effet réel |
|---|---|---|
| `POST /api/reservations` (figé) | `gecko_opening_hours` (tout), `gecko_special_hours` (`.eq('date', reservation_date)`), `gecko_restaurant_settings` | `checkSlot()` (`src/utils/reservation-rules.ts`) : `resolveHours` donne la priorité à la ligne exceptionnelle de la date sur la ligne hebdomadaire ; refuse (422 `slot_unavailable`) si l'heure est < `open_time` ou > min(`close_time`, dernière heure réservable) ; refuse avant même d'appeler le RPC |
| `gecko_create_reservation` (008, figé) | seulement `max_covers` (+ somme des couverts sur la fenêtre `table_block_duration_minutes`) | Ne lit PAS les horaires : appelable uniquement par `service_role`, donc seulement via la route ci-dessus |
| `ReservationForm` (public, non figé) | `/api/settings` seulement ; grille fixe `TIME_SLOTS` filtrée par `last_reservation_time` | AVANT cette phase : indépendant de la date. Il proposait donc le dîner même un jour fermé ; le serveur répondait 422 après saisie |
| `GET /api/special-hours`, `/api/hours` | lecture publique (RLS « Public read ») | utilisables par le formulaire sans clé ni route nouvelle |
| `reservations/manual` (admin) | n'appelle pas `checkSlot` | l'équipe peut toujours saisir une réservation à la main, même sur un créneau fermé (voulu : surclassement par un humain) |
| `HoursDisplay`, `mcp/route.ts` | `gecko_special_hours` | affichent/annoncent l'horaire exceptionnel (12h–16h) : cohérent avec « dîner fermé » |
| KPI, cron J+1, emails | `gecko_reservations` uniquement | aucun lien avec les horaires |

Constat clé : la disponibilité côté serveur lit déjà `gecko_special_hours` par date. Une fermeture du dîner n'exige donc aucun changement de l'API figée.

## 2. Options comparées

### (a) Horaire exceptionnel de la date qui se termine à 16:00, état précédent mémorisé : RETENUE
- Formulaire public : n'a besoin que d'être rendu sensible à la date (non figé) en réutilisant `checkSlot` (nouvelle fonction `availableSlotsForDate`, `TIME_SLOTS.filter(checkSlot ok)`) : plus aucun créneau ≥ 18:00 pour la date ; le déjeuner (12:00 à 13:30) reste proposé.
- Création côté serveur : `checkSlot` refuse déjà tout POST direct sur 18:00 à 21:30 (422 `slot_unavailable`, RPC jamais appelé). C'est une vraie garantie serveur, pas seulement de l'UX.
- Modifié : une ligne `gecko_special_hours` (titre « Dîner complet », même ouverture, fin 16:00) + une ligne `gecko_restaurant_settings` (`service_closure_prev:YYYY-MM-DD`, JSON de l'état antérieur). Aucun schéma modifié.
- Réversibilité : exacte. Pas de ligne antérieure : la ligne est supprimée ; ligne antérieure : ses 5 champs (titre, ouvert, ouverture, fermeture, note) sont réécrits à l'identique. Mémoire perdue/illisible : retour aux horaires hebdomadaires (seul état sûr).
- Emails / cron / KPI : aucun impact (non lus, non appelés, aucun envoi).
- Cas particuliers : exception « soir seulement » (ouvre ≥ 16:00) : journée entière fermée ; jour déjà fermé ou sans dîner : 409.
- Limites : le public voit « Dîner complet 12:00 — 16:00 » dans la liste des horaires exceptionnels (vrai) ; la clé de mémoire est lisible publiquement (contenu : des horaires) ; si quelqu'un édite la ligne à la main dans Site public > Exceptions, « rouvrir » restaure quand même la mémoire (ou supprime la ligne).

### (b) Nouvelle table `gecko_service_closures(date, service)`
- Pour que la disponibilité la lise, il FAUT modifier `POST /api/reservations` (nouvelle lecture + nouveau refus) : élément figé modifié. Le RPC SQL ne la lirait pas non plus. Écarter.
- (Avantage théorique : sémantique propre « service », pas de détournement des horaires ; coût : migration + modification d'un élément figé.)

### (c) Autres
- c1. Mettre `max_covers` à 0 : réglage GLOBAL, pas par date, et couvre aussi le déjeuner ; non réversible proprement. Écarter.
- c2. Fermer la journée entière (`is_open=false`) : ferme aussi le déjeuner ; ne répond pas à la décision. Gardé seulement comme repli quand le jour n'a qu'un service du soir.
- c3. Colonne `closure_prev jsonb` sur `gecko_special_hours` au lieu de la mémoire dans les réglages : plus propre (mémoire non exposée par `/api/settings`) mais exige une migration à appliquer avant usage. Possible évolution (migration non destructive à écrire à la demande).

## 3. Recommandation

Option (a) : seule à n'exiger AUCUNE modification des éléments figés ni migration. Vérification de contenu contre `c6bc779` (voir rapport) : aucun fichier figé n'est dans `git diff milestone/v1.1`.

Fichiers touchés : `src/utils/service-closure.ts` (logique pure), `src/app/api/service-closure/route.ts` (GET/POST/DELETE, `requireAdmin`, client de l'admin sous RLS, pas de service-role), `src/components/admin/reservations/CompletCeSoir.tsx` (+ `TodayView`, `requests.ts`, CSS), `src/utils/reservation-rules.ts` (ajout d'`availableSlotsForDate`, `checkSlot` inchangé), `src/components/ReservationForm.tsx` (créneaux selon la date ; message existant `slotUnavailable`, aucune nouvelle clé i18n donc aucun texte DE/SV à relire).
