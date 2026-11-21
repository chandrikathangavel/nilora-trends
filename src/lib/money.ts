/**
 * Decimal-safe money and currency calculation utilities for NILORA TRENDS.
 * Prevents IEEE-754 floating point arithmetic issues by using integer paise internally.
 */

import { calculateZonalShippingFeePaise, DeliveryAddressInput } from './shipping';

// 1 Rupee = 100 Paise
export const PAISE_PER_RUPEE = 100;

// Standard shipping business rules
export const FREE_SHIPPING_THRESHOLD_RUPEES = 1999;
export const FREE_SHIPPING_THRESHOLD_PAISE = FREE_SHIPPING_THRESHOLD_RUPEES * PAISE_PER_RUPEE;
export const STANDARD_SHIPPING_FEE_RUPEES = 149;
export const STANDARD_SHIPPING_FEE_PAISE = STANDARD_SHIPPING_FEE_RUPEES * PAISE_PER_RUPEE;

/**
 * Converts a Rupee amount to integer Paise.
 */
export function toPaise(rupees: number): number {
  if (!Number.isFinite(rupees)) return 0;
  return Math.round(rupees * PAISE_PER_RUPEE);
}

/**
 * Converts integer Paise to Rupees.
 */
export function toRupees(paise: number): number {
  if (!Number.isFinite(paise)) return 0;
  return Math.round(paise) / PAISE_PER_RUPEE;
}

/**
 * Safely calculates item line total in Paise.
 */
export function calculateLineTotalPaise(unitPriceRupees: number, quantity: number): number {
  const safeQty = Math.max(0, Math.floor(quantity || 0));
  const unitPricePaise = toPaise(unitPriceRupees);
  return unitPricePaise * safeQty;
}

/**
 * Calculates cart subtotal in Paise from items.
 */
export function calculateSubtotalPaise(items: Array<{ price: number; quantity: number }>): number {
  return items.reduce((acc, item) => {
    return acc + calculateLineTotalPaise(item.price, item.quantity);
  }, 0);
}

/**
 * Calculates shipping fee in Paise based on dynamic zonal rules and destination address.
 * If address is provided, calculates exact zone rate:
 * - Zone 1: Erode (Local) -> ₹40
 * - Zone 2: Neighboring & Kongu Region -> ₹50 - ₹60
 * - Zone 3: Rest of Tamil Nadu -> ₹55 - ₹101
 * - Rest of India: ₹149
 * Free delivery on orders >= ₹1,999.
 */
export function calculateShippingFeePaise(
  subtotalPaise: number,
  address?: DeliveryAddressInput | null
): number {
  if (subtotalPaise <= 0) return 0;
  if (subtotalPaise >= FREE_SHIPPING_THRESHOLD_PAISE) return 0;
  if (address && (address.pincode || address.city || address.state)) {
    return calculateZonalShippingFeePaise(subtotalPaise, address);
  }
  // When no delivery address is added yet, do not assume or charge shipping fee
  return 0;
}

/**
 * Computes remaining amount in Rupees needed to unlock free shipping.
 */
export function calculateFreeShippingRemainingRupees(subtotalPaise: number): number {
  if (subtotalPaise >= FREE_SHIPPING_THRESHOLD_PAISE) return 0;
  return toRupees(FREE_SHIPPING_THRESHOLD_PAISE - subtotalPaise);
}

/**
 * Computes discount in Paise given subtotal and coupon parameters.
 */
export function calculateDiscountPaise(
  subtotalPaise: number,
  coupon: {
    discountType: 'percent' | 'flat';
    discountValue: number;
    minimumOrderRupees?: number;
    maximumDiscountRupees?: number;
  }
): { discountPaise: number; error?: string } {
  const minOrderPaise = toPaise(coupon.minimumOrderRupees || 0);

  if (subtotalPaise < minOrderPaise) {
    return {
      discountPaise: 0,
      error: `Coupon requires a minimum order of ₹${(coupon.minimumOrderRupees || 0).toLocaleString('en-IN')}.`,
    };
  }

  let discountPaise = 0;
  if (coupon.discountType === 'percent') {
    const rawDiscount = Math.round((subtotalPaise * coupon.discountValue) / 100);
    discountPaise = rawDiscount;
  } else {
    // Flat rupee discount
    discountPaise = toPaise(coupon.discountValue);
  }

  // Cap at maximum discount if defined
  if (coupon.maximumDiscountRupees && coupon.maximumDiscountRupees > 0) {
    const maxDiscountPaise = toPaise(coupon.maximumDiscountRupees);
    discountPaise = Math.min(discountPaise, maxDiscountPaise);
  }

  // Discount cannot exceed subtotal
  discountPaise = Math.min(discountPaise, subtotalPaise);

  return { discountPaise: Math.max(0, discountPaise) };
}

/**
 * Formats a Rupee amount into Indian Rupee currency string (e.g. "₹1,499").
 */
export function formatINR(rupees: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(rupees)));
}
