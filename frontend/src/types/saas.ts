// frontend/src/types/saas.ts

export interface Plan {
  id: string;
  name: string;
  description?: string;
  type: 'subscription' | 'pay_as_you_go' | 'hybrid';
  price: number;
  currency: string;
  billingPeriod: string;
  features: Record<string, any>;
  rateLimit: number;
  monthlyLimit: number | null;
  maxApiKeys: number;
  supportLevel?: string;
  status: 'active' | 'archived';
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  plan: Plan;
  stripeSubscriptionId?: string;
  billingCycleStart: Date;
  billingCycleEnd: Date;
  status: 'active' | 'past_due' | 'cancelled';
  autoRenew: boolean;
  cancellationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
  revokedAt?: Date;
}

export interface UsageSummary {
  totalRequests: number;
  totalCost: number;
  requestsByEndpoint: Record<string, number>;
  costByEndpoint: Record<string, number>;
  topEndpoints: Array<{
    endpoint: string;
    requests: number;
    cost: number;
  }>;
  dailyUsage: Array<{
    date: string;
    requests: number;
    cost: number;
  }>;
}

export interface QuotaStatus {
  hasQuota: boolean;
  limit?: number;
  used?: number;
  remaining?: number;
  percentageUsed?: number;
  rateLimit?: number;
  resetDate?: Date;
  message?: string;
}

export interface Invoice {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
  paidAt?: Date;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  lastFour: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  role: 'admin' | 'user';
  emailVerified: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface BillingOverview {
  subscription: Subscription;
  totalSpent: number;
  pendingAmount: number;
  lastInvoice?: Invoice;
}
