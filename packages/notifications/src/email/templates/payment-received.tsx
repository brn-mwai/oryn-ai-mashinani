interface PaymentReceivedProps {
  clientName: string;
  amount: number;
  currency: string;
  claimTitle: string;
  paymentMethod: string;
  transactionId?: string;
  senderName: string;
  companyName?: string;
  receiptUrl?: string;
}

export function getPaymentReceivedSubject(
  amount: number,
  currency: string
): string {
  return `Payment Received - Thank You! (${currency} ${amount.toLocaleString()})`;
}

export function PaymentReceivedEmail({
  clientName,
  amount,
  currency,
  claimTitle,
  paymentMethod,
  transactionId,
  senderName,
  companyName = "Oryn",
  receiptUrl,
}: PaymentReceivedProps): string {
  const formattedAmount = `${currency} ${amount.toLocaleString()}`;
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Received - Thank You!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #10b981; padding: 32px 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">✓</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                Payment Received!
              </h1>
            </td>
          </tr>

          <!-- Amount Banner -->
          <tr>
            <td style="background-color: #ecfdf5; padding: 24px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                Amount Paid
              </p>
              <p style="margin: 0; color: #10b981; font-size: 36px; font-weight: 700;">
                ${formattedAmount}
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Dear ${clientName},
              </p>

              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Thank you for your payment! We have successfully received your payment for "${claimTitle}".
              </p>

              <!-- Payment Details -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <h3 style="margin: 0 0 16px 0; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                      Payment Details
                    </h3>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Invoice</td>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 500;">${claimTitle}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount</td>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 500;">${formattedAmount}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Payment Method</td>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 500;">${paymentMethod}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date</td>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 500;">${date}</td>
                      </tr>
                      ${transactionId ? `
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Transaction ID</td>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 500; font-family: monospace;">${transactionId}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              ${receiptUrl ? `
              <!-- Download Receipt Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${receiptUrl}" target="_blank" style="display: inline-block; padding: 12px 32px; background-color: #6366f1; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 6px;">
                      Download Receipt
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}

              <p style="margin: 24px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
                We appreciate your business and prompt payment. If you have any questions about this transaction, please don't hesitate to reach out.
              </p>

              <p style="margin: 24px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Thank you,<br>
                ${senderName}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                This is an automated receipt from ${companyName}. Please keep this for your records.
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

export function PaymentReceivedText({
  clientName,
  amount,
  currency,
  claimTitle,
  paymentMethod,
  transactionId,
  senderName,
}: PaymentReceivedProps): string {
  const formattedAmount = `${currency} ${amount.toLocaleString()}`;
  const date = new Date().toLocaleDateString();

  let text = `Dear ${clientName},\n\n`;
  text += `Thank you for your payment! We have successfully received your payment for "${claimTitle}".\n\n`;
  text += `PAYMENT DETAILS\n`;
  text += `---------------\n`;
  text += `Invoice: ${claimTitle}\n`;
  text += `Amount: ${formattedAmount}\n`;
  text += `Payment Method: ${paymentMethod}\n`;
  text += `Date: ${date}\n`;
  if (transactionId) {
    text += `Transaction ID: ${transactionId}\n`;
  }
  text += `\nThank you for your business!\n\n`;
  text += `${senderName}`;

  return text;
}
