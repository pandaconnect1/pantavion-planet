export type StripeReadinessStatus =
  | "ready_foundation"
  | "blocked_until_business_setup"
  | "blocked_until_policy"
  | "blocked_until_provider_approval"
  | "not_started";

export type StripeReadinessItem = {
  id: string;
  title: string;
  status: StripeReadinessStatus;
  risk: "low" | "medium" | "high" | "critical";
  truth: string;
  requiredBeforeLive: string[];
};

export const STRIPE_READINESS_LEDGER: StripeReadinessItem[] = [
  {
    id: "business-identity",
    title: "Business identity and account country",
    status: "blocked_until_business_setup",
    risk: "critical",
    truth:
      "Pantavion cannot safely activate live charging until the business/account identity, country, representative, tax and banking responsibilities are clear.",
    requiredBeforeLive: [
      "Decide legal/business operating identity.",
      "Confirm Stripe account country and representative.",
      "Confirm bank payout owner.",
      "Confirm tax and invoice responsibility.",
    ],
  },
  {
    id: "subscription-products",
    title: "Subscription products and prices",
    status: "blocked_until_policy",
    risk: "high",
    truth:
      "Subscription pricing can be designed now, but live Products and Prices must match published terms, cancellation rules and fair-use limits.",
    requiredBeforeLive: [
      "Define Free / Core / Elite / Professional plan boundaries.",
      "Avoid unlimited API-cost promises.",
      "Define fair-use and abuse limits.",
      "Publish pricing terms before checkout.",
    ],
  },
  {
    id: "checkout",
    title: "Stripe Checkout architecture",
    status: "ready_foundation",
    risk: "medium",
    truth:
      "Hosted Stripe Checkout is the preferred first payment flow because it reduces PCI exposure and avoids custom card handling.",
    requiredBeforeLive: [
      "Use hosted Checkout for subscriptions.",
      "Never collect raw card data inside Pantavion.",
      "Use test mode first.",
      "Connect success and cancel URLs.",
    ],
  },
  {
    id: "customer-portal",
    title: "Customer portal and cancellation",
    status: "blocked_until_policy",
    risk: "high",
    truth:
      "Customers must be able to manage billing, invoices, payment methods and cancellation through a clear self-service path.",
    requiredBeforeLive: [
      "Enable Stripe Customer Portal.",
      "Add Manage Billing route.",
      "Add cancellation policy.",
      "Add refund policy.",
      "Add support contact.",
    ],
  },
  {
    id: "restricted-businesses",
    title: "Restricted and prohibited categories",
    status: "blocked_until_policy",
    risk: "critical",
    truth:
      "Pantavion must block adult/restricted goods, illegal products, scams, unsafe financial claims, unlicensed medical products, weapons, drugs and other high-risk categories before payments.",
    requiredBeforeLive: [
      "Publish Acceptable Use Policy.",
      "Block restricted marketplace categories.",
      "Block adult/restricted zones until legal review.",
      "Add financial/medical/income-claim safety rules.",
    ],
  },
  {
    id: "marketplace-connect",
    title: "Marketplace payouts / Connect",
    status: "blocked_until_provider_approval",
    risk: "critical",
    truth:
      "Marketplace payouts and payment splitting are not part of the first Stripe launch. They require KYC/KYB, fraud controls, dispute handling and provider approval.",
    requiredBeforeLive: [
      "Do not launch Connect yet.",
      "Do not promise seller payouts.",
      "Start with Pantavion subscription access only.",
      "Separate future marketplace payment gate.",
    ],
  },
  {
    id: "tax-invoices",
    title: "Tax, invoices and receipts",
    status: "blocked_until_business_setup",
    risk: "critical",
    truth:
      "Live charging creates invoice, receipt and tax obligations. Stripe can help calculate and manage billing, but Pantavion still needs business and tax responsibility defined.",
    requiredBeforeLive: [
      "Confirm tax registration need.",
      "Configure invoice branding.",
      "Confirm VAT/GST/sales-tax approach.",
      "Add customer receipt and invoice access.",
    ],
  },
  {
    id: "webhooks",
    title: "Webhook and entitlement sync",
    status: "not_started",
    risk: "high",
    truth:
      "Pantavion must not grant paid access from frontend success pages alone. Entitlements must be updated from verified Stripe webhook events.",
    requiredBeforeLive: [
      "Add webhook endpoint.",
      "Verify Stripe signature.",
      "Handle checkout.session.completed.",
      "Handle invoice.payment_failed.",
      "Handle customer.subscription.deleted.",
      "Sync entitlements server-side.",
    ],
  },
];

export function getStripeReadinessSummary() {
  return {
    total: STRIPE_READINESS_LEDGER.length,
    critical: STRIPE_READINESS_LEDGER.filter((item) => item.risk === "critical").length,
    readyFoundation: STRIPE_READINESS_LEDGER.filter((item) => item.status === "ready_foundation").length,
    blocked: STRIPE_READINESS_LEDGER.filter((item) => item.status !== "ready_foundation").length,
    liveChargingAllowed: false,
  };
}
