export const subscriptionPlans = [
  {
    key: "free",
    name: "Free",
    priceCents: 0,
    features: ["5 estimates/month", "5 invoices/month", "1 user", "branded PDF footer"]
  },
  {
    key: "pro",
    name: "Pro",
    priceCents: 2900,
    features: [
      "Unlimited estimates",
      "Unlimited invoices",
      "Customer management",
      "Expense tracking",
      "PDF exports",
      "QR codes",
      "Basic reports"
    ]
  },
  {
    key: "business",
    name: "Business",
    priceCents: 7900,
    features: [
      "Crew management",
      "Material tracking",
      "Job photo reports",
      "Change orders",
      "Voice-to-estimate interface",
      "Accountant export",
      "Custom branding"
    ]
  }
] as const;

export interface BillingProvider {
  createCheckoutSession(input: { tenantId: string; planKey: string }): Promise<{ url: string }>;
  cancelSubscription(input: { tenantId: string }): Promise<void>;
}

export class ManualBillingProvider implements BillingProvider {
  async createCheckoutSession(input: { tenantId: string; planKey: string }) {
    return {
      url: `/operator/billing/manual?tenantId=${encodeURIComponent(input.tenantId)}&plan=${encodeURIComponent(input.planKey)}`
    };
  }

  async cancelSubscription() {
    return;
  }
}
