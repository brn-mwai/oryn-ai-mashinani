// Payment reminder templates
export {
  PaymentReminderEmail,
  PaymentReminderText,
  getPaymentReminderSubject,
} from "./payment-reminder";

// Payment received templates
export {
  PaymentReceivedEmail,
  PaymentReceivedText,
  getPaymentReceivedSubject,
} from "./payment-received";

// Template types
export type EmailTemplateType =
  | "payment_reminder"
  | "payment_received"
  | "welcome"
  | "claim_update"
  | "escalation_notice"
  | "payment_link"
  | "custom";

// Template metadata
export const EMAIL_TEMPLATE_INFO: Record<
  EmailTemplateType,
  { name: string; description: string }
> = {
  payment_reminder: {
    name: "Payment Reminder",
    description: "Remind clients about outstanding payments",
  },
  payment_received: {
    name: "Payment Received",
    description: "Confirm payment receipt to clients",
  },
  welcome: {
    name: "Welcome Email",
    description: "Welcome new clients",
  },
  claim_update: {
    name: "Claim Update",
    description: "Notify about claim status changes",
  },
  escalation_notice: {
    name: "Escalation Notice",
    description: "Notify about claim escalation",
  },
  payment_link: {
    name: "Payment Link",
    description: "Send a payment link to clients",
  },
  custom: {
    name: "Custom Email",
    description: "Custom email with user-defined content",
  },
};
