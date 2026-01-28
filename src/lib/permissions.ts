/**
 * Permission utility functions for checking edit/delete permissions
 */

export function canEditItem(user: any, item: any): boolean {
  if (!user) return false;
  if (user.is_superuser) return true;
  
  // Check various possible user_id fields (API returns user as FK id for vendors)
  return (
    item.user_id === user.id ||
    item.user === user.id ||
    item.user?.id === user.id ||
    item.id === user.id ||
    (item.user_info && item.user_info.id === user.id) ||
    (item.vendor && item.vendor.id === user.id) ||
    (item.vendor && String(item.vendor.id) === String(user.id))
  );
}

export function canDeleteItem(user: any, item: any): boolean {
  return canEditItem(user, item);
}

/** Only superusers can delete orders; vendors cannot. */
export function canDeleteOrder(user: any): boolean {
  return Boolean(user?.is_superuser);
}
