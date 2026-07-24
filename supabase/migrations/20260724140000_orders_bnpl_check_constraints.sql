-- ============================================================
-- Durrah — allow Tabby + Tamara on orders check constraints
-- The original orders_payment_method_check / orders_payment_status_check were
-- written for the moyasar + bank_transfer flows and reject the new BNPL
-- providers, so Tabby/Tamara order creation failed with:
--   new row ... violates check constraint "orders_payment_method_check"
--
-- Widen payment_method to the four supported providers, and payment_status to a
-- superset that also covers the raw provider statuses our callback/webhook may
-- record on non-paid outcomes (Tabby: created/authorized/closed/expired/rejected;
-- Tamara: new/approved/authorised/captured/declined/expired/canceled/refunded).
-- ============================================================

alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check
  check (payment_method is null or payment_method = any (array[
    'moyasar', 'bank_transfer', 'tabby', 'tamara'
  ]));

alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check
  check (payment_status = any (array[
    'pending', 'paid', 'cancelled', 'canceled', 'failed', 'rejected',
    'expired', 'declined', 'authorised', 'authorized', 'captured',
    'fully_captured', 'partially_captured', 'closed', 'new', 'created',
    'approved', 'refunded', 'not_available'
  ]));
