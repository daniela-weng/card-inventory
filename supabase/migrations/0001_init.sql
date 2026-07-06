-- ============================================================
-- Phase 0: initial schema
-- Enums, tables, indexes, triggers.
-- RLS policies live in 0002_rls.sql.
-- ============================================================

create extension if not exists "pgcrypto";

-- ─── Enums ────────────────────────────────────────────────────

create type order_status as enum (
  'Order Placed', 'Confirmed', 'Processing', 'Shipped', 'In Transit',
  'Delayed', 'Partially Shipped', 'Backordered', 'Cancelled', 'Refunded',
  'Delivered to US Forwarder', 'Forwarder Received', 'Shipping to Taiwan',
  'Arrived Taiwan', 'Delivered to Buyer', 'Needs Review'
);

create type risk_status as enum ('Low', 'Medium', 'High', 'Critical');

create type email_type as enum (
  'Order Confirmation', 'Shipping Confirmation', 'Delivery Date Update',
  'Delay Notice', 'Partial Shipment', 'Backorder Notice', 'Cancellation',
  'Refund', 'Payment Issue', 'Delivered Notice', 'Return / Replacement',
  'General Vendor Message', 'Unknown'
);

create type item_status as enum (
  'Ordered', 'Shipped', 'Partially Shipped', 'Cancelled', 'Refunded',
  'Received at Forwarder', 'Delivered to Buyer', 'Backordered'
);

create type inventory_status as enum (
  'In Transit', 'At US Forwarder', 'Shipping to Taiwan', 'Available',
  'Reserved', 'Sold', 'Lost', 'Damaged'
);

create type shipment_status as enum (
  'Label Created', 'In Transit', 'Out for Delivery', 'Delivered',
  'Exception', 'Returned', 'Lost'
);

create type forwarder_status as enum (
  'Awaiting Arrival', 'Received', 'Consolidating', 'Shipped to Taiwan',
  'Arrived Taiwan', 'Delivered', 'Held', 'Lost'
);

create type taiwan_delivery_status as enum (
  'Awaiting Ship', 'In Transit', 'Out for Delivery', 'Delivered', 'Exception'
);

create type severity as enum ('Info', 'Low', 'Medium', 'High', 'Critical');

-- ─── Helpers ──────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Generic display_id generator: PREFIX-YYYYMMDD-#### (zero-padded 4-digit random).
create or replace function gen_display_id(prefix text)
returns text language plpgsql as $$
begin
  return prefix
    || '-' || to_char(now() at time zone 'UTC', 'YYYYMMDD')
    || '-' || lpad(floor(random() * 10000)::int::text, 4, '0');
end $$;

create or replace function set_display_id_retailer_orders()
returns trigger language plpgsql as $$
begin
  if new.display_id is null then new.display_id := gen_display_id('ORD'); end if;
  return new;
end $$;

create or replace function set_display_id_order_items()
returns trigger language plpgsql as $$
begin
  if new.display_id is null then new.display_id := gen_display_id('ITM'); end if;
  return new;
end $$;

create or replace function set_display_id_us_shipments()
returns trigger language plpgsql as $$
begin
  if new.display_id is null then new.display_id := gen_display_id('SHP'); end if;
  return new;
end $$;

create or replace function set_display_id_vendor_email_updates()
returns trigger language plpgsql as $$
begin
  if new.display_id is null then new.display_id := gen_display_id('VUP'); end if;
  return new;
end $$;

create or replace function set_display_id_forwarder_shipments()
returns trigger language plpgsql as $$
begin
  if new.display_id is null then new.display_id := gen_display_id('FWD'); end if;
  return new;
end $$;

create or replace function set_display_id_inventory_lots()
returns trigger language plpgsql as $$
begin
  if new.display_id is null then new.display_id := gen_display_id('LOT'); end if;
  return new;
end $$;

create or replace function set_display_id_exceptions()
returns trigger language plpgsql as $$
begin
  if new.display_id is null then new.display_id := gen_display_id('EXC'); end if;
  return new;
end $$;

-- ─── Tables ───────────────────────────────────────────────────

