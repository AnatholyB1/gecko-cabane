-- 007_gecko_baseline.sql
-- Baseline of the REAL production gecko_* schema (read-only schema dump of 2026-10-16,
-- hand-cleaned: no owner/grant noise). Replaces the legacy unprefixed migrations 001-006,
-- archived in supabase/legacy/ (never apply those).
--
-- Idempotent: safe to re-run. On production it is NOT executed; it is marked as applied
-- with "supabase migration repair --status applied 007" (plan 01-09). On a blank/scratch
-- database it recreates the schema from scratch.
--
-- Known as-is facts (transcribed verbatim, to be tightened by later migrations):
--   * gecko_table_assignments has a public SELECT policy (no customer PII, but it exposes
--     reservation ids and block windows).
--   * gecko_reservations has NO public policy: only gecko_is_admin() can read/write it
--     through the anon/authenticated API; server routes use the service role.
--   * gecko_phone_verifications has RLS enabled and no policy (service role only); it is
--     dropped later by migration 010.

set check_function_bodies = false;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.gecko_admins (
  id uuid not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.gecko_announcement (
  id integer not null,
  title varchar(200),
  content text not null,
  is_active boolean default true,
  bg_color varchar(50) default 'amber',
  start_date date,
  end_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.gecko_menu_pages (
  id integer not null,
  name varchar(100) not null,
  slug varchar(100) not null,
  description text,
  is_active boolean default true,
  display_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.gecko_menu_categories (
  id integer not null,
  menu_page_id integer not null,
  name varchar(100) not null,
  description text,
  display_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.gecko_menu_items (
  id integer not null,
  category_id integer not null,
  name varchar(200) not null,
  description text,
  price numeric(10,2),
  price_label varchar(50),
  image_url text,
  is_available boolean default true,
  is_vegetarian boolean default false,
  is_spicy boolean default false,
  allergens text,
  display_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.gecko_opening_hours (
  id integer not null,
  day_of_week integer not null,
  day_name varchar(20) not null,
  is_open boolean default true,
  open_time time,
  close_time time,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint gecko_opening_hours_day_of_week_check check (day_of_week >= 0 and day_of_week <= 6)
);

create table if not exists public.gecko_phone_verifications (
  id integer not null,
  phone varchar(30) not null,
  verified_token text not null,
  token_expires_at timestamptz not null,
  created_at timestamptz default now()
);

create table if not exists public.gecko_reservations (
  id integer not null,
  customer_name varchar(100) not null,
  customer_email varchar(255),
  customer_phone varchar(30) not null,
  reservation_date date not null,
  reservation_time time not null,
  party_size integer not null,
  occasion varchar(100),
  status varchar(20) default 'pending',
  admin_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  constraint gecko_reservations_party_size_check check (party_size > 0 and party_size <= 50),
  constraint gecko_reservations_status_check check (status::text = any (array['pending', 'confirmed', 'cancelled', 'completed', 'no_show']::text[]))
);

create table if not exists public.gecko_restaurant_settings (
  key text not null,
  value text not null,
  description text,
  updated_at timestamptz default now()
);

create table if not exists public.gecko_special_hours (
  id integer not null,
  date date not null,
  title varchar(100),
  is_open boolean default true,
  open_time time,
  close_time time,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.gecko_tables (
  id integer not null,
  name varchar(50) not null,
  seats integer not null default 2,
  position_x double precision not null default 50,
  position_y double precision not null default 50,
  width double precision not null default 9,
  height double precision not null default 11,
  shape varchar(20) not null default 'square',
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint gecko_tables_position_x_check check (position_x >= 0 and position_x <= 100),
  constraint gecko_tables_position_y_check check (position_y >= 0 and position_y <= 100),
  constraint gecko_tables_seats_check check (seats > 0 and seats <= 30),
  constraint gecko_tables_shape_check check (shape::text = any (array['square', 'round', 'rectangle']::text[]))
);

create table if not exists public.gecko_table_configurations (
  id integer not null,
  name varchar(100) not null,
  min_capacity integer not null default 1,
  max_capacity integer not null default 2,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint gecko_table_configurations_max_capacity_check check (max_capacity > 0),
  constraint gecko_table_configurations_min_capacity_check check (min_capacity > 0),
  constraint gecko_valid_capacity check (max_capacity >= min_capacity)
);

create table if not exists public.gecko_table_configuration_tables (
  table_configuration_id integer not null,
  table_id integer not null
);

create table if not exists public.gecko_table_assignments (
  id integer not null,
  reservation_id integer not null,
  table_configuration_id integer not null,
  blocked_until timestamptz not null,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Sequences (serial-style integer ids)
-- ---------------------------------------------------------------------------

create sequence if not exists public.gecko_announcement_id_seq as integer start with 1 increment by 1 no minvalue no maxvalue cache 1;
alter sequence public.gecko_announcement_id_seq owned by public.gecko_announcement.id;
alter table only public.gecko_announcement alter column id set default nextval('public.gecko_announcement_id_seq'::regclass);

create sequence if not exists public.gecko_menu_categories_id_seq as integer start with 1 increment by 1 no minvalue no maxvalue cache 1;
alter sequence public.gecko_menu_categories_id_seq owned by public.gecko_menu_categories.id;
alter table only public.gecko_menu_categories alter column id set default nextval('public.gecko_menu_categories_id_seq'::regclass);

create sequence if not exists public.gecko_menu_items_id_seq as integer start with 1 increment by 1 no minvalue no maxvalue cache 1;
alter sequence public.gecko_menu_items_id_seq owned by public.gecko_menu_items.id;
alter table only public.gecko_menu_items alter column id set default nextval('public.gecko_menu_items_id_seq'::regclass);

create sequence if not exists public.gecko_menu_pages_id_seq as integer start with 1 increment by 1 no minvalue no maxvalue cache 1;
alter sequence public.gecko_menu_pages_id_seq owned by public.gecko_menu_pages.id;
alter table only public.gecko_menu_pages alter column id set default nextval('public.gecko_menu_pages_id_seq'::regclass);

create sequence if not exists public.gecko_opening_hours_id_seq as integer start with 1 increment by 1 no minvalue no maxvalue cache 1;
alter sequence public.gecko_opening_hours_id_seq owned by public.gecko_opening_hours.id;
alter table only public.gecko_opening_hours alter column id set default nextval('public.gecko_opening_hours_id_seq'::regclass);

create sequence if not exists public.gecko_phone_verifications_id_seq as integer start with 1 increment by 1 no minvalue no maxvalue cache 1;
alter sequence public.gecko_phone_verifications_id_seq owned by public.gecko_phone_verifications.id;
alter table only public.gecko_phone_verifications alter column id set default nextval('public.gecko_phone_verifications_id_seq'::regclass);

create sequence if not exists public.gecko_reservations_id_seq as integer start with 1 increment by 1 no minvalue no maxvalue cache 1;
alter sequence public.gecko_reservations_id_seq owned by public.gecko_reservations.id;
alter table only public.gecko_reservations alter column id set default nextval('public.gecko_reservations_id_seq'::regclass);

create sequence if not exists public.gecko_special_hours_id_seq as integer start with 1 increment by 1 no minvalue no maxvalue cache 1;
alter sequence public.gecko_special_hours_id_seq owned by public.gecko_special_hours.id;
alter table only public.gecko_special_hours alter column id set default nextval('public.gecko_special_hours_id_seq'::regclass);

create sequence if not exists public.gecko_table_assignments_id_seq as integer start with 1 increment by 1 no minvalue no maxvalue cache 1;
alter sequence public.gecko_table_assignments_id_seq owned by public.gecko_table_assignments.id;
alter table only public.gecko_table_assignments alter column id set default nextval('public.gecko_table_assignments_id_seq'::regclass);

create sequence if not exists public.gecko_table_configurations_id_seq as integer start with 1 increment by 1 no minvalue no maxvalue cache 1;
alter sequence public.gecko_table_configurations_id_seq owned by public.gecko_table_configurations.id;
alter table only public.gecko_table_configurations alter column id set default nextval('public.gecko_table_configurations_id_seq'::regclass);

create sequence if not exists public.gecko_tables_id_seq as integer start with 1 increment by 1 no minvalue no maxvalue cache 1;
alter sequence public.gecko_tables_id_seq owned by public.gecko_tables.id;
alter table only public.gecko_tables alter column id set default nextval('public.gecko_tables_id_seq'::regclass);

-- ---------------------------------------------------------------------------
-- Primary keys, unique constraints, foreign keys (guarded for idempotency)
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'gecko_admins_pkey' and conrelid = 'public.gecko_admins'::regclass) then
    alter table only public.gecko_admins add constraint gecko_admins_pkey primary key (id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gecko_announcement_pkey' and conrelid = 'public.gecko_announcement'::regclass) then
    alter table only public.gecko_announcement add constraint gecko_announcement_pkey primary key (id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gecko_menu_categories_pkey' and conrelid = 'public.gecko_menu_categories'::regclass) then
    alter table only public.gecko_menu_categories add constraint gecko_menu_categories_pkey primary key (id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gecko_menu_items_pkey' and conrelid = 'public.gecko_menu_items'::regclass) then
    alter table only public.gecko_menu_items add constraint gecko_menu_items_pkey primary key (id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gecko_menu_pages_pkey' and conrelid = 'public.gecko_menu_pages'::regclass) then
    alter table only public.gecko_menu_pages add constraint gecko_menu_pages_pkey primary key (id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gecko_menu_pages_slug_key' and conrelid = 'public.gecko_menu_pages'::regclass) then
    alter table only public.gecko_menu_pages add constraint gecko_menu_pages_slug_key unique (slug);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gecko_opening_hours_pkey' and conrelid = 'public.gecko_opening_hours'::regclass) then
    alter table only public.gecko_opening_hours add constraint gecko_opening_hours_pkey primary key (id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gecko_phone_verifications_pkey' and conrelid = 'public.gecko_phone_verifications'::regclass) then
    alter table only public.gecko_phone_verifications add constraint gecko_phone_verifications_pkey primary key (id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gecko_phone_verifications_verified_token_key' and conrelid = 'public.gecko_phone_verifications'::regclass) then
    alter table only public.gecko_phone_verifications add constraint gecko_phone_verifications_verified_token_key unique (verified_token);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gecko_reservations_pkey' and conrelid = 'public.gecko_reservations'::regclass) then
    alter table only public.gecko_reservations add constraint gecko_reservations_pkey primary key (id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gecko_restaurant_settings_pkey' and conrelid = 'public.gecko_restaurant_settings'::regclass) then
    alter table only public.gecko_restaurant_settings add constraint gecko_restaurant_settings_pkey primary key (key);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gecko_special_hours_date_key' and conrelid = 'public.gecko_special_hours'::regclass) then
    alter table only public.gecko_special_hours add constraint gecko_special_hours_date_key unique (date);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gecko_special_hours_pkey' and conrelid = 'public.gecko_special_hours'::regclass) then
    alter table only public.gecko_special_hours add constraint gecko_special_hours_pkey primary key (id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gecko_table_assignments_pkey' and conrelid = 'public.gecko_table_assignments'::regclass) then
    alter table only public.gecko_table_assignments add constraint gecko_table_assignments_pkey primary key (id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gecko_table_assignments_reservation_id_key' and conrelid = 'public.gecko_table_assignments'::regclass) then
    alter table only public.gecko_table_assignments add constraint gecko_table_assignments_reservation_id_key unique (reservation_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gecko_table_configuration_tables_pkey' and conrelid = 'public.gecko_table_configuration_tables'::regclass) then
    alter table only public.gecko_table_configuration_tables add constraint gecko_table_configuration_tables_pkey primary key (table_configuration_id, table_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gecko_table_configurations_pkey' and conrelid = 'public.gecko_table_configurations'::regclass) then
    alter table only public.gecko_table_configurations add constraint gecko_table_configurations_pkey primary key (id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gecko_tables_pkey' and conrelid = 'public.gecko_tables'::regclass) then
    alter table only public.gecko_tables add constraint gecko_tables_pkey primary key (id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'gecko_admins_id_fkey' and conrelid = 'public.gecko_admins'::regclass) then
    alter table only public.gecko_admins add constraint gecko_admins_id_fkey foreign key (id) references auth.users(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gecko_menu_categories_menu_page_id_fkey' and conrelid = 'public.gecko_menu_categories'::regclass) then
    alter table only public.gecko_menu_categories add constraint gecko_menu_categories_menu_page_id_fkey foreign key (menu_page_id) references public.gecko_menu_pages(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gecko_menu_items_category_id_fkey' and conrelid = 'public.gecko_menu_items'::regclass) then
    alter table only public.gecko_menu_items add constraint gecko_menu_items_category_id_fkey foreign key (category_id) references public.gecko_menu_categories(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gecko_table_assignments_reservation_id_fkey' and conrelid = 'public.gecko_table_assignments'::regclass) then
    alter table only public.gecko_table_assignments add constraint gecko_table_assignments_reservation_id_fkey foreign key (reservation_id) references public.gecko_reservations(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gecko_table_assignments_table_configuration_id_fkey' and conrelid = 'public.gecko_table_assignments'::regclass) then
    alter table only public.gecko_table_assignments add constraint gecko_table_assignments_table_configuration_id_fkey foreign key (table_configuration_id) references public.gecko_table_configurations(id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gecko_table_configuration_tables_table_configuration_id_fkey' and conrelid = 'public.gecko_table_configuration_tables'::regclass) then
    alter table only public.gecko_table_configuration_tables add constraint gecko_table_configuration_tables_table_configuration_id_fkey foreign key (table_configuration_id) references public.gecko_table_configurations(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gecko_table_configuration_tables_table_id_fkey' and conrelid = 'public.gecko_table_configuration_tables'::regclass) then
    alter table only public.gecko_table_configuration_tables add constraint gecko_table_configuration_tables_table_id_fkey foreign key (table_id) references public.gecko_tables(id) on delete cascade;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists idx_gecko_menu_categories_order on public.gecko_menu_categories using btree (display_order);
create index if not exists idx_gecko_menu_categories_page on public.gecko_menu_categories using btree (menu_page_id);
create index if not exists idx_gecko_menu_items_category on public.gecko_menu_items using btree (category_id);
create index if not exists idx_gecko_menu_items_order on public.gecko_menu_items using btree (display_order);
create index if not exists idx_gecko_menu_pages_order on public.gecko_menu_pages using btree (display_order);
create index if not exists idx_gecko_pv_expires on public.gecko_phone_verifications using btree (token_expires_at);
create index if not exists idx_gecko_pv_token on public.gecko_phone_verifications using btree (verified_token);
create index if not exists idx_gecko_reservations_created on public.gecko_reservations using btree (created_at desc);
create index if not exists idx_gecko_reservations_date on public.gecko_reservations using btree (reservation_date);
create index if not exists idx_gecko_reservations_phone on public.gecko_reservations using btree (customer_phone);
create index if not exists idx_gecko_reservations_status on public.gecko_reservations using btree (status);
create index if not exists idx_gecko_table_assignments_blocked on public.gecko_table_assignments using btree (blocked_until);
create index if not exists idx_gecko_table_assignments_config on public.gecko_table_assignments using btree (table_configuration_id);
create index if not exists idx_gecko_table_config_tables_table on public.gecko_table_configuration_tables using btree (table_id);
create index if not exists idx_gecko_tables_active on public.gecko_tables using btree (is_active);

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------

create or replace function public.gecko_is_admin()
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select exists (select 1 from public.gecko_admins where id = auth.uid());
$function$;

create or replace function public.gecko_update_reservation_timestamp()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

create or replace function public.gecko_update_updated_at_column()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

drop trigger if exists gecko_reservations_updated_at on public.gecko_reservations;
create trigger gecko_reservations_updated_at before update on public.gecko_reservations
  for each row execute function public.gecko_update_reservation_timestamp();

drop trigger if exists gecko_restaurant_settings_updated_at on public.gecko_restaurant_settings;
create trigger gecko_restaurant_settings_updated_at before update on public.gecko_restaurant_settings
  for each row execute function public.gecko_update_updated_at_column();

drop trigger if exists gecko_table_configurations_updated_at on public.gecko_table_configurations;
create trigger gecko_table_configurations_updated_at before update on public.gecko_table_configurations
  for each row execute function public.gecko_update_updated_at_column();

drop trigger if exists gecko_tables_updated_at on public.gecko_tables;
create trigger gecko_tables_updated_at before update on public.gecko_tables
  for each row execute function public.gecko_update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.gecko_admins enable row level security;
alter table public.gecko_announcement enable row level security;
alter table public.gecko_menu_categories enable row level security;
alter table public.gecko_menu_items enable row level security;
alter table public.gecko_menu_pages enable row level security;
alter table public.gecko_opening_hours enable row level security;
alter table public.gecko_phone_verifications enable row level security;
alter table public.gecko_reservations enable row level security;
alter table public.gecko_restaurant_settings enable row level security;
alter table public.gecko_special_hours enable row level security;
alter table public.gecko_table_assignments enable row level security;
alter table public.gecko_table_configuration_tables enable row level security;
alter table public.gecko_table_configurations enable row level security;
alter table public.gecko_tables enable row level security;

-- ---------------------------------------------------------------------------
-- Policies (verbatim from pg_policies)
-- gecko_reservations and gecko_phone_verifications: no public policy, by design.
-- ---------------------------------------------------------------------------

drop policy if exists "gecko_admins self read" on public.gecko_admins;
create policy "gecko_admins self read" on public.gecko_admins for select using ((auth.uid() = id));

drop policy if exists "Public read gecko_announcement" on public.gecko_announcement;
create policy "Public read gecko_announcement" on public.gecko_announcement for select using (true);
drop policy if exists "Admin manage gecko_announcement" on public.gecko_announcement;
create policy "Admin manage gecko_announcement" on public.gecko_announcement using (public.gecko_is_admin());

drop policy if exists "Public read gecko_menu_categories" on public.gecko_menu_categories;
create policy "Public read gecko_menu_categories" on public.gecko_menu_categories for select using (true);
drop policy if exists "Admin manage gecko_menu_categories" on public.gecko_menu_categories;
create policy "Admin manage gecko_menu_categories" on public.gecko_menu_categories using (public.gecko_is_admin());

drop policy if exists "Public read gecko_menu_items" on public.gecko_menu_items;
create policy "Public read gecko_menu_items" on public.gecko_menu_items for select using (true);
drop policy if exists "Admin manage gecko_menu_items" on public.gecko_menu_items;
create policy "Admin manage gecko_menu_items" on public.gecko_menu_items using (public.gecko_is_admin());

drop policy if exists "Public read gecko_menu_pages" on public.gecko_menu_pages;
create policy "Public read gecko_menu_pages" on public.gecko_menu_pages for select using (true);
drop policy if exists "Admin manage gecko_menu_pages" on public.gecko_menu_pages;
create policy "Admin manage gecko_menu_pages" on public.gecko_menu_pages using (public.gecko_is_admin());

drop policy if exists "Public read gecko_opening_hours" on public.gecko_opening_hours;
create policy "Public read gecko_opening_hours" on public.gecko_opening_hours for select using (true);
drop policy if exists "Admin manage gecko_opening_hours" on public.gecko_opening_hours;
create policy "Admin manage gecko_opening_hours" on public.gecko_opening_hours using (public.gecko_is_admin());

drop policy if exists "Admin manage gecko_reservations" on public.gecko_reservations;
create policy "Admin manage gecko_reservations" on public.gecko_reservations using (public.gecko_is_admin());

drop policy if exists "Public read gecko_restaurant_settings" on public.gecko_restaurant_settings;
create policy "Public read gecko_restaurant_settings" on public.gecko_restaurant_settings for select using (true);
drop policy if exists "Admin manage gecko_restaurant_settings" on public.gecko_restaurant_settings;
create policy "Admin manage gecko_restaurant_settings" on public.gecko_restaurant_settings using (public.gecko_is_admin());

drop policy if exists "Public read gecko_special_hours" on public.gecko_special_hours;
create policy "Public read gecko_special_hours" on public.gecko_special_hours for select using (true);
drop policy if exists "Admin manage gecko_special_hours" on public.gecko_special_hours;
create policy "Admin manage gecko_special_hours" on public.gecko_special_hours using (public.gecko_is_admin());

drop policy if exists "Public read gecko_table_assignments" on public.gecko_table_assignments;
create policy "Public read gecko_table_assignments" on public.gecko_table_assignments for select using (true);
drop policy if exists "Admin manage gecko_table_assignments" on public.gecko_table_assignments;
create policy "Admin manage gecko_table_assignments" on public.gecko_table_assignments using (public.gecko_is_admin());

drop policy if exists "Public read gecko_table_configuration_tables" on public.gecko_table_configuration_tables;
create policy "Public read gecko_table_configuration_tables" on public.gecko_table_configuration_tables for select using (true);
drop policy if exists "Admin manage gecko_table_configuration_tables" on public.gecko_table_configuration_tables;
create policy "Admin manage gecko_table_configuration_tables" on public.gecko_table_configuration_tables using (public.gecko_is_admin());

drop policy if exists "Public read gecko_table_configurations" on public.gecko_table_configurations;
create policy "Public read gecko_table_configurations" on public.gecko_table_configurations for select using (true);
drop policy if exists "Admin manage gecko_table_configurations" on public.gecko_table_configurations;
create policy "Admin manage gecko_table_configurations" on public.gecko_table_configurations using (public.gecko_is_admin());

drop policy if exists "Public read gecko_tables" on public.gecko_tables;
create policy "Public read gecko_tables" on public.gecko_tables for select using (true);
drop policy if exists "Admin manage gecko_tables" on public.gecko_tables;
create policy "Admin manage gecko_tables" on public.gecko_tables using (public.gecko_is_admin());

-- ---------------------------------------------------------------------------
-- Storage: public bucket for menu images + policies
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('gecko-menu-images', 'gecko-menu-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can view gecko menu images" on storage.objects;
create policy "Public can view gecko menu images" on storage.objects
  for select using (bucket_id = 'gecko-menu-images'::text);

drop policy if exists "Admins can upload gecko menu images" on storage.objects;
create policy "Admins can upload gecko menu images" on storage.objects
  for insert with check ((bucket_id = 'gecko-menu-images'::text) and public.gecko_is_admin());

drop policy if exists "Admins can delete gecko menu images" on storage.objects;
create policy "Admins can delete gecko menu images" on storage.objects
  for delete using ((bucket_id = 'gecko-menu-images'::text) and public.gecko_is_admin());
