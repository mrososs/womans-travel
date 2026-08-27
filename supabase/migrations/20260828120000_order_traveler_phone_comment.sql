-- Checkout now also captures the traveler's mobile number onto the order
-- manifest (`traveler_info.phone`, normalized to E.164 `+9665XXXXXXXX`) so the
-- operations team can reach her from the admin dashboard without depending on
-- an optional `profiles.phone`, and so Tabby/Tamara always get a buyer phone.
--
-- Comment-only change: `traveler_info` is already jsonb, so no DDL is needed for
-- the new key and existing rows stay valid (the dashboard falls back to
-- `profiles.phone` for manifests written before this).
comment on column public.orders.traveler_info is
  'Traveler details captured at checkout: full four-part name, mobile number (E.164), passport number, passport issue/expiry dates, national ID/iqama for domestic-only carts, and accuracy + group-compliance declarations.';
