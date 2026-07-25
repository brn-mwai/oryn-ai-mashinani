import * as React from "react";

interface PaymentReminderProps {
  clientName: string;
  amount: number;
  currency: string;
  claimTitle: string;
  dueDate: string | null;
  daysOverdue: number;
  escalationLevel: number;
  paymentLink: string;
  senderName: string;
  companyName?: string;
  logoUrl?: string;
}

// Oryn brand colors
const ORYN_COLORS = {
  primary: "#a855f7", // Purple
  primaryDark: "#7c3aed", // Violet
  primaryLight: "#c084fc",
  background: "#ffffff",
  backgroundDark: "#1a1a2e",
  text: "#1f2937",
  textMuted: "#6b7280",
  border: "#e5e7eb",
};

// Get escalation-appropriate subject
export function getPaymentReminderSubject(
  escalationLevel: number,
  claimTitle: string,
  amount: number,
  currency: string
): string {
  const formattedAmount = `${currency} ${amount.toLocaleString()}`;

  switch (escalationLevel) {
    case 0:
      return `Friendly Reminder: Invoice for ${claimTitle}`;
    case 1:
      return `Payment Reminder: ${formattedAmount} Due - ${claimTitle}`;
    case 2:
      return `URGENT: Payment Required - ${formattedAmount} Overdue`;
    case 3:
      return `FINAL NOTICE: ${formattedAmount} - Immediate Payment Required`;
    case 4:
      return `LEGAL NOTICE: Overdue Account - ${formattedAmount}`;
    default:
      return `Payment Reminder: ${claimTitle}`;
  }
}

// Generate HTML email template with Oryn branding
export function PaymentReminderEmail({
  clientName,
  amount,
  currency,
  claimTitle,
  dueDate,
  daysOverdue,
  escalationLevel,
  paymentLink,
  senderName,
  companyName = "Oryn",
  logoUrl,
}: PaymentReminderProps): string {
  const formattedAmount = `${currency} ${amount.toLocaleString()}`;

  // Escalation-specific colors (using Oryn purple base with variations)
  const colors = {
    0: { primary: "#a855f7", bg: "#faf5ff", accent: "#c084fc" }, // Friendly - Purple
    1: { primary: "#8b5cf6", bg: "#f5f3ff", accent: "#a78bfa" }, // Firm - Violet
    2: { primary: "#f59e0b", bg: "#fffbeb", accent: "#fbbf24" }, // Urgent - Amber
    3: { primary: "#ef4444", bg: "#fef2f2", accent: "#f87171" }, // Final - Red
    4: { primary: "#991b1b", bg: "#fef2f2", accent: "#dc2626" }, // Legal - Dark Red
  };

  const color = colors[escalationLevel as keyof typeof colors] || colors[0];

  // Default logo (Oryn logo hosted on CDN or app URL)
  const orynLogo = logoUrl || "https://app.oryn.cc/logo-dark.svg";

  // Escalation-specific content
  const getContent = () => {
    switch (escalationLevel) {
      case 0:
        return {
          greeting: `I hope this message finds you well.`,
          body: `This is a friendly reminder about the outstanding invoice for "${claimTitle}" in the amount of <strong>${formattedAmount}</strong>.`,
          note: `If you've already sent the payment, please disregard this message.`,
          cta: "Pay Now",
          closing: "Best regards,",
        };
      case 1:
        return {
          greeting: `I'm writing to follow up on an outstanding payment.`,
          body: `The invoice for "${claimTitle}" in the amount of <strong>${formattedAmount}</strong> was due on ${dueDate || "the agreed date"} and remains unpaid.`,
          note: `Your prompt attention to this matter would be greatly appreciated.`,
          cta: "Make Payment",
          closing: "Thank you for your attention,",
        };
      case 2:
        return {
          greeting: `This is an urgent notice regarding your account.`,
          body: `Your payment for "${claimTitle}" of <strong>${formattedAmount}</strong> is now <strong>${daysOverdue} days overdue</strong>. This requires your immediate attention.`,
          note: `Continued non-payment may affect our business relationship and could result in additional collection measures.`,
          cta: "Pay Immediately",
          closing: "Regards,",
        };
      case 3:
        return {
          greeting: `FINAL NOTICE`,
          body: `Despite multiple previous reminders, the invoice for "${claimTitle}" in the amount of <strong>${formattedAmount}</strong> remains unpaid after <strong>${daysOverdue} days</strong>.`,
          note: `This is your final notice before we escalate this matter. Please make your payment within the next 48 hours to avoid further action.`,
          cta: "Pay Now to Avoid Escalation",
          closing: "",
        };
      case 4:
        return {
          greeting: `FORMAL DEMAND FOR PAYMENT`,
          body: `This letter serves as a formal demand for payment of the outstanding debt of <strong>${formattedAmount}</strong> for "${claimTitle}".`,
          note: `Your account is seriously delinquent. If payment is not received within 7 days, we may be forced to pursue additional collection activities, which may include reporting to credit bureaus, engaging a collection agency, or pursuing legal remedies.`,
          cta: "Resolve This Matter Now",
          closing: "",
        };
      default:
        return {
          greeting: ``,
          body: `This is a reminder about your outstanding balance of <strong>${formattedAmount}</strong> for "${claimTitle}".`,
          note: ``,
          cta: "Pay Now",
          closing: "Best regards,",
        };
    }
  };

  const content = getContent();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${getPaymentReminderSubject(escalationLevel, claimTitle, amount, currency)}</title>
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }

    @media (prefers-color-scheme: dark) {
      .email-body {
        background-color: #1a1a2e !important;
      }
      .email-container {
        background-color: #2d2d44 !important;
      }
      .text-dark {
        color: #f3f4f6 !important;
      }
      .text-muted {
        color: #9ca3af !important;
      }
      .bg-light {
        background-color: #3d3d5c !important;
      }
      .border-light {
        border-color: #4b5563 !important;
      }
    }
  </style>
