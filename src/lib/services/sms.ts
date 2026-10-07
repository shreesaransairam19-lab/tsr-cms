/**
 * SMS Service - Placeholder for MSG91 integration
 *
 * To activate:
 * 1. Sign up at https://msg91.com
 * 2. Get your API key from the MSG91 dashboard
 * 3. Create a template and get the template ID
 * 4. Set the following environment variables:
 *    - MSG91_API_KEY=your_api_key
 *    - MSG91_SENDER_ID=your_sender_id
 *    - MSG91_TEMPLATE_ID=your_template_id
 */

interface SmsOptions {
  to: string;
  message: string;
  templateId?: string;
  variables?: Record<string, string>;
}

interface SmsResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendSms(options: SmsOptions): Promise<SmsResponse> {
  const apiKey = process.env.MSG91_API_KEY;
  const senderId = process.env.MSG91_SENDER_ID;
  const templateId = options.templateId || process.env.MSG91_TEMPLATE_ID;

  if (!apiKey) {
    console.log(`[SMS Service] MSG91 API key not configured. Would send SMS to ${options.to}: ${options.message}`);
    return {
      success: true,
      messageId: `sms_placeholder_${Date.now()}`,
    };
  }

  try {
    // MSG91 Flow API endpoint
    // Documentation: https://docs.msg91.com/reference/flow
    const response = await fetch("https://api.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: apiKey,
      },
      body: JSON.stringify({
        flow_id: templateId,
        sender: senderId,
        mobiles: options.to.replace("+", ""),
        VAR1: options.variables ? Object.values(options.variables)[0] || "" : options.message,
        ...(options.variables || {}),
      }),
    });

    const data = await response.json();

    if (data.type === "success") {
      return {
        success: true,
        messageId: data.request_id,
      };
    }

    return {
      success: false,
      error: data.message || "SMS sending failed",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "SMS service error",
    };
  }
}

export async function sendBulkSms(
  recipients: string[],
  message: string
): Promise<{ success: boolean; sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const result = await sendSms({ to: recipient, message });
    if (result.success) sent++;
    else failed++;
  }

  return { success: failed === 0, sent, failed };
}

export async function sendTemplateSms(
  to: string,
  templateId: string,
  variables: Record<string, string>
): Promise<SmsResponse> {
  return sendSms({ to, message: "", templateId, variables });
}
