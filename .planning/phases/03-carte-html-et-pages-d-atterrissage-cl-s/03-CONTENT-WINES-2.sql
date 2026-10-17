-- 03-CONTENT-WINES-2.sql
-- Owner's typed "liste des vins" (2026-10-17): grape varieties, spelling fixes, missing wines.
-- Additive/corrective only: wines present only on the first printed board are kept. Idempotent.
begin;

update public.gecko_menu_items set description = 'Côtes de Provence AOP · Clairette, Rolle, Cinsault, Grenache, Syrah', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rosés français') and name in ('Château des Ferrages – Roumery');

update public.gecko_menu_items set description = 'Sainte-Victoire, Côtes de Provence AOP · Rolle, Grenache, Syrah', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rosés français') and name in ('Château des Ferrages – Mon Plaisir');

update public.gecko_menu_items set description = 'Vignobles Gunther-Chéreau · Muscadet Sèvre et Maine sur lie · Melon de Bourgogne', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français') and name in ('Queue de Morue');

update public.gecko_menu_items set name = 'Domaine de Fiervaux – Les Écobuts', description = 'Saumur AOC · Chenin blanc', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français') and name in ('Domaine de Fiervaux – Chenin Blanc', 'Domaine de Fiervaux – Les Écobuts');

update public.gecko_menu_items set name = 'Les Chambertines – Jean Pabiot et fils', description = 'Pouilly-Fumé AOC · Sauvignon blanc', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français') and name in ('Les Chantebines – Jean Pabiot', 'Les Chambertines – Jean Pabiot et fils');

update public.gecko_menu_items set description = 'Menetou-Salon AOC · Sauvignon blanc', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français') and name in ('Antoine de la Farge');

update public.gecko_menu_items set description = 'La Bourgondie · Saint-Bris AOC (Auxerrois) · Sauvignon blanc', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français') and name in ('Saint-Bris');

update public.gecko_menu_items set description = 'Petit Chablis · Chardonnay', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français') and name in ('Château de Maligny');

update public.gecko_menu_items set description = 'Chablis · Chardonnay', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français') and name in ('Louis Robin');

update public.gecko_menu_items set description = 'Chablis 1er Cru Montmains · Chardonnay', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français') and name in ('Château de Maligny – Montmains');

update public.gecko_menu_items set description = 'Mâconnais, Saint-Véran AOC · Chardonnay', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français') and name in ('Blason de Bourgogne');

update public.gecko_menu_items set description = 'Alsace AOC · Pinot gris · dry off 9 g/L', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français') and name in ('Pfaff Tradition – Pinot gris');

update public.gecko_menu_items set description = 'Alsace AOC · Riesling', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français') and name in ('Pfaff Tradition – Riesling');

update public.gecko_menu_items set description = 'Alsace AOC · Gewurztraminer · dry off 3 g/L', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français') and name in ('Pfaff Tradition – Gewurztraminer');

update public.gecko_menu_items set description = 'Chapoutier · Condrieu AOC, Côtes du Rhône · Viognier', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français') and name in ('Invitare');

update public.gecko_menu_items set description = 'Condrieu AOC, Côtes du Rhône · Viognier', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français') and name in ('Domaine François Merlin');

update public.gecko_menu_items set description = 'Père Anselme Brotte · Pays d''Oc IGP · Viognier', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français') and name in ('La Fiole – Viognier');

update public.gecko_menu_items set description = 'Pays d''Oc IGP · Viognier', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français') and name in ('Marius – Viognier');

update public.gecko_menu_items set description = 'Chinon AOC · Cabernet franc', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and name in ('Les Barnabés – Olga Raffault');

update public.gecko_menu_items set description = 'Sancerre AOC · Pinot noir', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and name in ('Domaine de Chézatte');

update public.gecko_menu_items set name = 'Domaine Steinmaier', description = 'Givry 1er Cru, Côtes chalonnaise AOC · Pinot noir', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and name in ('Domaine Stainmaier', 'Domaine Steinmaier');

update public.gecko_menu_items set description = 'Gevrey-Chambertin, Côtes de Nuits AOC · Pinot noir', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and name in ('Patriarche');

update public.gecko_menu_items set name = 'Tremel', description = 'Juliénas, Beaujolais AOC · Gamay', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and name in ('Tremor', 'Tremel');

update public.gecko_menu_items set description = 'Chapoutier · Crozes-Hermitage AOC · Shiraz', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and name in ('Petite Ruche');

update public.gecko_menu_items set description = 'Chapoutier · Hermitage AOC · Shiraz', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and name in ('Monier de la Sizeranne');

update public.gecko_menu_items set description = 'Côte-Rôtie AOC · Shiraz', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and name in ('Domaine François Merlin');

update public.gecko_menu_items set description = 'Père Anselme · Châteauneuf-du-Pape AOC · Grenache, Mourvèdre, Syrah', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and name in ('La Fiole du Pape');

update public.gecko_menu_items set description = 'Chapoutier · Châteauneuf-du-Pape AOC · Grenache, Mourvèdre, Syrah', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and name in ('La Bernardine');

update public.gecko_menu_items set description = 'Pays d''Oc IGP · Pinot noir', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and name in ('Patriarche Endless Summer Pinot Noir');

update public.gecko_menu_items set description = 'Chapoutier · Pays d''Oc IGP · Grenache, Shiraz', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and name in ('Marius – Grenache Shiraz');

update public.gecko_menu_items set description = 'Bordeaux AOP · Cabernet franc, Cabernet sauvignon, Merlot', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and name in ('Mouton Cadet');

update public.gecko_menu_items set description = 'Saint-Estèphe AOC · Cabernet sauvignon, Merlot', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and name in ('Château Domeyne');

