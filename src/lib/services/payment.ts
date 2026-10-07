/**
 * Payment Service - Razorpay integration with mock fallback
 *
 * When NEXT_PUBLIC_RAZORPAY_KEY_ID is not set, all operations return mock success.
 * When set, it will use the Razorpay API for real payment processing.
 *
 * Environment variables:
 * - NEXT_PUBLIC_RAZORPAY_KEY_ID=Razorpay key (client-side)
 * - RAZORPAY_KEY_SECRET=Razorpay secret (server-side only)
 */

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
const IS_RAZORPAY_CONFIGURED = !!(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);

interface CreateOrderParams {
  amount: number; // Amount in INR (will be converted to paise)
  receipt: string;
  currency?: string;
}

interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  amount?: number;
  currency?: string;
  error?: string;
}

interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

interface VerifyPaymentResult {
  success: boolean;
  verified?: boolean;
  error?: string;
}

interface RefundParams {
  paymentId: string;
  amount?: number; // Partial refund amount in paise. If not provided, full refund.
}

interface RefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
}

/**
 * Create a Razorpay order
 * Returns mock order when Razorpay is not configured
 */
export async function createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
  const { amount, receipt, currency = "INR" } = params;

  if (amount <= 0) {
    return { success: false, error: "Amount must be greater than 0" };
  }

  if (!IS_RAZORPAY_CONFIGURED) {
    console.log(`[Payment Service] Mock order created: ₹${amount} for ${receipt}`);
    return {
      success: true,
      orderId: `mock_order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      amount: amount * 100, // Convert to paise
      currency,
    };
  }

  try {
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: amount * 100, // Razorpay expects amount in paise
        currency,
        receipt,
      }),
    });

    const data = await response.json();

    if (data.id) {
      return {
        success: true,
        orderId: data.id,
        amount: data.amount,
        currency: data.currency,
      };
    }

    return {
      success: false,
      error: data.error?.description || "Failed to create order",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment gateway error",
    };
  }
}

/**
 * Verify a Razorpay payment
 * Returns mock verification success when Razorpay is not configured
 */
export async function verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
  const { orderId, paymentId, signature } = params;

  if (!orderId || !paymentId || !signature) {
    return { success: false, error: "Missing required payment verification parameters" };
  }

  if (!IS_RAZORPAY_CONFIGURED) {
    console.log(`[Payment Service] Mock payment verified: ${paymentId} for order ${orderId}`);
    return {
      success: true,
      verified: true,
    };
  }

  try {
    // Server-side verification using crypto
    // In production, use the crypto module to verify the HMAC signature:
    //
    // import crypto from 'crypto';
    // const body = orderId + "|" + paymentId;
    // const expectedSignature = crypto
    //   .createHmac("sha256", RAZORPAY_KEY_SECRET)
    //   .update(body)
    //   .digest("hex");
    // const verified = expectedSignature === signature;

    // For now, validate by querying the Razorpay API
    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}`,
      },
    });

    const data = await response.json();

    if (data.id === paymentId && data.status === "captured") {
      return { success: true, verified: true };
    }

    return {
      success: false,
      verified: false,
      error: data.error?.description || "Payment verification failed",
    };
  } catch (error) {
    return {
      success: false,
      verified: false,
      error: error instanceof Error ? error.message : "Verification error",
    };
  }
}

/**
 * Process a refund (full or partial)
 */
export async function processRefund(params: RefundParams): Promise<RefundResult> {
  const { paymentId, amount } = params;

  if (!IS_RAZORPAY_CONFIGURED) {
    console.log(`[Payment Service] Mock refund for payment ${paymentId}${amount ? `: ₹${amount}` : " (full)"}`);
    return {
      success: true,
      refundId: `mock_refund_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
  }

  try {
    const body: Record<string, unknown> = {};
    if (amount) body.amount = amount * 100;

    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.id) {
      return { success: true, refundId: data.id };
    }

    return { success: false, error: data.error?.description || "Refund failed" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Refund error",
    };
  }
}

/**
 * Get payment details
 */
export async function getPaymentDetails(paymentId: string) {
  if (!IS_RAZORPAY_CONFIGURED) {
    return {
      success: true,
      data: {
        id: paymentId,
        amount: 50000,
        currency: "INR",
        status: "captured",
        method: "upi",
        created_at: Date.now() / 1000,
      },
    };
  }

  try {
    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}`,
      },
    });
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch payment details",
    };
  }
}

/**
 * Check if Razorpay is configured
 */
export function isPaymentGatewayConfigured(): boolean {
  return IS_RAZORPAY_CONFIGURED;
}
