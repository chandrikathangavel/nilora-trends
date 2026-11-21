/**
 * Indian Pincode validation and region mapping utility.
 * Indian Postal Index Numbers (PIN codes) are strictly 6 numeric digits,
 * where the first digit represents one of the 9 postal regions (1-9, never 0).
 */

const PINCODE_PREFIX_MAP: Record<string, string> = {
  '11': 'Delhi',
  '12': 'Haryana',
  '13': 'Haryana',
  '14': 'Punjab',
  '15': 'Punjab',
  '16': 'Chandigarh',
  '17': 'Himachal Pradesh',
  '18': 'Jammu & Kashmir',
  '19': 'Jammu & Kashmir',
  '20': 'Uttar Pradesh',
  '21': 'Uttar Pradesh',
  '22': 'Uttar Pradesh',
  '23': 'Uttar Pradesh',
  '24': 'Uttarakhand',
  '25': 'Uttar Pradesh',
  '26': 'Uttarakhand',
  '27': 'Uttar Pradesh',
  '28': 'Uttar Pradesh',
  '30': 'Rajasthan',
  '31': 'Rajasthan',
  '32': 'Rajasthan',
  '33': 'Rajasthan',
  '34': 'Rajasthan',
  '36': 'Gujarat',
  '37': 'Gujarat',
  '38': 'Gujarat',
  '39': 'Gujarat',
  '40': 'Maharashtra',
  '41': 'Maharashtra',
  '42': 'Maharashtra',
  '43': 'Maharashtra',
  '44': 'Maharashtra',
  '45': 'Madhya Pradesh',
  '46': 'Madhya Pradesh',
  '47': 'Madhya Pradesh',
  '48': 'Madhya Pradesh',
  '49': 'Chhattisgarh',
  '50': 'Telangana',
  '51': 'Andhra Pradesh',
  '52': 'Andhra Pradesh',
  '53': 'Andhra Pradesh',
  '56': 'Karnataka',
  '57': 'Karnataka',
  '58': 'Karnataka',
  '59': 'Karnataka',
  '60': 'Tamil Nadu',
  '61': 'Tamil Nadu',
  '62': 'Tamil Nadu',
  '63': 'Tamil Nadu',
  '64': 'Tamil Nadu',
  '67': 'Kerala',
  '68': 'Kerala',
  '69': 'Kerala',
  '70': 'West Bengal',
  '71': 'West Bengal',
  '72': 'West Bengal',
  '73': 'West Bengal',
  '74': 'West Bengal',
  '75': 'Odisha',
  '76': 'Odisha',
  '77': 'Odisha',
  '78': 'Assam',
  '79': 'North East States',
  '80': 'Bihar',
  '81': 'Bihar',
  '82': 'Jharkhand',
  '83': 'Jharkhand',
  '84': 'Bihar',
  '85': 'Bihar',
};

export function validateIndianPincode(pincode: string | null | undefined): {
  valid: boolean;
  state?: string;
  error?: string;
} {
  if (!pincode || typeof pincode !== 'string') {
    return { valid: false, error: 'Please enter a 6-digit Indian PIN code.' };
  }

  const cleaned = pincode.trim().replace(/\s+/g, '');

  if (!/^\d{6}$/.test(cleaned)) {
    return { valid: false, error: 'PIN code must be exactly 6 numeric digits.' };
  }

  if (cleaned.startsWith('0')) {
    return { valid: false, error: 'Indian PIN codes cannot begin with 0.' };
  }

  const prefix = cleaned.substring(0, 2);
  const inferredState = PINCODE_PREFIX_MAP[prefix];

  return {
    valid: true,
    state: inferredState || undefined,
  };
}

/**
 * Validates delivery serviceability and Cash on Delivery eligibility for a given pincode and order value.
 */
export function checkCodEligibility(orderTotal: number, pincode: string): {
  eligible: boolean;
  reason?: string;
} {
  const pinCheck = validateIndianPincode(pincode);
  if (!pinCheck.valid) {
    return { eligible: false, reason: pinCheck.error };
  }

  // COD is permitted for orders up to ₹10,000 for boutique security
  const MAX_COD_AMOUNT = 10000;
  if (orderTotal > MAX_COD_AMOUNT) {
    return {
      eligible: false,
      reason: `Cash on Delivery is limited to orders up to ₹${MAX_COD_AMOUNT.toLocaleString('en-IN')}. For orders above this value, please select Online Payment.`,
    };
  }

  return { eligible: true };
}
