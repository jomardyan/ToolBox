// backend/src/types/saas.ts

export interface UsageMetrics {
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

export interface SubscriptionDetails {
  id: string;
  planName: string;
  planType: 'subscription' | 'pay_as_you_go' | 'hybrid';
  price: number;
  billingPeriod: string;
  status: 'active' | 'past_due' | 'cancelled';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  features: Record<string, any>;
  rateLimit: number;
  monthlyLimit: number | null;
}

export interface BillingMetrics {
  mrr: number; // Monthly Recurring Revenue
  totalRevenue: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  pendingPayments: number;
  churnRate: number;
}

export interface ApiMetrics {
  totalApiCalls: number;
  errorRate: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  topErrors: Array<{
    statusCode: number;
    count: number;
    percentage: number;
  }>;
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usuageDistribution: {
    heavyUsers: number;
    mediumUsers: number;
    lightUsers: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode: number;
}
