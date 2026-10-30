# Phase 8 - Mise en production et correctifs (2026-10-30 / 31)

Journal factuel de ce qui a ete observe en production apres la livraison du code.

## Etat observe (geckocabanerestaurant.com, 2026-10-31)

- Table `gecko_weekly_kpis` presente, ligne de la semaine du 2026-10-19 au 2026-10-25 collectee.
- Controle a blanc (`?dry=1`) : HTTP 200. Envoi reel (`?send=1`) : `sent: true`, mode `test`, mail recu
  par le proprietaire (confirme par lui).
- Redaction : `narrative.source = ai` (appel Claude fonctionnel). `KPI_REPORT_MODE=test` en production.
- Sources de la semaine : reservations ok, newsletter ok, Search Console ok (24 clics, 692 impressions),
  clics /review partial (pas de snapshot S-1), TripAdvisor unavailable (voir ci-dessous).

## Correctifs

| Commit | Objet |
|---|---|
| 2e8f1c2 | Diagnostic Search Console en dry run (etape en echec + code d'erreur Google, sans secret) ; `GSC_SERVICE_ACCOUNT_JSON` corrige |
| c4657fc | Diagnostic TripAdvisor en dry run (`?dry=1&diag=ta`, un appel payant, ni cle ni corps) |
| 4350876 | Delai TripAdvisor 20 s -> 45 s (insuffisant, voir ci-dessous) |
| d23dbdd, 53c5731 | Avis Google automatiques (Places API (New)) ; authentification par le compte de service Search Console, aucune cle supplementaire ; diagnostic `?dry=1&diag=gr` |
| ed048a5 | Delai TripAdvisor 90 s, `maxDuration` de la route 120 s |

### TripAdvisor : cause et mesure

Le Web Unlocker (zone `gecko_tripadvisor`, cle et zone valides, journal Bright Data en `Success`) met 18 a 51 s
sur la fiche (mesure sur 5 appels, 868 Ko, rang `#6 of 437` toujours extrait). Le delai de 20 s coupait
silencieusement (`fetch` renvoie `null`, jamais journalise). Valide en production apres ed048a5 :
`ta_diag = ok, HTTP 200, 39,4 s, rang 6 / 437`. Un 502 isole (28,7 s) a ete observe une fois, non reproduit.
Un seul essai par semaine (`tripadvisor_checked_at`) : la semaine du 2026-10-19 est verrouillee sans rang ;
le premier rang reel est attendu au cron du 2026-11-02 00:00 UTC.

### Decision D-03 levee (avis Google)

D-03 classait les avis Google automatiques hors v1 (saisie manuelle). A la demande du proprietaire, le total
(`google_reviews_total`) et les nouveaux avis (`google_new_reviews` = total - total S-1, jamais negatif) sont
remplis par le collecteur **seulement s'ils sont vides** : une saisie manuelle n'est jamais ecrasee.
`google_min_rating` et `manual_note` restent manuels (l'API ne renvoie que 5 avis tries par pertinence, pas par
date : l'alerte avis negatif ne serait pas fiable). Place ID `ChIJozpAo2GUUTARABLcICH3H7I`, verifie : 1065 avis, 4,7.
Le test de garde `kpi-cron-route` n'interdit plus que `google_min_rating` et `manual_note`.

## Reste ouvert

- 08-13 : deux rapports TEST valides (le premier : 2026-11-02), puis `KPI_REPORT_MODE=live` (pas avant le 2026-11-16).
- Premier cron automatique (2026-11-02 00:00 UTC) et premieres alertes / comparaisons S-1 : non observes.
- Cle API Google `gecko-cabane-places-server` creee puis devenue inutile : a supprimer. Ancienne cle « Maps API Key »
  (2023) sans restriction : a restreindre ou supprimer. Plafond de quota Places API non pose.
- Suite de tests : 97 fichiers, 1365 passes, 1 ignore ; tsc propre.
