// User type with new balance and shareholder fields
export interface User {
  id: number;
  name: string;
  phone: string;
  country_code: string;
  logo_url: string | null;
  expire_date: string | null;
  is_active: boolean;
  is_superuser: boolean;
  kyc_status: 'pending' | 'approved' | 'rejected';
  kyc_reject_reason: string | null;
  kyc_document_type: 'aadhaar' | 'food_license' | null;
  kyc_document_url: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  // New fields
  address: string;
  ug_client_transaction_id: string | null;
  balance: number;
  due_balance: number;
  is_shareholder: boolean;
  share_percentage: number;
  created_at: string;
  updated_at: string;
}

// SuperSettings type with new transaction system fields
export interface SuperSetting {
  id: number;
  expire_duration_month: number;
  per_qr_stand_price: number;
  subscription_fee_per_month: number;
  // New fields
  ug_client_transaction_id: string | null;
  per_transaction_fee: number;
  is_subscription_fee: boolean;
  due_threshold: number;
  is_whatsapp_usage: boolean;
  whatsapp_per_usage: number;
  whatsapp_template_marketing?: string;
  whatsapp_template_imagemarketing?: string;
  share_distribution_day: number;
  balance: number;
  created_at: string;
  updated_at: string;
}

// Transaction type enum values
export type TransactionType = 'in' | 'out';
export type TransactionCategory = 
  | 'order' 
  | 'transaction_fee' 
  | 'subscription_fee' 
  | 'whatsapp_usage' 
  | 'qr_stand_order' 
  | 'share_distribution' 
  | 'share_withdrawal' 
  | 'due_paid';
export type TransactionStatus = 'pending' | 'success' | 'failed';

// Transaction type with new fields
export interface Transaction {
  id: number;
  amount: string;
  status: TransactionStatus;
  remarks: string | null;
  utr: string | null;
  vpa: string | null;
  payer_name: string | null;
  bank_id: string | null;
  // New fields
  transaction_type: TransactionType;
  transaction_category: TransactionCategory;
  is_system: boolean;
  order_id: number | null;
  qr_stand_order_id: number | null;
  user_info?: {
    id: number;
    name: string;
    phone: string;
    logo_url: string | null;
  } | null;
  // UG Payment Gateway fields
  ug_order_id: number | null;
  ug_client_txn_id: string | null;
  ug_payment_url: string | null;
  ug_txn_date: string | null;
  ug_status: string | null;
  ug_remark: string | null;
  created_at: string;
  updated_at: string;
}

// UG Payment types
export type PaymentType = 'order' | 'dues' | 'subscription' | 'qr_stand';

export interface InitiatePaymentRequest {
  payment_type: PaymentType;
  reference_id: number;
  amount: string;
  customer_name: string;
  customer_email?: string;
  customer_mobile: string;
}

export interface InitiatePaymentResponse {
  success: boolean;
  payment_url: string;
  ug_client_txn_id: string;
  ug_order_id: number;
  transaction_id: number;
  message: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  status: 'success' | 'failure' | 'pending' | 'scanning' | 'unknown';
  transaction: {
    id: number;
    amount: string;
    utr: string | null;
    vpa: string | null;
    status: TransactionStatus;
    ug_status: string | null;
    ug_remark: string | null;
    payment_type: TransactionCategory;
    created_at: string;
    vendor_phone: string | null;
  };
  message?: string;
}

export interface PaymentStatusResponse {
  has_payment: boolean;
  payment: {
    id: number;
    ug_client_txn_id: string;
    ug_order_id: number;
    ug_payment_url: string;
    ug_status: string | null;
    ug_remark: string | null;
    amount: string;
    utr: string | null;
    vpa: string | null;
    status: TransactionStatus;
    created_at: string;
  } | null;
}

// Shareholder type (user with shareholder fields)
export interface Shareholder {
  id: number;
  name: string;
  phone: string;
  country_code: string;
  logo_url: string | null;
  balance: number;
  due_balance: number;
  is_shareholder: boolean;
  share_percentage: number;
  address: string;
  created_at: string;
  updated_at: string;
}

