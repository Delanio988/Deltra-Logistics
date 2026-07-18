import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { verifyFygaroSignature, WALLET_TOPUP_REFERENCE_PREFIX } from "@/lib/payments/fygaro";

type FygaroWebhookPayload = {
  transactionId?: string;
  reference?: string;
  customReference?: string;
  amount?: number | string;
  currency?: string;
};

/**
 * Fygaro Hook receiver — verifies the HMAC signature before touching the
 * database (see lib/payments/fygaro.ts), then credits either a bill or a
 * wallet top-up via a service-role-only RPC that's idempotent on
 * provider_reference, since Fygaro can and will retry delivery.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.FYGARO_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("fygaro-signature");
  if (!verifyFygaroSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: FygaroWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as FygaroWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ourReference = payload.customReference;
  const providerReference = payload.transactionId ?? payload.reference;
  const amount = Number(payload.amount);

  if (!ourReference || !providerReference || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Missing or invalid payment fields" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  if (ourReference.startsWith(WALLET_TOPUP_REFERENCE_PREFIX)) {
    const customerId = ourReference.slice(WALLET_TOPUP_REFERENCE_PREFIX.length);
    const { error } = await supabase.rpc("confirm_hosted_wallet_topup", {
      p_customer_id: customerId,
      p_amount: amount,
      p_provider_reference: providerReference,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.rpc("confirm_hosted_bill_payment", {
      p_bill_id: ourReference,
      p_amount: amount,
      p_provider_reference: providerReference,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
