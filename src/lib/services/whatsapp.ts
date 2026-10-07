/**
 * WhatsApp Service - Placeholder for WhatsApp Business API integration
 *
 * To activate:
 * 1. Set up WhatsApp Business API through Meta Business Suite
 * 2. Set environment variables:
 *    - WHATSAPP_API_URL=https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages
 *    - WHATSAPP_API_TOKEN=your_bearer_token
 *    - WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
 *
 * Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

interface WhatsAppOptions {
  to: string;
  message: string;
  templateName?: string;
  templateParams?: string[];
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendWhatsApp(options: WhatsAppOptions): Promise<WhatsAppResponse> {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const apiToken = process.env.WHATSAPP_API_TOKEN;

  if (!apiUrl || !apiToken) {
    console.log(`[WhatsApp Service] API not configured. Would send message to ${options.to}: ${options.message}`);
    return {
      success: true,
      messageId: `wa_placeholder_${Date.now()}`,
    };
  }

  try {
    const body: Record<string, unknown> = {
      messaging_product: "whatsapp",
      to: options.to.replace("+", ""),
      type: "text",
      text: { body: options.message },
    };

    if (options.templateName) {
      body.type = "template";
      body.template = {
        name: options.templateName,
        language: { code: "en" },
        components: options.templateParams
          ? [{ type: "body", parameters: options.templateParams.map((p) => ({ type: "text", text: p })) }]
          : [],
      };
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.messages && data.messages.length > 0) {
      return { success: true, messageId: data.messages[0].id };
    }

    return { success: false, error: data.error?.message || "WhatsApp sending failed" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "WhatsApp service error",
    };
  }
}

export async function sendBulkWhatsApp(
  recipients: string[],
  message: string
): Promise<{ success: boolean; sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const result = await sendWhatsApp({ to: recipient, message });
    if (result.success) sent++;
    else failed++;
  }

  return { success: failed === 0, sent, failed };
}
