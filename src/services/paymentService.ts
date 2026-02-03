/**
 * Payment Service for UG Payment Gateway integration.
 * 
 * This service provides functions for initiating, verifying, and managing
 * payments through the UG Payment Gateway.
 */

import { api } from '@/lib/api';
import type {
  PaymentType,
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  VerifyPaymentResponse,
  PaymentStatusResponse,
} from '@/lib/types';

/**
 * Initiate a UG payment for any payment type.
 * 
 * @param params - Payment initiation parameters
 * @returns Promise with payment URL and transaction details
 */
export async function initiatePayment(
  params: InitiatePaymentRequest
): Promise<{ data?: InitiatePaymentResponse; error?: string }> {
  const response = await api.post<InitiatePaymentResponse>('/api/payment/initiate/', params);
  
  if (response.error) {
    return { error: response.error };
  }
  
  return { data: response.data };
}

/**
 * Verify the status of a UG payment.
 * 
 * @param txnId - The UG client transaction ID
 * @returns Promise with payment status and transaction details
 */
export async function verifyPayment(
  txnId: string
): Promise<{ data?: VerifyPaymentResponse; error?: string }> {
  const response = await api.get<VerifyPaymentResponse>(`/api/payment/verify/${txnId}/`);
  
  if (response.error) {
    return { error: response.error };
  }
  
  return { data: response.data };
}

/**
 * Get payment status for a specific order.
 * 
 * @param orderId - The order ID
 * @returns Promise with payment details if exists
 */
export async function getOrderPaymentStatus(
  orderId: number
): Promise<{ data?: PaymentStatusResponse; error?: string }> {
  const response = await api.get<PaymentStatusResponse>(`/api/payment/status/order/${orderId}/`);
  
  if (response.error) {
    return { error: response.error };
  }
  
  return { data: response.data };
}

/**
 * Get payment status for a specific QR stand order.
 * 
 * @param qrStandOrderId - The QR stand order ID
 * @returns Promise with payment details if exists
 */
export async function getQRStandPaymentStatus(
  qrStandOrderId: number
): Promise<{ data?: PaymentStatusResponse; error?: string }> {
  const response = await api.get<PaymentStatusResponse>(`/api/payment/status/qr-stand/${qrStandOrderId}/`);
  
  if (response.error) {
    return { error: response.error };
  }
  
  return { data: response.data };
}

/**
 * Redirect to UG payment URL.
 * Opens the payment URL in the same window.
 * 
 * @param paymentUrl - The UG payment URL
 */
export function redirectToPayment(paymentUrl: string): void {
  window.location.href = paymentUrl;
}

/**
 * Initiate payment for a customer order (legacy: order already created).
 * Use initiateOrderPaymentFromPayload for menu flow (order created only after payment success).
 */
export async function initiateOrderPayment(
  orderId: number,
  amount: string,
  customerName: string,
  customerMobile: string,
  customerEmail?: string
): Promise<{ data?: InitiatePaymentResponse; error?: string }> {
  return initiatePayment({
    payment_type: 'order',
    reference_id: orderId,
    amount,
    customer_name: customerName,
    customer_mobile: customerMobile,
    customer_email: customerEmail,
  });
}

/**
 * Initiate order payment without creating the order first.
 * Order is created only on payment success (backend creates it in callback).
 * Use this for the public menu flow.
 */
export interface InitiateOrderPaymentPayload {
  name: string;
  phone: string;
  table_no?: string;
  vendor_phone: string;
  total: string;
  items: string;
  fcm_token?: string;
}

export async function initiateOrderPaymentFromPayload(
  payload: InitiateOrderPaymentPayload
): Promise<{ data?: InitiatePaymentResponse; error?: string }> {
  const response = await api.post<InitiatePaymentResponse>('/api/payment/initiate-order/', payload);
  if (response.error) {
    return { error: response.error };
  }
  return { data: response.data };
}

/**
 * Initiate payment for vendor dues.
 * Convenience function that wraps initiatePayment for dues.
 * 
 * @param vendorId - The vendor/user ID
 * @param amount - The due amount
 * @param vendorName - Vendor's name
 * @param vendorPhone - Vendor's phone number
 * @param vendorEmail - Vendor's email (optional)
 * @returns Promise with payment URL and transaction details
 */
