-- 013_menu_gluten_free.sql
-- Phase 3 (MENU-01/02, D-02/D-03/D-04).
-- Apply to production BEFORE deploying code that writes is_gluten_free (plan 03-06).
-- Default false and NO backfill on purpose: chef Jariya confirms each dish one by one
-- (allergy safety), the owner then flags it in the admin.
-- The Belgian wines & beers page is created INACTIVE and empty until the owner
-- supplies the real list (D-01); no wine or beer row is invented here.

alter table public.gecko_menu_items
  add column if not exists is_gluten_free boolean not null default false;

insert into public.gecko_menu_pages (name, slug, description, is_active, display_order)
select 'Vins & bières belges', 'vins-bieres-belges', null, false,
       coalesce((select max(display_order) from public.gecko_menu_pages), 0) + 1
where not exists (
  select 1 from public.gecko_menu_pages where slug = 'vins-bieres-belges'
);
