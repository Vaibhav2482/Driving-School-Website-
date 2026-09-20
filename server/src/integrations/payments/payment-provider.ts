import type { PaymentProvider as PaymentProviderName } from "../../generated/prisma/enums.js";

/**
 * CONTRACT ONLY — implemented in Phase 9 (payments).
 *
 * All payment-gateway logic lives behind this interface so the rest of the codebase never knows
 * which gateway is in use. Phase 9 ships a `ManualProvider` (staff record cash/UPI/bank transfers);
 * a `RazorpayProvider` can implement the same interface later. Secret keys are read from server
 * environment variables only and are never sent to the browser.
 */
export interface PaymentProvider {
  readonly name: PaymentProviderName;

  /** Create a provider-side order for online payment. Manual payments have no order. */
  createOrder?(input: CreateOrderInput): Promise<ProviderOrder>;

  /**
   * Verify a webhook using the RAW request body and the provider's signature header.
   * Must be constant-time and must not throw on malformed input; return false instead.
   */
  verifyWebhook?(rawBody: Buffer, signature: string): boolean;

  /** Refund a captured payment (amount in paise). */
  refund?(input: RefundInput): Promise<RefundResult>;
}

export interface CreateOrderInput {
  amountPaise: number;
  currency: "INR";
  /** Our own reference (e.g. the Payment id) for reconciliation. */
  receipt: string;
}

export interface ProviderOrder {
  providerOrderId: string;
}

export interface RefundInput {
  providerPaymentId: string;
  amountPaise: number;
}

export interface RefundResult {
  providerRefundId: string;
}
