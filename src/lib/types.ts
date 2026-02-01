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
