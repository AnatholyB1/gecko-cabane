-- 03-CONTENT.sql
-- Phase 3 (MENU-02, D-01/D-02): owner-supplied Belgian beers, wines, house wine and corkage.
-- Transcribed verbatim from the owner's photos (2026-10-17); NOT applied yet.
-- The page 'vins-bieres-belges' stays inactive here; the owner activates it in the admin (plan 03-08).
-- Idempotent: every insert is guarded by not exists.

begin;

insert into public.gecko_menu_categories (menu_page_id, name, description, display_order)
select p.id, 'Bières belges', null, 1
from public.gecko_menu_pages p
where p.slug = 'vins-bieres-belges'
  and not exists (select 1 from public.gecko_menu_categories c where c.menu_page_id = p.id and c.name = 'Bières belges');

insert into public.gecko_menu_categories (menu_page_id, name, description, display_order)
select p.id, 'Bières trappistes belges', null, 2
from public.gecko_menu_pages p
where p.slug = 'vins-bieres-belges'
  and not exists (select 1 from public.gecko_menu_categories c where c.menu_page_id = p.id and c.name = 'Bières trappistes belges');

insert into public.gecko_menu_categories (menu_page_id, name, description, display_order)
select p.id, 'Bières artisanales', null, 3
from public.gecko_menu_pages p
where p.slug = 'vins-bieres-belges'
  and not exists (select 1 from public.gecko_menu_categories c where c.menu_page_id = p.id and c.name = 'Bières artisanales');

insert into public.gecko_menu_categories (menu_page_id, name, description, display_order)
select p.id, 'Vin de la maison', null, 4
from public.gecko_menu_pages p
where p.slug = 'vins-bieres-belges'
  and not exists (select 1 from public.gecko_menu_categories c where c.menu_page_id = p.id and c.name = 'Vin de la maison');

insert into public.gecko_menu_categories (menu_page_id, name, description, display_order)
select p.id, 'Droit de bouchon', null, 5
from public.gecko_menu_pages p
where p.slug = 'vins-bieres-belges'
  and not exists (select 1 from public.gecko_menu_categories c where c.menu_page_id = p.id and c.name = 'Droit de bouchon');

insert into public.gecko_menu_categories (menu_page_id, name, description, display_order)
select p.id, 'Vins rouges français', 'Prix des vins : demandez à notre équipe.', 6
from public.gecko_menu_pages p
where p.slug = 'vins-bieres-belges'
  and not exists (select 1 from public.gecko_menu_categories c where c.menu_page_id = p.id and c.name = 'Vins rouges français');

insert into public.gecko_menu_categories (menu_page_id, name, description, display_order)
select p.id, 'Vins blancs français', 'Prix des vins : demandez à notre équipe.', 7
from public.gecko_menu_pages p
where p.slug = 'vins-bieres-belges'
  and not exists (select 1 from public.gecko_menu_categories c where c.menu_page_id = p.id and c.name = 'Vins blancs français');

insert into public.gecko_menu_categories (menu_page_id, name, description, display_order)
select p.id, 'Vins rosés français', 'Prix des vins : demandez à notre équipe.', 8
from public.gecko_menu_pages p
where p.slug = 'vins-bieres-belges'
  and not exists (select 1 from public.gecko_menu_categories c where c.menu_page_id = p.id and c.name = 'Vins rosés français');