// Shareholder Withdrawal type
export type WithdrawalStatus = 'pending' | 'approved' | 'failed';

export interface ShareholderWithdrawal {
  id: number;
  user: number;
  user_info?: {
    id: number;
    name: string;
    phone: string;
    balance: number;
    share_percentage: number;
    logo_url: string | null;
  } | null;
  amount: number;
  status: WithdrawalStatus;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

// Vendor with dues type
export interface VendorDue {
  id: number;
  name: string;
  phone: string;
  country_code: string;
  logo_url: string | null;
  balance: number;
  due_balance: number;
  is_over_threshold: boolean;
  created_at: string;
  updated_at: string;
}

// Order type
export interface Order {
  id: number;
  name: string;
  phone: string;
  country_code: string;
  table_no: string;
  status: 'pending' | 'accepted' | 'running' | 'ready' | 'rejected' | 'completed';
  payment_status: 'pending' | 'paid' | 'failed';
  total: string;
  fcm_token: string | null;
  reject_reason: string | null;
  items: OrderItem[];
  vendor: {
    id: number;
    name: string;
    phone: string;
    logo_url: string | null;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  product_image_url: string | null;
  product_variant: number;
  variant_info: {
    unit_name: string;
    unit_symbol: string;
    price: string;
  } | null;
  price: string;
  quantity: number;
  total: string;
  created_at: string;
  updated_at: string;
}

// QR Stand Order type
export interface QRStandOrder {
  id: number;
  vendor: number;
  vendor_info?: {
    id: number;
    name: string;
    phone: string;
    logo_url: string | null;
  } | null;
  quantity: number;
  total_price: string;
  order_status: 'pending' | 'accepted' | 'saved' | 'delivered';
  payment_status: 'pending' | 'paid' | 'failed';
  created_at: string;
  updated_at: string;
}

// Category labels for transaction categories
export const TRANSACTION_CATEGORY_LABELS: Record<TransactionCategory, string> = {
  order: 'Order Payment',
  transaction_fee: 'Transaction Fee',
  subscription_fee: 'Subscription Fee',
  whatsapp_usage: 'WhatsApp Usage',
  qr_stand_order: 'QR Stand Order',
  share_distribution: 'Share Distribution',
  share_withdrawal: 'Shareholder Withdrawal',
  due_paid: 'Due Paid',
};

// Type labels for transaction types
export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  in: 'Incoming',
  out: 'Outgoing',
};

// =====================
// DASHBOARD TYPES
// =====================

// Period type for charts
export type DashboardPeriod = 'daily' | 'weekly' | 'monthly';

// Revenue trend data point
export interface RevenueTrendPoint {
  date: string;
  revenue: number;
  orders: number;
}

// Product insight item
export interface ProductInsight {
  product_id: number;
  product_name: string;
  product_image: string | null;
  total_quantity: number;
  total_revenue: number;
}

// Repeat customer item
export interface RepeatCustomer {
  id: number;
  name: string;
  phone: string;
  country_code: string;
  order_count: number;
  total_spend: number;
}

// Pending order (simplified for dashboard)
export interface PendingOrder {
  id: number;
  name: string;
  phone: string;
  table_no: string;
  total: string;
  status: string;
  created_at: string;
}

// Pending QR Stand Order (simplified for dashboard)
export interface PendingQROrder {
  id: number;
  vendor: number;
  vendor_info?: {
    id: number;
    name: string;
    phone: string;
    logo_url: string | null;
  } | null;
  quantity: number;
  total_price: string;
  order_status: string;
  payment_status: string;
  created_at: string;
}

// Vendor Dashboard Data
export interface VendorDashboardData {
  // Stats
  due_balance: number;
  subscription_status: 'active' | 'expired' | 'none';
  subscription_end_date: string | null;
  total_orders: number;
  total_sales: number;
  total_products: number;
  total_qr_stand_orders: number;
  
  // Pending items
  pending_orders: PendingOrder[];
  pending_orders_count: number;
  pending_qr_orders: PendingQROrder[];
  pending_qr_orders_count: number;
  
