-- ============================================================
-- Durrah — payments (Moyasar) support
-- Adds idempotent order-confirmation fields used by the payment
-- callback + webhook. See docs/plan.md §8. The orders table itself
-- (status/payment_provider/payment_ref) already exists.
-- ============================================================

-- When the payment is confirmed (paid) we stamp the time.
alter table public.orders
  add column if not exists paid_at timestamptz;

-- A single Moyasar payment maps to at most one order. The unique index
-- makes webhook + callback confirmation idempotent (both may fire): the
-- second writer is a no-op because payment_ref is already set on the row.
create unique index if not exists orders_payment_ref_key
  on public.orders (payment_ref)
  where payment_ref is not null;
