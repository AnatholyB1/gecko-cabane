# Phase 8 - Audit de sécurité (reporting KPI hebdomadaire)

Branche auditée : `milestone/v1.0-phase8` (diff `master...milestone/v1.0-phase8`). Méthode : lecture du code livré, aucun appel externe, aucune valeur de secret affichée. ASVS niveau 1-2. Le code source n'a pas été modifié.

Résultat : 0 BLOCKER, 0 High, 2 Medium, 5 Low, 3 Info. Aucune mitigation déclarée absente du code. Les points ouverts sont des écarts de durcissement.

## 1. Menace -> mitigation

| # | Menace | Mitigation attendue | Preuve | Statut |
|---|--------|---------------------|--------|--------|
| 1a | Appel non authentifié du cron | Bearer CRON_SECRET, fail-closed | `src/app/api/cron/weekly-kpi/route.ts:77-80` : `!cronSecret \|\| header !== Bearer ...` => 401 avant tout travail. Test `tests/kpi-cron-route.test.ts:171` (secret absent). | Prouvée |
| 1b | Contournement par `?dry=1`, `?send=1`, `?week=` | Paramètres traités après la garde | route.ts:82-95 (lus après la garde) ; `week` validé par `parseWeekParam` (regex stricte, vrai lundi, kpi-week.ts:25-31) ; `dry=1` désactive `sendEligible` (route.ts:105) | Prouvée |
| 1c | Comparaison du secret sûre | Comparaison temps constant | route.ts:78 : `!==` simple, pas de `timingSafeEqual` | Non prouvée (F-03, Low) |
| 2a | /api/kpi hors admin | `requireAdmin` GET et PUT | `src/app/api/kpi/route.ts:30` et `:67` ; `src/utils/auth.ts` 401 sans session, 403 si non membre `gecko_admins` (fail-closed) | Prouvée |
| 2b | Validation / injection saisie libre | zod strict, bornes, requêtes paramétrées | `src/utils/kpi-manual.ts:21-37` (Lundi valide, entiers bornés, note <= 500) ; écriture par client Supabase paramétré (route.ts:83-117) ; pas de SQL brut. Le schéma zod ignore les clés inconnues (pas de mass assignment : `manual` est construit champ par champ, route.ts:94-100) | Prouvée |
| 2c | Un admin n'écrit que les colonnes manuelles | RLS + GRANT colonne | `018_weekly_kpis.sql:55-84` : RLS activée, 3 policies `gecko_is_admin()`, `revoke all` puis `grant insert/update` limités à 5-7 colonnes manuelles (+ `week_start`, `week_end` à l'insert, `updated_at` à l'update). Pas de DELETE, pas d'UPDATE sur `week_start`. Checks de domaine sur les colonnes manuelles et `week_end = week_start + 6`, lundi imposé | Prouvée |
| 2d | Le collecteur seul écrit les autres colonnes | service role serveur | Cron : `createAdminClient()` (route.ts:102), upsert des colonnes collecteur uniquement (route.ts:163-172). Aucun import de `createAdminClient` ni des modules `kpi-*` serveur dans `src/app/admin/kpi/page.tsx` (la page n'utilise que `fetch('/api/kpi')`). Pas de variable `NEXT_PUBLIC_` ajoutée | Prouvée |
| 3a | Échappement HTML de toute valeur d'email | `escapeHtml` | `kpi-report-email.ts:53,61,70,81-82,88-92,96,99` (lecture IA, actions, alertes, libellés, note libre, URL) ; `kpi-manual.ts:65-70` (alerte note basse) ; `html.ts` échappe `& < > " '` | Prouvée |
| 3b | En-tête / sujet | `stripLineBreaks` | `kpi-mode.ts:48`, `kpi-manual.ts:56` | Prouvée |
| 3c | Mode TEST par défaut, valeur inconnue => test | `resolveReportMode` | `kpi-mode.ts:12-14` : seul `live` exact (après trim, sensible à la casse) donne live ; test `tests/kpi-cron-route.test.ts:336` (`LIVE` => test). En test, un seul destinataire (kpi-mode.ts:30). Destinataires live : validés, dédoublonnés, plafond 10 | Prouvée |
| 3d | Pas de fuite de données personnelles par email | Agrégats seulement | Colonnes réservations limitées à `id,status,date,party_size,created_at,source` (kpi-collect.ts:132) ; le registre de consentement n'est réduit qu'à un compteur (kpi-collect.ts:224). Exception : la note manuelle libre (F-02) | Partiellement prouvée |
| 4a | Prompt : liste blanche, pas de PII | `buildNarrativeInput` | `kpi-narrative.ts:15-56` : seulement dates, clés/valeurs numériques, codes d'alerte, états de sources, clics /review (clés `source:kind` typées). Note manuelle, messages d'alerte, lecture précédente exclus. Test `tests/kpi-narrative.test.ts` | Prouvée |
| 4b | Sortie IA validée | schéma + nettoyage | `kpi-narrative.ts:71-95` : JSON extrait, zod (3+3 chaînes, 1-300 caractères), balises supprimées, repli déterministe sinon ; puis `escapeHtml` à l'envoi ; React échappe dans l'admin (page.tsx:378-387) | Prouvée |
| 4c | Injection de prompt par note libre / retour client | Aucune entrée libre dans le prompt | Voir 4a ; aucun champ texte libre n'atteint `buildPrompt`. Pas d'appel en dry-run (`apiKey: undefined`, route.ts:48), pas d'appel si budget < 15 s, un seul appel par envoi (le `report_sent_at` saute l'IA, route.ts:213) | Prouvée |
| 5 | Clé privée JWT Search Console | Jamais loggée ni renvoyée | `kpi-gsc.ts` : aucun `console`, aucun Sentry ; tout `catch` renvoie `null` ; la clé n'est utilisée que dans `createSign().sign()` ; scope `webmasters.readonly` ; le JSON n'est lu que dans `externalEnv()` (route.ts:24-33) et jamais renvoyé (la réponse dry-run contient `values`, `sources_status`, sans secret) | Prouvée |
| 6a | Bright Data : 1 appel / semaine max | `tripadvisor_checked_at` | `kpi-sources.ts:54-60,77` ; la tentative est consommée dès qu'une requête peut partir | Prouvée (voir F-05) |
| 6b | Pas en dry-run | `skipPaid` | route.ts:130 `skipPaid: dryRun` ; kpi-sources.ts:60 | Prouvée |
| 6c | Pas de boucle de retry | un fetch, `AbortSignal.timeout` | `kpi-tripadvisor.ts:88-103` ; SSRF limité par `isAllowedTripadvisorUrl` (https, hôte tripadvisor.*) | Prouvée |
| 7 | Secrets dans docs et tests | noms seulement | `docs/kpi/KPI-SETUP.md` ne contient que des noms de variables ; recherche de motifs de clés (Anthropic, Resend, PEM, JWT, Google) : aucun résultat dans `docs/kpi`, `tests/kpi-*`. Test `tests/kpi-docs.test.ts:81-82` | Prouvée |
| 8 | PDPA : pas de nouvelle donnée client | Table sans PII | `018` : agrégats seulement, commentaire "No personal data". Seule donnée libre : `manual_note` (500 caractères), saisie par un admin (F-02) | Prouvée sous réserve F-02 |
| 9 | Logs / Sentry sans PII | Pas de contenu libre dans les événements | `route.ts` (cron) : erreurs Supabase / `new Error('kpi report send failed')` avec `week_start` seulement ; `kpi/route.ts:156` : la note n'est pas envoyée à Sentry ; pas de `console.*` dans les fichiers `kpi-*`. Réserve : configuration globale Sentry (F-01) | Partiellement prouvée |

## 2. Findings

| ID | SEV | Fichier:ligne | Problème | Correctif |
|----|-----|---------------|----------|-----------|
| F-01 | Medium | `sentry.server.config.ts:34`, `sentry.edge.config.ts:32` (préexistant, touche P8) | `sendDefaultPii: true` : les événements Sentry des routes cron et `/api/kpi` peuvent embarquer IP, cookies de session admin et en-têtes de requête (dont `Authorization: Bearer` du cron si le scrubbing serveur Sentry n'est pas actif). Contredit l'exigence "Sentry sans PII" | Passer `sendDefaultPii` à `false`, ou ajouter un `beforeSend` qui supprime `request.headers`, `request.cookies` et `user`. Vérifier les paramètres de scrubbing du projet Sentry |
| F-02 | Medium | `src/utils/kpi-report-email.ts:49,94-97` ; `src/app/api/kpi/route.ts:98` | La note manuelle libre (jusqu'à 500 caractères, destinée à l'avis Google saisi à la main) est insérée telle quelle dans le rapport envoyé à tous les destinataires `KPI_REPORT_RECIPIENTS` en mode live. Elle peut contenir le nom d'un client ou le texte d'un avis : donnée personnelle diffusée au-delà du propriétaire, sans nécessité (PDPA) | N'inclure la note que lorsque `mode === 'test'` (propriétaire seul), ou la retirer du rapport et la garder dans l'admin. Ajouter dans le formulaire admin la consigne "ne pas saisir de nom de client" |
| F-03 | Low | `route.ts:78` | Comparaison du Bearer par `!==` (non constant-time). Risque pratique faible (secret long, réseau Vercel), mais la consigne demande une comparaison sûre. Même motif dans les autres crons | Comparer les hachés SHA-256 des deux valeurs avec `crypto.timingSafeEqual`, après vérification de longueur |
| F-04 | Low | `src/utils/kpi-collect.ts:183-184` | `select('*')` sur `gecko_marketing_consents` avec le service role : les emails de tous les inscrits sont chargés en mémoire pour ne garder qu'un compteur. Minimisation PDPA, et risque si une erreur remontait les lignes | Sélectionner uniquement les colonnes lues par `resolveActiveSubscribers` (pas de colonnes inutiles), ou compter côté SQL |
| F-05 | Low | `route.ts:87-95,126-131` ; `kpi-sources.ts:54-77` | Le plafond Bright Data est par ligne de semaine, pas par date réelle. `?week=` (avec le secret) sur N semaines passées donne N appels payants, et le rang du jour est enregistré sur une semaine passée (donnée fausse). Si l'upsert échoue après l'appel, `checked_at` n'est pas conservé et l'appel peut se répéter à la passe suivante (2 par jour max, pas de boucle) | Ne collecter le rang TripAdvisor que si `week.start` est la semaine précédente courante ; sinon laisser la valeur existante |
| F-06 | Low | `route.ts:121,125-139,163` ; `kpi-sources.ts:33` | Hors fenêtre d'envoi, une nouvelle passe (rejeu manuel `?week=` sans `send`) recollecte tout : si Search Console est momentanément indisponible, `GSC_NULL` écrase des valeurs correctes déjà stockées. Intégrité des données | Ne pas écraser une valeur existante non nulle par `null` quand la source échoue |
| F-07 | Low | `src/app/api/kpi/route.ts:83-117` | Lecture puis insertion/mise à jour non atomique : une insertion concurrente du cron ou d'un autre admin sur la même semaine donne une erreur 500 (clé primaire) | Réessayer une fois en update sur conflit 23505 |
| F-08 | Info | `kpi-narrative.ts:76` | `stripTags` partiel (une balise non fermée subsiste). Sans effet : l'échappement est appliqué dans l'email HTML et React échappe dans l'admin. La version texte brut de l'email contient la sortie IA non échappée (texte, sans exécution) | Aucun correctif requis ; durcir si la sortie IA est un jour rendue en HTML brut |
| F-09 | Info | `route.ts:143-158`, `docs/kpi/KPI-SETUP.md:52` | Le dry-run appelle bien Search Console (gratuit) alors que la doc dit qu'il n'écrit rien (exact) mais ne dit pas qu'il fait des appels sortants. Il renvoie des agrégats uniquement, après la garde | Préciser la doc |
| F-10 | Info | `tests/kpi-cron-route.test.ts` | Les tests utilisent des valeurs factices (`test-secret`, `ai-key`), sans secret réel. Aucun test ne vérifie explicitement qu'un `Bearer` faux est refusé avec `?dry=1&send=1` | Ajouter ce cas de non-régression |

## 3. Signalements non enregistrés (SUMMARY.md)

Aucun nouveau signalement hors modèle de menaces. F-01 est un risque préexistant lié à la configuration globale.

## 4. Conclusion

Toutes les mitigations déclarées sont présentes dans le code. Avant la bascule en mode live (KPI-08) : traiter F-01 et F-02 (Medium), idéalement F-03 et F-05.