export async function initiateDuesPayment(
  vendorId: number,
  amount: string,
  vendorName: string,
  vendorPhone: string,
  vendorEmail?: string
): Promise<{ data?: InitiatePaymentResponse; error?: string }> {
  return initiatePayment({
    payment_type: 'dues',
    reference_id: vendorId,
    amount,
    customer_name: vendorName,
    customer_mobile: vendorPhone,
    customer_email: vendorEmail,
  });
}

/**
 * Initiate payment for subscription.
 * Convenience function that wraps initiatePayment for subscriptions.
 * 
 * @param userId - The user ID
 * @param amount - The subscription amount
 * @param userName - User's name
 * @param userPhone - User's phone number
 * @param userEmail - User's email (optional)
 * @returns Promise with payment URL and transaction details
 */
export async function initiateSubscriptionPayment(
  userId: number,
  amount: string,
  userName: string,
  userPhone: string,
  userEmail?: string
): Promise<{ data?: InitiatePaymentResponse; error?: string }> {
  return initiatePayment({
    payment_type: 'subscription',
    reference_id: userId,
    amount,
    customer_name: userName,
    customer_mobile: userPhone,
    customer_email: userEmail,
  });
}

/**
 * Initiate payment for QR stand order.
 * Convenience function that wraps initiatePayment for QR stand orders.
 * 
 * @param qrStandOrderId - The QR stand order ID
 * @param amount - The order amount
 * @param vendorName - Vendor's name
 * @param vendorPhone - Vendor's phone number
 * @param vendorEmail - Vendor's email (optional)
 * @returns Promise with payment URL and transaction details
 */
export async function initiateQRStandPayment(
  qrStandOrderId: number,
  amount: string,
  vendorName: string,
  vendorPhone: string,
  vendorEmail?: string
): Promise<{ data?: InitiatePaymentResponse; error?: string }> {
  return initiatePayment({
    payment_type: 'qr_stand',
    reference_id: qrStandOrderId,
    amount,
    customer_name: vendorName,
    customer_mobile: vendorPhone,
    customer_email: vendorEmail,
  });
}

/**
 * Poll payment status until completion or timeout.
 * 
 * @param txnId - The UG client transaction ID
 * @param maxAttempts - Maximum number of polling attempts (default: 30)
 * @param intervalMs - Polling interval in milliseconds (default: 2000)
 * @param onStatusUpdate - Optional callback for status updates
 * @returns Promise with final payment status
 */
export async function pollPaymentStatus(
  txnId: string,
  maxAttempts: number = 30,
  intervalMs: number = 2000,
  onStatusUpdate?: (status: string) => void
): Promise<{ data?: VerifyPaymentResponse; error?: string; timedOut?: boolean }> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const result = await verifyPayment(txnId);
    
    if (result.error) {
      return { error: result.error };
    }
    
    if (result.data) {
      const status = result.data.status;
      
      if (onStatusUpdate) {
        onStatusUpdate(status);
      }
      
      // Payment completed (success or failure)
      if (status === 'success' || status === 'failure') {
        return { data: result.data };
      }
    }
    
    attempts++;
    
    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  // Timed out - return last known status
  const finalResult = await verifyPayment(txnId);
  return { ...finalResult, timedOut: true };
}

/**
 * Get payment status label for display.
 * 
 * @param status - The UG payment status
 * @returns Human-readable status label
 */
export function getPaymentStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'success':
      return 'Payment Successful';
    case 'failure':
      return 'Payment Failed';
    case 'pending':
      return 'Payment Pending';
    case 'scanning':
      return 'Waiting for Payment';
    case 'created':
      return 'Payment Initiated';
    default:
      return 'Unknown Status';
  }
}

/**
 * Get payment status color class for UI styling.
 * 
 * @param status - The UG payment status
 * @returns Tailwind CSS color class
 */
export function getPaymentStatusColor(status: string | null | undefined): string {
  switch (status) {
    case 'success':
      return 'text-green-600';
    case 'failure':
      return 'text-red-600';
    case 'pending':
    case 'scanning':
    case 'created':
      return 'text-yellow-600';
    default:
      return 'text-gray-600';
  }
}