</head>
<body class="email-body" style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" class="email-container" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header with Oryn Branding -->
          <tr>
            <td style="background: linear-gradient(135deg, ${ORYN_COLORS.primary} 0%, ${ORYN_COLORS.primaryDark} 100%); padding: 32px 40px; text-align: center;">
              <!-- Oryn Logo -->
              <img src="${orynLogo}" alt="Oryn" width="100" height="32" style="display: block; margin: 0 auto 16px auto; max-width: 100px;" />
              ${escalationLevel >= 3 ? `
              <div style="display: inline-block; padding: 4px 12px; background-color: rgba(255,255,255,0.2); border-radius: 20px; margin-bottom: 8px;">
                <span style="color: #ffffff; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                  ${escalationLevel === 3 ? 'Final Notice' : 'Legal Notice'}
                </span>
              </div>
              ` : ''}
            </td>
          </tr>

          <!-- Amount Banner -->
          <tr>
            <td class="bg-light" style="background-color: ${color.bg}; padding: 24px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <p class="text-muted" style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                Amount Due
              </p>
              <p style="margin: 0; color: ${color.primary}; font-size: 42px; font-weight: 700; line-height: 1.2;">
                ${formattedAmount}
              </p>
              ${daysOverdue > 0 ? `
              <p style="margin: 12px 0 0 0; color: #ef4444; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
                <span style="display: inline-block; width: 8px; height: 8px; background-color: #ef4444; border-radius: 50%;"></span>
                ${daysOverdue} days overdue
              </p>
              ` : ''}
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 40px;">
              <p class="text-dark" style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Dear ${clientName},
              </p>

              ${content.greeting ? `
              <p class="text-dark" style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                ${content.greeting}
              </p>
              ` : ''}

              <p class="text-dark" style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                ${content.body}
              </p>

              ${content.note ? `
              <div class="bg-light" style="margin: 0 0 24px 0; padding: 16px 20px; background-color: ${color.bg}; border-left: 4px solid ${color.primary}; border-radius: 0 8px 8px 0;">
                <p class="text-muted" style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                  ${content.note}
                </p>
              </div>
              ` : ''}

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 16px 0 24px 0;">
                    <a href="${paymentLink}" target="_blank" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, ${ORYN_COLORS.primary} 0%, ${ORYN_COLORS.primaryDark} 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 14px rgba(168, 85, 247, 0.4);">
                      ${content.cta}
                    </a>
                  </td>
                </tr>
              </table>

              <p class="text-muted" style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; text-align: center;">
                Or copy this payment link:
              </p>
              <p style="margin: 0 0 24px 0; text-align: center;">
                <a href="${paymentLink}" style="color: ${ORYN_COLORS.primary}; font-size: 13px; word-break: break-all;">${paymentLink}</a>
              </p>

              ${content.closing ? `
              <p class="text-dark" style="margin: 24px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
                ${content.closing}<br>
                <strong>${senderName}</strong>
              </p>
              ` : `
              <p class="text-dark" style="margin: 24px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
                <strong>${senderName}</strong>
              </p>
              `}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="bg-light border-light" style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <!-- Powered by Oryn -->
                    <p style="margin: 0 0 12px 0;">
                      <span style="color: #9ca3af; font-size: 12px;">Powered by </span>
                      <a href="https://oryn.cc" style="color: ${ORYN_COLORS.primary}; font-size: 12px; font-weight: 600; text-decoration: none;">Oryn</a>
                    </p>
                    <p class="text-muted" style="margin: 0 0 8px 0; color: #9ca3af; font-size: 11px;">
                      This email was sent on behalf of ${senderName}.
                    </p>
                    <p class="text-muted" style="margin: 0; color: #9ca3af; font-size: 11px;">
                      Questions? Reply to this email or contact <a href="mailto:support@oryn.cc" style="color: ${ORYN_COLORS.primary};">support@oryn.cc</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <!-- Unsubscribe / Legal -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px;">
          <tr>
            <td align="center" style="padding: 24px 20px;">
              <p style="margin: 0; color: #9ca3af; font-size: 11px; line-height: 1.6;">
                Oryn - Intelligent Payment Collection<br>
                <a href="https://oryn.cc/privacy" style="color: #9ca3af;">Privacy Policy</a> &bull;
                <a href="https://oryn.cc/terms" style="color: #9ca3af;">Terms of Service</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

