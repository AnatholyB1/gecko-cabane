# 17b-ACC01-NOTES : retrait de la lecture publique de `gecko_table*`

## Ce que fait la migration

`supabase/migrations/020_revoke_public_gecko_table_reads.sql` (fichier seulement, jamais appliqué par un agent) :

- supprime les 4 politiques `Public read ...` (`for select using (true)`) sur `gecko_tables`, `gecko_table_configurations`, `gecko_table_configuration_tables`, `gecko_table_assignments` ;
- retire le privilège `SELECT` du rôle `anon` sur ces 4 tables.

Elle ne supprime aucune table, aucune ligne, aucune colonne. Les politiques `Admin manage ...` (`gecko_is_admin()`) et le rôle `service_role` ne sont pas touchés. Idempotente. Le rollback (4 `create policy` et le `grant`) est en commentaire dans le fichier.

Pourquoi : depuis la phase 10 rien dans ce dépôt ne lit ces tables (tests `tables-removal` et `mcp-route-tables`), mais `gecko_table_assignments` relie des réservations à des créneaux bloqués et reste lisible par n'importe qui avec la clé anon, qui est publique.

## Vérifier qu'aucune autre application ne les lit (à exécuter par le propriétaire)

Le projet Supabase est partagé avec le portfolio. Avant l'accord :

1. **Dépôts** : dans le dépôt du portfolio et tout autre client de ce projet, chercher `gecko_table` (`grep -rn "gecko_table" .`). Aucun résultat attendu.
2. **Journaux d'API Supabase** (Dashboard, Logs, API Edge Logs, ou l'explorateur de journaux) sur au moins 30 jours :

```sql
select
  timestamp,
  event_message,
  metadata[offset(0)].request[offset(0)].path as path,
  metadata[offset(0)].request[offset(0)].headers[offset(0)].user_agent as user_agent
from edge_logs
cross join unnest(metadata) as metadata
where event_message like '%gecko_table%' or metadata[offset(0)].request[offset(0)].path like '%gecko_table%'
order by timestamp desc
limit 200;
```

   Aucune ligne attendue en dehors des tests faits à la main. Une ligne avec une clé anon et un agent utilisateur inconnu = quelqu'un lit ces tables : ne pas appliquer.
3. **Dépendances SQL** : confirmer qu'aucune vue, fonction ni politique ne s'appuie sur ces tables :

```sql
select 'view' as kind, schemaname || '.' || viewname as name from pg_views where definition ilike '%gecko_table%'
union all
select 'function', n.nspname || '.' || p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where pg_get_functiondef(p.oid) ilike '%gecko_table%' and n.nspname = 'public'
union all
select 'policy', schemaname || '.' || tablename || ' / ' || policyname from pg_policies where qual ilike '%gecko_table%' or with_check ilike '%gecko_table%';
```

   Seules les politiques de ces 4 tables elles-mêmes sont normales.
4. **Test à blanc** (facultatif) : sur une branche Supabase (pas la production), appliquer la migration et vérifier que `curl -H "apikey: <anon>" "<url>/rest/v1/gecko_table_assignments?select=*"` renvoie une liste vide ou 401/permission denied, et que l'admin se connecte toujours.

## Règle

La migration n'est appliquée qu'après (a) les trois vérifications ci-dessus et (b) l'accord écrit du propriétaire. Sans accord, la dette reste documentée ici et dans `DEPLOY-CHECKLIST-v1.1.md` (ligne 5).