create table retailer_orders (
  id uuid primary key default gen_random_uuid(),
  display_id text unique,
  retailer text not null,
  purchase_date date,
  retailer_order_number text,
  original_expected_delivery_date date,
  current_expected_delivery_date date,
  total_price_usd numeric(12,2),
  sales_tax_usd numeric(12,2),
  domestic_shipping_usd numeric(12,2),
  payment_method text,
  order_status order_status not null default 'Order Placed',
  risk_status risk_status not null default 'Low',
  delay_count int not null default 0,
  latest_vendor_update text,
  last_vendor_email_date timestamptz,
  needs_review boolean not null default false,
  notes text,
  source_email_id text,
  source_email_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on retailer_orders (retailer_order_number);
create index on retailer_orders (order_status);
create index on retailer_orders (risk_status);
create index on retailer_orders (needs_review);

create trigger trg_retailer_orders_updated
  before update on retailer_orders
  for each row execute function set_updated_at();
create trigger trg_retailer_orders_display_id
  before insert on retailer_orders
  for each row execute function set_display_id_retailer_orders();


create table order_items (
  id uuid primary key default gen_random_uuid(),
  retailer_order_id uuid not null references retailer_orders(id) on delete cascade,
  display_id text unique,
  product_name text not null,
  product_category text not null default 'Sports Cards',
  sku text,
  quantity_ordered int not null default 1,
  quantity_cancelled int not null default 0,
  quantity_received int not null default 0,
  unit_price_usd numeric(12,2),
  total_item_price_usd numeric(12,2),
  estimated_value_twd numeric(12,2),
  item_status item_status not null default 'Ordered',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on order_items (retailer_order_id);
create index on order_items (item_status);

create trigger trg_order_items_updated
  before update on order_items
  for each row execute function set_updated_at();
create trigger trg_order_items_display_id
  before insert on order_items
  for each row execute function set_display_id_order_items();


create table us_shipments (
  id uuid primary key default gen_random_uuid(),
  retailer_order_id uuid not null references retailer_orders(id) on delete cascade,
  display_id text unique,
  carrier text,
  us_tracking_number text,
  shipment_status shipment_status not null default 'Label Created',
  shipped_date date,
  expected_delivery_date date,
  actual_delivery_date date,
  delivered_to_forwarder boolean not null default false,
  tracking_source text,
  easypost_tracker_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index us_shipments_user_tracking_uq
  on us_shipments (us_tracking_number)
  where us_tracking_number is not null;
create index on us_shipments (retailer_order_id);
create index on us_shipments (shipment_status);

create trigger trg_us_shipments_updated
  before update on us_shipments
  for each row execute function set_updated_at();
create trigger trg_us_shipments_display_id
  before insert on us_shipments
  for each row execute function set_display_id_us_shipments();


create table vendor_email_updates (
  id uuid primary key default gen_random_uuid(),
  retailer_order_id uuid references retailer_orders(id) on delete set null,
  display_id text unique,
  retailer text,
  retailer_order_number text,
  email_subject text,
  email_date timestamptz,
  email_type email_type not null default 'Unknown',
  update_type text,
  old_expected_delivery_date date,
  new_expected_delivery_date date,
  us_tracking_number text,
  affected_items text[],
  severity severity not null default 'Info',
  action_needed text,
  confidence_score numeric(3,2),
  raw_email_summary text,
  source_email_id text,
  source_email_link text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on vendor_email_updates (retailer_order_id);
create index on vendor_email_updates (email_type);
create index on vendor_email_updates (severity);

create trigger trg_vendor_email_updates_updated
  before update on vendor_email_updates
  for each row execute function set_updated_at();
create trigger trg_vendor_email_updates_display_id
  before insert on vendor_email_updates
  for each row execute function set_display_id_vendor_email_updates();


create table forwarder_shipments (
  id uuid primary key default gen_random_uuid(),
  display_id text unique,
  us_tracking_number text,
  matched_retailer_order_id uuid references retailer_orders(id) on delete set null,
  warehouse_received_date date,
  forwarder_status forwarder_status not null default 'Awaiting Arrival',
  package_weight numeric(8,3),
  shipping_cost_usd numeric(12,2),
  taiwan_tracking_number text,
  taiwan_carrier text,
  taiwan_ship_date date,
  taiwan_delivery_status taiwan_delivery_status,
  taiwan_delivery_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index forwarder_shipments_user_tracking_uq
  on forwarder_shipments (us_tracking_number)
  where us_tracking_number is not null;
create index on forwarder_shipments (matched_retailer_order_id);
create index on forwarder_shipments (forwarder_status);

create trigger trg_forwarder_shipments_updated
  before update on forwarder_shipments
  for each row execute function set_updated_at();
create trigger trg_forwarder_shipments_display_id
  before insert on forwarder_shipments
  for each row execute function set_display_id_forwarder_shipments();


create table inventory_lots (
  id uuid primary key default gen_random_uuid(),
  retailer_order_id uuid references retailer_orders(id) on delete set null,
  order_item_id uuid references order_items(id) on delete set null,
  display_id text unique,
  product_name text not null,
  quantity_available int not null default 0,
  quantity_reserved int not null default 0,
  quantity_sold int not null default 0,
  landed_cost_usd numeric(12,2),
  unit_landed_cost_usd numeric(12,4),
  landed_cost_twd numeric(12,2),
  unit_landed_cost_twd numeric(12,4),
  inventory_status inventory_status not null default 'In Transit',
  location text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on inventory_lots (retailer_order_id);
create index on inventory_lots (order_item_id);
create index on inventory_lots (inventory_status);

create trigger trg_inventory_lots_updated
  before update on inventory_lots
  for each row execute function set_updated_at();
create trigger trg_inventory_lots_display_id
  before insert on inventory_lots
  for each row execute function set_display_id_inventory_lots();


create table exchange_rates (
  id uuid primary key default gen_random_uuid(),
  rate_date date not null,
  usd_to_twd_rate numeric(8,4) not null,
  source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index exchange_rates_user_date_uq
  on exchange_rates (rate_date);

create trigger trg_exchange_rates_updated
  before update on exchange_rates
  for each row execute function set_updated_at();


create table agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',  -- running | succeeded | failed
  items_processed int not null default 0,
  error_message text,
  log jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index on agent_runs (agent_name);
create index on agent_runs (status);


create table exceptions (
  id uuid primary key default gen_random_uuid(),
  display_id text unique,
  exception_type text not null,
  severity severity not null default 'Medium',
  retailer_order_id uuid references retailer_orders(id) on delete set null,
  forwarder_shipment_id uuid references forwarder_shipments(id) on delete set null,
  description text,
  resolved_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on exceptions (severity);
create index on exceptions (resolved_at);

create trigger trg_exceptions_updated
  before update on exceptions
  for each row execute function set_updated_at();
create trigger trg_exceptions_display_id
  before insert on exceptions
  for each row execute function set_display_id_exceptions();


create table user_settings (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_user_settings_updated
  before update on user_settings
  for each row execute function set_updated_at();