  // Revenue trends (by period)
  revenue_trends: {
    daily: RevenueTrendPoint[];
    weekly: RevenueTrendPoint[];
    monthly: RevenueTrendPoint[];
  };
  
  // Product insights
  top_selling_products: ProductInsight[];
  top_revenue_products: ProductInsight[];
  
  // Repeat customers
  repeat_customers: RepeatCustomer[];
  
  // Transactions
  transactions: Transaction[];
  
  // Legacy fields for compatibility
  subscription?: {
    type: string | null;
    start_date: string | null;
    end_date: string | null;
    amount_paid: string;
    status: string;
  };
  payment_status_breakdown?: {
    paid: number;
    pending: number;
    failed: number;
  };
  subscription_history?: Array<{
    date: string;
    event: string;
    amount?: string;
    status?: string;
  }>;
  finance_summary?: {
    today: string;
    week: string;
    month: string;
  };
  best_selling_products?: ProductInsight[];
  order_trends?: {
    daily: RevenueTrendPoint[];
    monthly: RevenueTrendPoint[];
  };
  recent_orders?: Order[];
  total_revenue?: string;
}

// Shareholder distribution item
export interface ShareholderDistribution {
  id: number;
  name: string;
  phone: string;
  share_percentage: number;
  amount: number;
  logo_url: string | null;
}

// Revenue breakdown
export interface RevenueBreakdown {
  qr_stand_earnings: number;
  due_collection: number;
  subscription_earnings: number;
  transaction_earnings: number;
  whatsapp_earnings: number;
  total: number;
}

// Financial trend point
export interface FinancialTrendPoint {
  date: string;
  income: number;
  outgoing: number;
  profit: number;
  loss: number;
}

// Top vendor item
export interface TopVendor {
  id: number;
  name: string;
  phone: string;
  logo_url: string | null;
  total_revenue: number;
  total_orders: number;
}

// Pending KYC request
export interface PendingKYCRequest {
  id: number;
  name: string;
  phone: string;
  country_code: string;
  kyc_status: string;
  kyc_document_type: string | null;
  kyc_document_url: string | null;
  created_at: string;
}

// System Dashboard Data
export interface SystemDashboardData {
  // System balance (prominent)
  system_balance: number;
  
  // Vendor stats
  total_vendors: number;
  active_vendors: number;
  inactive_vendors: number;
  pending_kyc_vendors: number;
  expired_vendors: number;
  due_blocked_vendors: number;
  
  // Shareholder stats
  total_shareholders: number;
  total_shareholder_balance: number;
  total_distributed_balance: number;
  total_shareholder_withdrawals: number;
  pending_shareholder_withdrawals_count: number;
  
  // Financial stats
  total_due_amount: number;
  total_system_revenue: number;
  qr_stand_earnings: number;
  subscription_earnings: number;
  transaction_earnings: number;
  whatsapp_earnings: number;
  
  // Shareholder distribution
  shareholder_distribution: ShareholderDistribution[];
  
  // Revenue breakdown
  revenue_breakdown: RevenueBreakdown;
  
  // Financial trends
  financial_trends: FinancialTrendPoint[];
  
  // Pending items
  pending_qr_orders: PendingQROrder[];
  pending_kyc_requests: PendingKYCRequest[];
  pending_withdrawals: ShareholderWithdrawal[];
  
  // Top vendors
  top_revenue_vendors: TopVendor[];
  
  // Legacy fields for compatibility
  users?: {
    total: number;
    active: number;
    deactivated: number;
  };
  revenue?: {
    total: string;
    trends: Array<{
      date: string;
      revenue: string;
    }>;
  };
  pending_kyc_count?: number;
  transactions?: Transaction[];
  total_transactions?: number;
  pending_qr_orders_count?: number;
  transactions_trend?: Array<{
    date: string;
    count: number;
  }>;
  users_overview?: Array<{
    id: number;
    name: string;
    phone: string;
    is_active: boolean;
    is_superuser: boolean;
    total_orders: number;
    total_revenue: string;
    kyc_status: string;
  }>;
}