// Generate plain text version
export function PaymentReminderText({
  clientName,
  amount,
  currency,
  claimTitle,
  dueDate,
  daysOverdue,
  escalationLevel,
  paymentLink,
  senderName,
}: PaymentReminderProps): string {
  const formattedAmount = `${currency} ${amount.toLocaleString()}`;

  let text = `Dear ${clientName},\n\n`;

  switch (escalationLevel) {
    case 0:
      text += `I hope this message finds you well. This is a friendly reminder about the outstanding invoice for "${claimTitle}" in the amount of ${formattedAmount}.\n\n`;
      text += `If you've already sent the payment, please disregard this message.\n\n`;
      break;
    case 1:
      text += `I'm writing to follow up on the outstanding invoice for "${claimTitle}" in the amount of ${formattedAmount}, which was due on ${dueDate || "the agreed date"}.\n\n`;
      text += `Your prompt attention to this matter would be greatly appreciated.\n\n`;
      break;
    case 2:
      text += `URGENT: Your payment for "${claimTitle}" of ${formattedAmount} is now ${daysOverdue} days overdue.\n\n`;
      text += `This requires your immediate attention. Continued non-payment may affect our business relationship.\n\n`;
      break;
    case 3:
      text += `FINAL NOTICE\n\n`;
      text += `Despite multiple previous reminders, the invoice for "${claimTitle}" in the amount of ${formattedAmount} remains unpaid after ${daysOverdue} days.\n\n`;
      text += `This is your final notice before escalation. Please pay within 48 hours.\n\n`;
      break;
    case 4:
      text += `FORMAL DEMAND FOR PAYMENT\n\n`;
      text += `This serves as a formal demand for payment of ${formattedAmount} for "${claimTitle}".\n\n`;
      text += `Your account is seriously delinquent. If payment is not received within 7 days, we may pursue additional collection activities including legal remedies.\n\n`;
      break;
  }

  text += `Pay securely here: ${paymentLink}\n\n`;
  text += `${escalationLevel < 3 ? "Best regards" : ""},\n${senderName}\n\n`;
  text += `---\nPowered by Oryn - https://oryn.cc`;

  return text;
}