insert into public.gecko_menu_categories (menu_page_id, name, description, display_order)
select p.id, 'Bulles', 'Prix des vins : demandez à notre équipe.', 9
from public.gecko_menu_pages p
where p.slug = 'vins-bieres-belges'
  and not exists (select 1 from public.gecko_menu_categories c where c.menu_page_id = p.id and c.name = 'Bulles');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Duvel Blonde', '8,5°', 250, null, true, false, false, false, null, 1
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Bières belges'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Duvel Blonde');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Duvel Tripel Hop Cashmere', '9,5°', 280, null, true, false, false, false, null, 2
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Bières belges'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Duvel Tripel Hop Cashmere');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'La Chouffe Blonde', '8°', 250, null, true, false, false, false, null, 3
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Bières belges'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'La Chouffe Blonde');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Kasteel Rouge', '8°', 260, null, true, false, false, false, null, 4
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Bières belges'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Kasteel Rouge');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Vedett IPA', '5,5°', 250, null, true, false, false, false, null, 5
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Bières belges'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Vedett IPA');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'St. Bernardus ABT 12', '10°', 280, null, true, false, false, false, null, 6
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Bières belges'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'St. Bernardus ABT 12');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'St. Bernardus Tripel', '8°', 250, null, true, false, false, false, null, 7
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Bières belges'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'St. Bernardus Tripel');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'St. Bernardus Wit', '5,5°', 250, null, true, false, false, false, null, 8
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Bières belges'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'St. Bernardus Wit');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Bush Ambrée', '12°', 320, null, true, false, false, false, null, 9
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Bières belges'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Bush Ambrée');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Leffe Blonde / Brune', '6,6° / 6,5°', 200, null, true, false, false, false, null, 10
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Bières belges'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Leffe Blonde / Brune');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Hoegaarden Wit', '4,9°', 200, null, true, false, false, false, null, 11
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Bières belges'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Hoegaarden Wit');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Chimay Gold (Blonde)', '4,8°', 250, null, true, false, false, false, null, 1
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Bières trappistes belges'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Chimay Gold (Blonde)');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Chimay Rouge (Brune)', '7°', 280, null, true, false, false, false, null, 2
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Bières trappistes belges'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Chimay Rouge (Brune)');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Chimay Bleue (Brune)', '9°', 300, null, true, false, false, false, null, 3
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Bières trappistes belges'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Chimay Bleue (Brune)');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Rochefort Tripel', '11,3°', 300, null, true, false, false, false, null, 4
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Bières trappistes belges'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Rochefort Tripel');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Westmalle Tripel', '9,5°', 300, null, true, false, false, false, null, 5
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Bières trappistes belges'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Westmalle Tripel');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Westmalle Brune', '7°', 380, null, true, false, false, false, null, 6
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Bières trappistes belges'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Westmalle Brune');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Orval', '6,2°', 300, null, true, false, false, false, null, 7
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Bières trappistes belges'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Orval');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'London Black Cab Stout', '4,5°', 280, null, true, false, false, false, null, 1
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Bières artisanales'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'London Black Cab Stout');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Muay Thai IPA', '5,5°', 190, null, true, false, false, false, null, 2
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Bières artisanales'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Muay Thai IPA');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Muay Thai Pilsner', '4°', 190, null, true, false, false, false, null, 3
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Bières artisanales'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Muay Thai Pilsner');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Muay Thai Wit', '5°', 190, null, true, false, false, false, null, 4
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Bières artisanales'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Muay Thai Wit');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Le verre (110 ml)', null, 190, null, true, false, false, false, null, 1
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vin de la maison'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Le verre (110 ml)');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'La carafe (1/2 litre)', null, 650, null, true, false, false, false, null, 2
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vin de la maison'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'La carafe (1/2 litre)');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Vin tranquille', null, 500, 'par bouteille', true, false, false, false, null, 1
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Droit de bouchon'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Vin tranquille');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Mousseux / boisson alcoolisée', null, 800, 'par bouteille', true, false, false, false, null, 2
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Droit de bouchon'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Mousseux / boisson alcoolisée');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Les Barnabés – Olga Raffault', 'Chinon AOP, Vallée de la Loire', null, null, true, false, false, false, null, 1
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Les Barnabés – Olga Raffault');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Domaine de Chézatte', 'Sancerre AOP, Vallée de la Loire', null, null, true, false, false, false, null, 2
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Domaine de Chézatte');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Domaine Stainmaier', 'Givry 1er Cru AOC, Bourgogne', null, null, true, false, false, false, null, 3
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Domaine Stainmaier');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Patriarche', 'Gevrey-Chambertin AOC, Bourgogne', null, null, true, false, false, false, null, 4
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Patriarche');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Tremor', 'Juliénas AOP, Beaujolais', null, null, true, false, false, false, null, 5
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Tremor');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Château de la Chaize', 'Morgon, Beaujolais', null, null, true, false, false, false, null, 6
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Château de la Chaize');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Pfaff Tradition – Pinot noir vieilles vignes', 'Alsace AOC', null, null, true, false, false, false, null, 7
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Pfaff Tradition – Pinot noir vieilles vignes');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Petite Ruche', 'Crozes-Hermitage AOP, Vallée du Rhône nord', null, null, true, false, false, false, null, 8
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Petite Ruche');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Monier de la Sizeranne', 'Hermitage AOP, Vallée du Rhône nord', null, null, true, false, false, false, null, 9
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Monier de la Sizeranne');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Domaine François Merlin', 'Côte-Rôtie AOP, Vallée du Rhône nord', null, null, true, false, false, false, null, 10
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Domaine François Merlin');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'La Fiole du Pape', 'Châteauneuf-du-Pape AOP, Vallée du Rhône', null, null, true, false, false, false, null, 11
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'La Fiole du Pape');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Père Anselme – Brotte', 'Châteauneuf-du-Pape AOP, Vallée du Rhône', null, null, true, false, false, false, null, 12
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Père Anselme – Brotte');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'La Bernardine', 'Châteauneuf-du-Pape AOP, Vallée du Rhône', null, null, true, false, false, false, null, 13
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'La Bernardine');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Patriarche Endless Summer Pinot Noir', 'Pays d''Oc', null, null, true, false, false, false, null, 14
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Patriarche Endless Summer Pinot Noir');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Marius – Grenache Shiraz', 'Pays d''Oc', null, null, true, false, false, false, null, 15
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Marius – Grenache Shiraz');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Plénitude – Plaimont', 'Madiran AOP', null, null, true, false, false, false, null, 16
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Plénitude – Plaimont');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Château Eugénie – cuvée réserve', 'Cahors AOP', null, null, true, false, false, false, null, 17
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Château Eugénie – cuvée réserve');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Gaspard – Grenache Mourvèdre Syrah', 'Terrasse du Larzac AOP', null, null, true, false, false, false, null, 18
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Gaspard – Grenache Mourvèdre Syrah');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Mouton Cadet', 'Bordeaux AOP', null, null, true, false, false, false, null, 19
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Mouton Cadet');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Château Saint-Germain', 'Bordeaux Supérieur AOP', null, null, true, false, false, false, null, 20
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Château Saint-Germain');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Château Haut-Landon', 'Bordeaux Supérieur AOP', null, null, true, false, false, false, null, 21
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Château Haut-Landon');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Château Domeyne', 'Saint-Estèphe, Médoc AOC, Bordeaux', null, null, true, false, false, false, null, 22
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Château Domeyne');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Château Bibian – Cru Bourgeois Supérieur', 'Listrac-Médoc AOC, Bordeaux', null, null, true, false, false, false, null, 23
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Château Bibian – Cru Bourgeois Supérieur');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Château La Rose Picot', 'Médoc AOC, Bordeaux', null, null, true, false, false, false, null, 24
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Château La Rose Picot');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'L''Esprit de Bacchus', 'Médoc AOC, Bordeaux', null, null, true, false, false, false, null, 25
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'L''Esprit de Bacchus');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Château Malbec', 'Entre-deux-Mers, Bordeaux AOC', null, null, true, false, false, false, null, 26
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Château Malbec');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Château Franc Couplet', 'Entre-deux-Mers, Bordeaux AOC', null, null, true, false, false, false, null, 27
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Château Franc Couplet');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Château Cantelaudette', 'Graves de Vayres, Entre-deux-Mers, Bordeaux AOC', null, null, true, false, false, false, null, 28
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Château Cantelaudette');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Château Treytins', 'Lalande de Pomerol, Bordeaux AOC', null, null, true, false, false, false, null, 29
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Château Treytins');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Château La Croix du Casse', 'Pomerol, Bordeaux', null, null, true, false, false, false, null, 30
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Château La Croix du Casse');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'La Fugue de Nénin', 'Pomerol, Bordeaux', null, null, true, false, false, false, null, 31
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'La Fugue de Nénin');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'La Tour de Capet', 'Saint-Émilion Grand Cru AOC', null, null, true, false, false, false, null, 32
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'La Tour de Capet');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Château du Barry', 'Saint-Émilion Grand Cru AOC', null, null, true, false, false, false, null, 33
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Château du Barry');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Château Montaiguillon', 'Montagne Saint-Émilion', null, null, true, false, false, false, null, 34
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Château Montaiguillon');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Château Paret', 'Côtes de Bordeaux Castillon AOC', null, null, true, false, false, false, null, 35
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Château Paret');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Château Petit Picoron', 'Côtes de Bordeaux Castillon AOC', null, null, true, false, false, false, null, 36
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Château Petit Picoron');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Queue de Morue', 'Muscadet sur Lie AOC, Vallée de la Loire', null, null, true, false, false, false, null, 1
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Queue de Morue');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Domaine de Fiervaux – Chenin Blanc', 'Saumur AOC, Vallée de la Loire', null, null, true, false, false, false, null, 2
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Domaine de Fiervaux – Chenin Blanc');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Les Chantebines – Jean Pabiot', 'Pouilly-Fumé AOC, Vallée de la Loire', null, null, true, false, false, false, null, 3
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Les Chantebines – Jean Pabiot');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Antoine de la Farge', 'Menetou-Salon AOC, Vallée de la Loire', null, null, true, false, false, false, null, 4
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Antoine de la Farge');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Saint-Bris', 'Auxerrois', null, null, true, false, false, false, null, 5
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Saint-Bris');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Château de Maligny', 'Petit Chablis AOC', null, null, true, false, false, false, null, 6
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Château de Maligny');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Louis Robin', 'Chablis AOC', null, null, true, false, false, false, null, 7
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Louis Robin');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Château de Maligny – Montmains', 'Chablis 1er Cru', null, null, true, false, false, false, null, 8
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Château de Maligny – Montmains');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Blason de Bourgogne', 'Saint-Véran, Bourgogne', null, null, true, false, false, false, null, 9
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Blason de Bourgogne');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Pfaff Tradition – Pinot gris', 'Alsace AOC', null, null, true, false, false, false, null, 10
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Pfaff Tradition – Pinot gris');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Pfaff Tradition – Riesling', 'Alsace AOC', null, null, true, false, false, false, null, 11
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Pfaff Tradition – Riesling');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Pfaff Tradition – Gewurztraminer', 'Alsace AOC', null, null, true, false, false, false, null, 12
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Pfaff Tradition – Gewurztraminer');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Invitare', 'Condrieu AOP, Vallée du Rhône nord', null, null, true, false, false, false, null, 13
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Invitare');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Domaine François Merlin', 'Condrieu AOP, Vallée du Rhône nord', null, null, true, false, false, false, null, 14
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Domaine François Merlin');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'La Fiole – Viognier', 'Pays d''Oc IGP', null, null, true, false, false, false, null, 15
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'La Fiole – Viognier');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Marius – Viognier', 'Pays d''Oc IGP', null, null, true, false, false, false, null, 16
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Marius – Viognier');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Château des Ferrages – Roumery', 'Côtes de Provence AOP', null, null, true, false, false, false, null, 1
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rosés français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Château des Ferrages – Roumery');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Château des Ferrages – Mon Plaisir', 'Sainte-Victoire', null, null, true, false, false, false, null, 2
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rosés français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Château des Ferrages – Mon Plaisir');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Côtes de Provence AOC', null, null, null, true, false, false, false, null, 3
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rosés français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Côtes de Provence AOC');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Marius', 'Pays d''Oc IGP', null, null, true, false, false, false, null, 4
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Vins rosés français'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Marius');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Louis Perdrier – Brut Excellence', null, null, null, true, false, false, false, null, 1
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Bulles'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Louis Perdrier – Brut Excellence');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select c.id, 'Champagne Paul Dangin – Carte d''Or Brut', null, null, null, true, false, false, false, null, 2
from public.gecko_menu_categories c
join public.gecko_menu_pages p on p.id = c.menu_page_id
where p.slug = 'vins-bieres-belges' and c.name = 'Bulles'
  and not exists (select 1 from public.gecko_menu_items i where i.category_id = c.id and i.name = 'Champagne Paul Dangin – Carte d''Or Brut');

commit;
