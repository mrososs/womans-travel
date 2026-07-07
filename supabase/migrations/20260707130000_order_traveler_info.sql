-- Traveler details collected at checkout (four-part name, passport number +
-- issue/expiry dates, and the accuracy / group-compliance declarations) are
-- snapshotted onto the order so the operations team has the passenger manifest
-- for the booking. Nullable + additive so it is safe on existing rows.
alter table public.orders
  add column if not exists traveler_info jsonb;

comment on column public.orders.traveler_info is
  'Traveler details captured at checkout: full four-part name, passport number, passport issue/expiry dates, and accuracy + group-compliance declarations.';