update public.gecko_menu_items set description = 'Listrac, Haut-Médoc AOC · Cabernet sauvignon, Merlot, Petit Verdot', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and name in ('Château Bibian – Cru Bourgeois Supérieur');

update public.gecko_menu_items set description = 'Entre-deux-Mers, Bordeaux AOP · Merlot, Cabernet franc, Cabernet sauvignon', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and name in ('Château Malbec');

update public.gecko_menu_items set description = 'Entre-deux-Mers, Bordeaux Supérieur AOC · Merlot, Cabernet sauvignon', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and name in ('Château Franc Couplet');

update public.gecko_menu_items set description = 'Entre-deux-Mers, Graves de Vayres AOC · Merlot', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and name in ('Château Cantelaudette');

update public.gecko_menu_items set description = 'Lalande de Pomerol AOC · Cabernet franc, Cabernet sauvignon, Merlot', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and name in ('Château Treytins');

update public.gecko_menu_items set description = 'Pomerol AOC · Merlot, Cabernet franc', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and name in ('Château La Croix du Casse');

update public.gecko_menu_items set description = 'Pomerol AOC · Cabernet franc, Merlot', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and name in ('La Fugue de Nénin');

update public.gecko_menu_items set description = 'Saint-Émilion Grand Cru AOC · Merlot', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and name in ('La Tour de Capet');

update public.gecko_menu_items set description = 'Saint-Émilion Grand Cru AOC · Merlot, Cabernet sauvignon, Malbec', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and name in ('Château du Barry');

update public.gecko_menu_items set description = 'Montagne Saint-Émilion · Cabernet franc, Cabernet sauvignon, Merlot', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and name in ('Château Montaiguillon');

update public.gecko_menu_items set description = 'Côtes de Castillon AOC · Cabernet franc, Cabernet sauvignon, Merlot', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and name in ('Château Paret');

update public.gecko_menu_items set description = 'Côtes de Castillon AOC · Merlot', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and name in ('Château Petit Picoron');

update public.gecko_menu_items set description = 'Pinot noir, Chardonnay', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Bulles') and name in ('Champagne Paul Dangin – Carte d''Or Brut');

update public.gecko_menu_items set description = 'Ugni blanc, Colombard, Chenin blanc, Folle blanche', updated_at = now()
where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Bulles') and name in ('Louis Perdrier – Brut Excellence');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français'), 'Jean Brocard', 'Petit Chablis · Chardonnay', null, null, true, false, false, false, null,
  coalesce((select max(i.display_order) from public.gecko_menu_items i where i.category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français')), 0) + 1
where not exists (select 1 from public.gecko_menu_items i where i.category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français') and i.name = 'Jean Brocard');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français'), 'Pfaff – Riesling Zinnkoepflé', 'Alsace Grand Cru AOC · Riesling', null, null, true, false, false, false, null,
  coalesce((select max(i.display_order) from public.gecko_menu_items i where i.category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français')), 0) + 1
where not exists (select 1 from public.gecko_menu_items i where i.category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins blancs français') and i.name = 'Pfaff – Riesling Zinnkoepflé');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'), 'La Bourgondie – Givry', 'Côtes chalonnaise AOC · Pinot noir', null, null, true, false, false, false, null,
  coalesce((select max(i.display_order) from public.gecko_menu_items i where i.category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français')), 0) + 1
where not exists (select 1 from public.gecko_menu_items i where i.category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and i.name = 'La Bourgondie – Givry');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'), 'Domaine Gry-Sablon', 'Morgon, Beaujolais AOC · Gamay', null, null, true, false, false, false, null,
  coalesce((select max(i.display_order) from public.gecko_menu_items i where i.category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français')), 0) + 1
where not exists (select 1 from public.gecko_menu_items i where i.category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and i.name = 'Domaine Gry-Sablon');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'), 'Plaimont – L''Apéro-nautes', 'Madiran AOP · Tannat', null, null, true, false, false, false, null,
  coalesce((select max(i.display_order) from public.gecko_menu_items i where i.category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français')), 0) + 1
where not exists (select 1 from public.gecko_menu_items i where i.category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and i.name = 'Plaimont – L''Apéro-nautes');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'), 'Clos de Gamot', 'Cahors AOP · Malbec', null, null, true, false, false, false, null,
  coalesce((select max(i.display_order) from public.gecko_menu_items i where i.category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français')), 0) + 1
where not exists (select 1 from public.gecko_menu_items i where i.category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and i.name = 'Clos de Gamot');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'), 'Aubert & Mathieu', 'Languedoc, Terrasse du Larzac AOP · Grenache, Mourvèdre, Syrah', null, null, true, false, false, false, null,
  coalesce((select max(i.display_order) from public.gecko_menu_items i where i.category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français')), 0) + 1
where not exists (select 1 from public.gecko_menu_items i where i.category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and i.name = 'Aubert & Mathieu');

insert into public.gecko_menu_items (category_id, name, description, price, price_label, is_available, is_vegetarian, is_spicy, is_gluten_free, allergens, display_order)
select (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français'), 'Château Nénin', 'Pomerol AOC · Cabernet franc, Merlot', null, null, true, false, false, false, null,
  coalesce((select max(i.display_order) from public.gecko_menu_items i where i.category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français')), 0) + 1
where not exists (select 1 from public.gecko_menu_items i where i.category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rouges français') and i.name = 'Château Nénin');

delete from public.gecko_menu_items where category_id = (select c.id from public.gecko_menu_categories c join public.gecko_menu_pages p on p.id = c.menu_page_id where p.slug = 'vins-bieres-belges' and c.name = 'Vins rosés français') and name = 'Côtes de Provence AOC';

commit;
