/**
 * My Cafe – single source for design tokens (charts, status, brand).
 * For CSS variables (primary, background, etc.) edit src/styles/theme.css.
 */

/** Hex colors for Recharts and inline styles (charts, status badges, etc.) */
export const theme = {
  primary: '#8B6914',
  primaryForeground: '#FDF8ED',
  accent: '#D4A84B',
  success: '#10b981',
  successForeground: '#ffffff',
  warning: '#f59e0b',
  warningForeground: '#1f2937',
  destructive: '#ef4444',
  destructiveForeground: '#ffffff',
  muted: '#6b7280',
  info: '#3b82f6',
  /** Brand/logo (e.g. MenuQRCode) */
  brand: {
    gold: '#c9a227',
    dark: '#0a0a0a',
    white: '#ffffff',
  },
} as const;

/** Chart palette – use for bars, lines, pie segments (same order everywhere) */
export const chartColors = [
  '#10b981', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
] as const;

/** Bar chart gradient shades (e.g. TopVendorsChart) */
export const barChartShades = [
  '#10b981',
  '#34d399',
  '#6ee7b7',
  '#a7f3d0',
  '#d1fae5',
  '#3b82f6',
  '#60a5fa',
  '#93c5fd',
  '#bfdbfe',
  '#dbeafe',
] as const;

/** Status → color map for badges and charts */
export const statusColors: Record<string, string> = {
  active: '#10b981',
  inactive: '#6b7280',
  pending_kyc: '#f59e0b',
  expired: '#ef4444',
  due_blocked: '#dc2626',
  paid: '#10b981',
  pending: '#f59e0b',
  failed: '#ef4444',
};

/** Revenue source → color (RevenueBreakdownChart) */
export const revenueSourceColors = {
  qr_stand: '#3b82f6',
  due_collection: '#10b981',
  subscription: '#8b5cf6',
  transaction: '#f59e0b',
  whatsapp: '#06b6d4',
} as const;

/** Financial trends line colors */
export const financialTrendColors = {
  income: '#10b981',
  outgoing: '#ef4444',
  profit: '#3b82f6',
  loss: '#f97316',
} as const;

/** Name hash → color palette (e.g. MenuQRCode vendor colors) */
export const namePalette = [
  '#1C455A',
  '#2E7D32',
  '#1565C0',
  '#6A1B9A',
  '#C62828',
  '#E65100',
  '#00695C',
  '#283593',
] as const;

export function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return namePalette[Math.abs(hash) % namePalette.length];
}
