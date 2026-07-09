-- ============================================================
-- Durrah — Manual Bank Transfer payment method
-- Adds an explicit payment method + payment status to `orders` (alongside the
-- existing Moyasar flow), the bank-transfer reference the customer enters, and
-- the buyer's email (captured at checkout so the admin-approval email can be
-- sent without a service-role auth lookup). Admins get an UPDATE policy so they
-- can approve/cancel bank transfers.
-- ============================================================

-- 1) New columns -------------------------------------------------------------
alter table public.orders
  add column if not exists payment_method text
    check (payment_method in ('moyasar','bank_transfer'));

alter table public.orders
  add column if not exists payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','cancelled','failed'));

-- Bank-transfer reference / operation number entered by the customer.
alter table public.orders
  add column if not exists transfer_reference text;

-- Buyer email snapshot — lets the confirmation email be sent on approval
-- without needing the auth admin API / service role.
alter table public.orders
  add column if not exists customer_email text;

-- 2) Backfill existing rows --------------------------------------------------
-- Every pre-existing order was a Moyasar order.
update public.orders
  set payment_method = coalesce(payment_method, payment_provider, 'moyasar')
  where payment_method is null;

-- Derive payment_status from the legacy `status` column. `refunded` maps to
-- `cancelled` since payment_status has no refunded state.
update public.orders
  set payment_status = case
    when status = 'paid'      then 'paid'
    when status = 'failed'    then 'failed'
    when status in ('cancelled','refunded') then 'cancelled'
    else 'pending'
  end;

-- 3) Admin UPDATE policy -----------------------------------------------------
-- Admins may update any order (approve / cancel bank transfers). Owner-scoped
-- update policy from 20260703140000 still covers a shopper editing their own.
drop policy if exists orders_update_admin on public.orders;
create policy orders_update_admin on public.orders
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
