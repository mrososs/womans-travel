import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/database.types';
import { priceCart } from '../../../utils/checkout';
import {
  getTamaraApiToken,
  preCheckEligibility,
  tamaraBase,
} from '../../../utils/tamara';

/**
 * POST /api/payments/tamara/precheck
 *
 * Tamara requires a pre-checkout eligibility call before the order is created.
 * The checkout UI calls this when the shopper considers Tamara; if not eligible
 * the option is greyed-out. The amount is recomputed server-side (never trusted
 * from the client) so eligibility reflects the real basket total.
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const uid =
    (user as { id?: string; sub?: string } | null)?.id ??
    (user as { sub?: string } | null)?.sub;
  if (!uid) return { eligible: false, reason: 'unauthenticated' };

  const email = (user as { email?: string } | null)?.email ?? undefined;
  const client = await serverSupabaseClient<Database>(event);

  const { data: settings } = await client
    .from('payment_settings')
    .select('tamara_enabled, tamara_test_mode')
    .eq('id', 1)
    .maybeSingle();
  if (settings && settings.tamara_enabled === false) {
    return { eligible: false, reason: 'disabled' };
  }

  let total: number;
  try {
    ({ total } = await priceCart(client, uid));
  } catch {
    return { eligible: false, reason: 'empty_cart' };
  }

  const { data: profile } = await client
    .from('profiles')
    .select('phone')
    .eq('id', uid)
    .maybeSingle();

  const testMode = settings?.tamara_test_mode !== false;
  let token: string;
  try {
    token = await getTamaraApiToken(event);
  } catch {
    return { eligible: false, reason: 'not_configured' };
  }

  try {
    const result = await preCheckEligibility(tamaraBase(testMode), token, {
      country: 'SA',
      orderValue: total,
      currency: 'SAR',
      phone: profile?.phone || undefined,
      email,
    });
    return { eligible: result.eligible };
  } catch {
    // On a pre-check outage, fail open is risky (order may later be declined);
    // fail closed so the shopper isn't sent into a dead end.
    return { eligible: false, reason: 'precheck_failed' };
  }
});
