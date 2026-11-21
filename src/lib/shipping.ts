/**
 * NILORA TRENDS - Dynamic Zonal Shipping Engine (Origin: Erode, Tamil Nadu)
 * 
 * Rules:
 * Zone 1: Local (Erode District) -> ₹40
 * Zone 2: Neighboring & Kongu Region -> ₹50 - ₹60
 *         (Coimbatore, Tiruppur, Salem, Namakkal, Karur, Dindigul, Dharmapuri, Krishnagiri, Nilgiris)
 * Zone 3: Rest of Tamil Nadu (28 districts including Chennai, Madurai, Tirunelveli, Kanyakumari) -> ₹55 - ₹101
 * Rest of India: Standard Pan-India Courier -> ₹149
 * 
 * Free Shipping: Automatically applies on orders >= ₹1,999 regardless of destination.
 */

export const PAISE_PER_RUPEE = 100;
export const FREE_SHIPPING_THRESHOLD_RUPEES = 1999;
export const FREE_SHIPPING_THRESHOLD_PAISE = FREE_SHIPPING_THRESHOLD_RUPEES * PAISE_PER_RUPEE;

export type ShippingZoneKey = 'zone-1' | 'zone-2' | 'zone-3' | 'rest-of-india' | 'pending';

export interface ShippingZoneDetails {
  zoneKey: ShippingZoneKey;
  zoneName: string;
  district: string;
  baseRateRupees: number;
  baseRatePaise: number;
  shippingFeeRupees: number;
  shippingFeePaise: number;
  isFreeShipping: boolean;
  explanation: string;
}

export interface DeliveryAddressInput {
  pincode?: string | null;
  city?: string | null;
  state?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
}

// ---------------------------------------------------------------------------
// ZONE 1: LOCAL (ERODE DISTRICT) -> ₹40
// ---------------------------------------------------------------------------
const ERODE_LOCALITIES = [
  'erode',
  'gobichettipalayam',
  'gobi',
  'bhavani',
  'perundurai',
  'sathyamangalam',
  'sathy',
  'anthiyur',
  'modakurichi',
  'kodumudi',
  'chithode',
  'chennimalai',
  'bhavanisagar',
  'nambiyur',
  'thalavadi',
  'talavadi',
  'ammapettai',
  'appakudal',
  'olagadam',
  'kavindapadi',
  'kasipalayam',
  'surampatti',
  'veerappanchatram',
  'solar',
  'kunderipallam',
  'siruvalur',
  'kadasallur',
  'tn palayam',
  'thookanaickenpalayam',
  'hasanur',
  'dhimbam',
  'periyakodiveri',
  'punjai puliampatti',
  'pallagoundenpalayam',
];

function isErodePincode(pin: number): boolean {
  // Erode Urban & Suburbs
  if (pin >= 638001 && pin <= 638012) return true;
  // Perundurai, Chennimalai, Chithode area
  if (pin >= 638051 && pin <= 638060) return true;
  // Perundurai rural, Modakurichi
  if (pin >= 638101 && pin <= 638115 && pin !== 638106 && pin !== 638111) return true;
  // Kodumudi
  if (pin >= 638151 && pin <= 638154) return true;
  // Bhavani, Anthiyur, Appakudal
  if (pin >= 638301 && pin <= 638316) return true;
  // Gobichettipalayam, Sathyamangalam, Nambiyur (e.g. 638458, 638401, 638452)
  if (pin >= 638401 && pin <= 638476) return true;
  // Sathyamangalam forest / hills
  if (pin >= 638501 && pin <= 638506) return true;
  return false;
}

// ---------------------------------------------------------------------------
// ZONE 2: NEIGHBORING & KONGU REGION (₹50 – ₹60)
// ---------------------------------------------------------------------------
interface Zone2DistrictDef {
  name: string;
  rate: number;
  keywords: string[];
  pincodeCheck: (pin: number) => boolean;
}

const ZONE_2_DISTRICTS: Zone2DistrictDef[] = [
  {
    name: 'Coimbatore',
    rate: 50,
    keywords: [
      'coimbatore', 'cbe', 'pollachi', 'mettupalayam', 'sulur', 'annur', 'valparai',
      'kinathukadavu', 'madukkarai', 'thondamuthur', 'saravanampatti', 'peelamedu',
      'gandhipuram', 'singanallur', 'saibaba colony', 'kuniyamuthur', 'malumichampatti',
      'karamadai', 'perur', 'somanur', 'annur', 'eachanari'
    ],
    pincodeCheck: (pin) =>
      (pin >= 641001 && pin <= 641050) ||
      (pin >= 641101 && pin <= 641114) ||
      (pin >= 641201 && pin <= 641206) ||
      (pin >= 642001 && pin <= 642007) ||
      (pin >= 642109 && pin <= 642110) ||
      pin === 642120,
  },
  {
    name: 'Tiruppur',
    rate: 50,
    keywords: [
      'tiruppur', 'tirupur', 'avinashi', 'palladam', 'dharapuram', 'kangeyam',
      'udumalaipettai', 'udumalpet', 'madathukulam', 'uthukuli', 'vellakovil',
      'kundadam', 'mulanur', 'perumanallur', 'pongalur', 'mangalam'
    ],
    pincodeCheck: (pin) =>
      (pin >= 641601 && pin <= 641608) ||
      pin === 641652 || pin === 641654 || pin === 641658 ||
      (pin >= 641662 && pin <= 641670) ||
      pin === 638106 || pin === 638111 ||
      (pin >= 638656 && pin <= 638673) ||
      (pin >= 638701 && pin <= 638706) ||
      (pin >= 642126 && pin <= 642132) ||
      pin === 642153 || pin === 642154 ||
      (pin >= 642201 && pin <= 642207),
  },
  {
    name: 'Salem',
    rate: 50,
    keywords: [
      'salem', 'attur', 'mettur', 'omalur', 'sankagiri', 'edappadi', 'edapadi',
      'yercaud', 'vazhapadi', 'valapady', 'gangavalli', 'peddanaickenpalayam',
      'mecheri', 'jalakandapuram', 'tharamangalam', 'ayothiyapattinam'
    ],
    pincodeCheck: (pin) => pin >= 636001 && pin <= 636455 && !(pin >= 636701 && pin <= 636906),
  },
  {
    name: 'Namakkal',
    rate: 50,
    keywords: [
      'namakkal', 'tiruchengode', 'thiruchengode', 'rasipuram', 'paramathi velur',
      'komarapalayam', 'kumarapalayam', 'kolli hills', 'senthamangalam',
      'kabilarmalai', 'mohanur', 'erumapatti', 'mallasamudram', 'elachipalayam', 'pallipalayam'
    ],
    pincodeCheck: (pin) =>
      (pin >= 637001 && pin <= 637412) ||
      (pin >= 638006 && pin <= 638008) ||
      (pin >= 638181 && pin <= 638183),
  },
  {
    name: 'Karur',
    rate: 50,
    keywords: [
      'karur', 'kulithalai', 'aravakurichi', 'krishnarayapuram', 'mayanur',
      'pallapatti', 'thogamalai', 'punjai thottakurichi', 'velayuthampalayam'
    ],
    pincodeCheck: (pin) => pin >= 639001 && pin <= 639207,
  },
  {
    name: 'Dindigul',
    rate: 55,
    keywords: [
      'dindigul', 'palani', 'kodaikanal', 'oddanchatram', 'natham', 'nilakottai',
      'vedasandur', 'guziliamparai', 'chinnalapatti', 'ayyakudi', 'batlagundu'
    ],
    pincodeCheck: (pin) => pin >= 624001 && pin <= 624803,
  },
  {
    name: 'Dharmapuri',
    rate: 55,
    keywords: [
      'dharmapuri', 'harur', 'palacode', 'pennagaram', 'pappireddipatti',
      'karimangalam', 'nallampalli', 'marandahalli', 'morappur', 'hogenakkal'
    ],
    pincodeCheck: (pin) =>
      (pin >= 636701 && pin <= 636906) ||
      (pin >= 635201 && pin <= 635203) ||
      pin === 635205,
  },
  {
    name: 'Krishnagiri',
    rate: 60,
    keywords: [
      'krishnagiri', 'hosur', 'denkanikottai', 'pochampalli', 'uthangarai',
      'bargur', 'shoolagiri', 'kelamangalam', 'anchetti', 'rayakottai', 'kaveripattinam'
    ],
    pincodeCheck: (pin) =>
      (pin >= 635001 && pin <= 635124) ||
      (pin >= 635301 && pin <= 635307) ||
      pin === 635204 || pin === 635206,
  },
  {
    name: 'Nilgiris',
    rate: 60,
    keywords: [
      'nilgiris', 'the nilgiris', 'ooty', 'udhagamandalam', 'coonoor', 'kotagiri',
      'gudalur', 'wellington', 'kundah', 'pandalur', 'aruvankadu', 'devala', 'masinagudi'
    ],
    pincodeCheck: (pin) => pin >= 643001 && pin <= 643243,
  },
];

// ---------------------------------------------------------------------------
// ZONE 3: REST OF TAMIL NADU (28 DISTRICTS) -> ₹55 – ₹101
// ---------------------------------------------------------------------------
interface Zone3DistrictDef {
  name: string;
  rate: number;
  keywords: string[];
  pincodePrefixes?: string[];
  pincodeRange?: [number, number];
}

const ZONE_3_DISTRICTS: Zone3DistrictDef[] = [
  // Tier A: Adjacent Delta & Central Tamil Nadu (₹55 - ₹60)
  {
    name: 'Tiruchirappalli',
    rate: 55,
    keywords: ['tiruchirappalli', 'trichy', 'thiruverumbur', 'manapparai', 'musiri', 'lalgudi', 'srirangam'],
    pincodePrefixes: ['620'],
  },
  {
    name: 'Perambalur',
    rate: 55,
    keywords: ['perambalur', 'veppanthattai', 'kunnam', 'alathur'],
    pincodeRange: [621101, 621220],
  },
  {
    name: 'Ariyalur',
    rate: 55,
    keywords: ['ariyalur', 'udayarpalayam', 'sendurai', 'jayankondam'],
    pincodeRange: [621701, 621806],
  },
  {
    name: 'Theni',
    rate: 60,
    keywords: ['theni', 'periyakulam', 'bodinayakanur', 'bodi', 'uthamapalayam', 'cumbum', 'andipatti'],
    pincodeRange: [625512, 625605],
  },
  {
    name: 'Thanjavur',
    rate: 60,
    keywords: ['thanjavur', 'tanjore', 'kumbakonam', 'papanasam', 'pattukkottai', 'orathanadu', 'thiruvaiyaru'],
    pincodePrefixes: ['612', '613', '614'],
  },
  {
    name: 'Pudukkottai',
    rate: 60,
    keywords: ['pudukkottai', 'aranthangi', 'illuppur', 'alangudi', 'gandarvakottai', 'ponnamaravathi'],
    pincodeRange: [622001, 622515],
  },

  // Tier B: South Central & Coastal (₹65 - ₹75)
  {
    name: 'Madurai',
    rate: 65,
    keywords: ['madurai', 'melur', 'vadipatti', 'usilampatti', 'thirumangalam', 'peraiyur', 'sholavandan'],
    pincodePrefixes: ['625'],
  },
  {
    name: 'Sivaganga',
    rate: 65,
    keywords: ['sivaganga', 'karaikudi', 'devakottai', 'manamadurai', 'thiruppuvanam', 'singampunari'],
    pincodePrefixes: ['630'],
  },
  {
    name: 'Tiruvarur',
    rate: 65,
    keywords: ['tiruvarur', 'thiruvarur', 'mannargudi', 'nannilam', 'kudavasal', 'valangaiman'],
    pincodePrefixes: ['610'],
  },
  {
    name: 'Virudhunagar',
    rate: 70,
    keywords: ['virudhunagar', 'sivakasi', 'srivilliputhur', 'rajapalayam', 'aruppukkottai', 'sattur'],
    pincodePrefixes: ['626'],
  },
  {
    name: 'Mayiladuthurai',
    rate: 70,
    keywords: ['mayiladuthurai', 'sirkazhi', 'tharangambadi', 'kuthalam'],
    pincodePrefixes: ['609'],
  },
  {
    name: 'Nagapattinam',
    rate: 70,
    keywords: ['nagapattinam', 'velankanni', 'vedaranyam', 'kilvelur'],
    pincodePrefixes: ['611'],
  },
  {
    name: 'Cuddalore',
    rate: 70,
    keywords: ['cuddalore', 'chidambaram', 'panruti', 'vriddhachalam', 'neyveli', 'tittakudi', 'kurinjipadi'],
    pincodePrefixes: ['607', '608'],
  },
  {
    name: 'Kallakurichi',
    rate: 70,
    keywords: ['kallakurichi', 'sankarapuram', 'ulundurpet', 'thirukoilur', 'chinna salem'],
    pincodeRange: [606201, 606402],
  },
  {
    name: 'Ramanathapuram',
    rate: 75,
    keywords: ['ramanathapuram', 'ramnad', 'rameswaram', 'paramakudi', 'kamuthi', 'kilakarai', 'mudukulathur'],
    pincodePrefixes: ['623'],
  },
  {
    name: 'Viluppuram',
    rate: 75,
    keywords: ['viluppuram', 'villupuram', 'tindivanam', 'gingee', 'vanur', 'marakkanam'],
    pincodePrefixes: ['605'],
  },
  {
    name: 'Tiruvannamalai',
    rate: 75,
    keywords: ['tiruvannamalai', 'thiruvannamalai', 'arani', 'polur', 'chengappalli', 'vandavasi', 'cheyyar'],
    pincodeRange: [606601, 606908],
  },
  {
    name: 'Tirupathur',
    rate: 75,
    keywords: ['tirupathur', 'thirupathur', 'vaniyambadi', 'ambur', 'natrampalli'],
    pincodeRange: [635601, 635854],
  },

  // Tier C: Northern & North-Eastern Districts (₹80 - ₹85)
  {
    name: 'Vellore',
    rate: 80,
    keywords: ['vellore', 'katpadi', 'gudiyatham', 'anaicut', 'peranambut'],
    pincodePrefixes: ['632'],
  },
  {
    name: 'Ranipet',
    rate: 80,
    keywords: ['ranipet', 'arrakkonam', 'arakkonam', 'walajah', 'arcot', 'sholinghur', 'nemili'],
    pincodePrefixes: ['631'],
  },
  {
    name: 'Chengalpattu',
    rate: 80,
    keywords: ['chengalpattu', 'tambaram', 'chromepet', 'pallavaram', 'vandalur', 'kelambakkam', 'mamallapuram', 'mahabalipuram', 'madurantakam'],
    pincodePrefixes: ['603'],
  },
  {
    name: 'Kanchipuram',
    rate: 80,
    keywords: ['kanchipuram', 'kancheepuram', 'sriperumbudur', 'walajabad', 'uthiramerur'],
    pincodeRange: [631501, 631606],
  },
  {
    name: 'Tiruvallur',
    rate: 85,
    keywords: ['tiruvallur', 'thiruvallur', 'avadi', 'ponnamallee', 'poonamallee', 'gummidipoondi', 'ponneri', 'ambattur'],
    pincodePrefixes: ['601', '602'],
  },
  {
    name: 'Chennai',
    rate: 85,
    keywords: ['chennai', 'madras', 'anna nagar', 't nagar', 'adyar', 'velachery', 'mylapore', 'guindy', 'nungambakkam', 'kilpauk'],
    pincodePrefixes: ['600'],
  },

  // Tier D: Deep Southern Districts (₹85 - ₹101)
  {
    name: 'Thoothukudi',
    rate: 85,
    keywords: ['thoothukudi', 'tuticorin', 'kovilpatti', 'tiruchendur', 'srivaikuntam', 'kayalpattinam', 'ettiayapuram'],
    pincodePrefixes: ['628'],
  },
  {
    name: 'Tenkasi',
    rate: 85,
    keywords: ['tenkasi', 'courtallam', 'kourtallam', 'sankarankovil', 'kadayanallur', 'puliyangudi', 'alangulam', 'shenkottai'],
    pincodeRange: [627751, 627907],
  },
  {
    name: 'Tirunelveli',
    rate: 90,
    keywords: ['tirunelveli', 'nellai', 'palayamkottai', 'ambasamudram', 'cheranmahadevi', 'radhapuram', 'nanguneri', 'kalakkad'],
    pincodePrefixes: ['627'],
  },
  {
    name: 'Kanyakumari',
    rate: 101, // Exact user-specified upper bound for far-southern tip
    keywords: ['kanyakumari', 'nagercoil', 'marthandam', 'colachel', 'thuckalay', 'kuzhithurai', 'padmanabhapuram', 'agastheeswaram'],
    pincodePrefixes: ['629'],
  },
];

/**
 * Determines the shipping zone, exact courier charge, and geographic classification
 * based on delivery destination.
 */
export function determineShippingZone(
  address?: DeliveryAddressInput | null,
  subtotalPaise = 0
): ShippingZoneDetails {
  const isFree = subtotalPaise > 0 && subtotalPaise >= FREE_SHIPPING_THRESHOLD_PAISE;

  // Normalize all input text for robust matching
  const rawPin = String(address?.pincode || '').replace(/\D/g, '').slice(0, 6);
  const pinNum = parseInt(rawPin, 10);
  const pinValid = rawPin.length === 6 && !isNaN(pinNum);

  const cityNorm = String(address?.city || '').toLowerCase().trim();
  const stateNorm = String(address?.state || '').toLowerCase().trim();

  // -------------------------------------------------------------------------
  // 0. EMPTY / INCOMPLETE ADDRESS CHECK: If no valid location details entered yet
  // -------------------------------------------------------------------------
  const hasLocationDetails = pinValid || Boolean(cityNorm) || Boolean(stateNorm);
  if (!hasLocationDetails) {
    const defaultPendingFee = isFree ? 0 : 0;
    return {
      zoneKey: 'pending',
      zoneName: 'Delivery',
      district: '',
      baseRateRupees: 0,
      baseRatePaise: 0,
      shippingFeeRupees: defaultPendingFee,
      shippingFeePaise: defaultPendingFee * PAISE_PER_RUPEE,
      isFreeShipping: isFree,
      explanation: isFree
        ? 'Complimentary Delivery (Privilege Circle Order above ₹1,999)'
        : 'Enter delivery address to calculate shipping',
    };
  }

  // -------------------------------------------------------------------------
  // 1. PINCODE IS HIGHEST PRIORITY TRUTH (Deterministic 6-digit Indian PIN)
  // -------------------------------------------------------------------------
  if (pinValid) {
    // 1A. Is it Erode District Pincode?
    if (isErodePincode(pinNum)) {
      const rateRupees = 40;
      const ratePaise = rateRupees * PAISE_PER_RUPEE;
      return {
        zoneKey: 'zone-1',
        zoneName: 'Zone 1: Local (Erode)',
        district: 'Erode',
        baseRateRupees: rateRupees,
        baseRatePaise: ratePaise,
        shippingFeeRupees: isFree ? 0 : rateRupees,
        shippingFeePaise: isFree ? 0 : ratePaise,
        isFreeShipping: isFree,
        explanation: 'Local Intra-District Delivery from Erode Atelier',
      };
    }

    // 1B. Is it Zone 2 (Kongu neighboring districts) Pincode?
    for (const z2 of ZONE_2_DISTRICTS) {
      if (z2.pincodeCheck(pinNum)) {
        const rateRupees = z2.rate;
        const ratePaise = rateRupees * PAISE_PER_RUPEE;
        return {
          zoneKey: 'zone-2',
          zoneName: `Zone 2: Kongu Region (${z2.name})`,
          district: z2.name,
          baseRateRupees: rateRupees,
          baseRatePaise: ratePaise,
          shippingFeeRupees: isFree ? 0 : rateRupees,
          shippingFeePaise: isFree ? 0 : ratePaise,
          isFreeShipping: isFree,
          explanation: `Neighboring Kongu Regional Courier to ${z2.name}`,
        };
      }
    }

    // 1C. Is it Zone 3 (Rest of Tamil Nadu) Pincode?
    for (const z3 of ZONE_3_DISTRICTS) {
      const pinPrefixMatch = z3.pincodePrefixes && z3.pincodePrefixes.some((pfx) => rawPin.startsWith(pfx));
      const pinRangeMatch = z3.pincodeRange && pinNum >= z3.pincodeRange[0] && pinNum <= z3.pincodeRange[1];

      if (pinPrefixMatch || pinRangeMatch) {
        const rateRupees = z3.rate;
        const ratePaise = rateRupees * PAISE_PER_RUPEE;
        return {
          zoneKey: 'zone-3',
          zoneName: `Zone 3: Rest of Tamil Nadu (${z3.name})`,
          district: z3.name,
          baseRateRupees: rateRupees,
          baseRatePaise: ratePaise,
          shippingFeeRupees: isFree ? 0 : rateRupees,
          shippingFeePaise: isFree ? 0 : ratePaise,
          isFreeShipping: isFree,
          explanation: `Intra-State Express Courier to ${z3.name}`,
        };
      }
    }

    // 1D. Any other Tamil Nadu Pincode (starts with 60, 61, 62, 63, 64)
    if (
      rawPin.startsWith('60') ||
      rawPin.startsWith('61') ||
      rawPin.startsWith('62') ||
      rawPin.startsWith('63') ||
      rawPin.startsWith('64')
    ) {
      const rateRupees = 75;
      const ratePaise = rateRupees * PAISE_PER_RUPEE;
      return {
        zoneKey: 'zone-3',
        zoneName: 'Zone 3: Rest of Tamil Nadu',
        district: cityNorm ? address?.city || 'Tamil Nadu' : 'Tamil Nadu',
        baseRateRupees: rateRupees,
        baseRatePaise: ratePaise,
        shippingFeeRupees: isFree ? 0 : rateRupees,
        shippingFeePaise: isFree ? 0 : ratePaise,
        isFreeShipping: isFree,
        explanation: 'Intra-State Express Delivery across Tamil Nadu',
      };
    }

    // 1E. Valid 6-digit Indian Pincode outside Tamil Nadu (Pan-India)
    const panIndiaRate = 149;
    return {
      zoneKey: 'rest-of-india',
      zoneName: 'Pan-India Express Delivery',
      district: address?.city ? String(address.city) : 'National',
      baseRateRupees: panIndiaRate,
      baseRatePaise: panIndiaRate * PAISE_PER_RUPEE,
      shippingFeeRupees: isFree ? 0 : panIndiaRate,
      shippingFeePaise: isFree ? 0 : panIndiaRate * PAISE_PER_RUPEE,
      isFreeShipping: isFree,
      explanation: 'Standard Air & Surface Express across India',
    };
  }

  // -------------------------------------------------------------------------
  // 2. CITY / DISTRICT KEYWORD CHECK (If PIN code is not full 6-digits yet)
  // -------------------------------------------------------------------------
  // 2A. Check Zone 3 major cities (e.g. Chennai, Madurai, Trichy, Vellore)
  for (const z3 of ZONE_3_DISTRICTS) {
    if (z3.keywords.some((kw) => cityNorm === kw || cityNorm.includes(kw))) {
      const rateRupees = z3.rate;
      const ratePaise = rateRupees * PAISE_PER_RUPEE;
      return {
        zoneKey: 'zone-3',
        zoneName: `Zone 3: Rest of Tamil Nadu (${z3.name})`,
        district: z3.name,
        baseRateRupees: rateRupees,
        baseRatePaise: ratePaise,
        shippingFeeRupees: isFree ? 0 : rateRupees,
        shippingFeePaise: isFree ? 0 : ratePaise,
        isFreeShipping: isFree,
        explanation: `Intra-State Express Courier to ${z3.name}`,
      };
    }
  }

  // 2B. Check Zone 2 (Kongu neighboring cities)
  for (const z2 of ZONE_2_DISTRICTS) {
    if (z2.keywords.some((kw) => cityNorm === kw || cityNorm.includes(kw))) {
      const rateRupees = z2.rate;
      const ratePaise = rateRupees * PAISE_PER_RUPEE;
      return {
        zoneKey: 'zone-2',
        zoneName: `Zone 2: Kongu Region (${z2.name})`,
        district: z2.name,
        baseRateRupees: rateRupees,
        baseRatePaise: ratePaise,
        shippingFeeRupees: isFree ? 0 : rateRupees,
        shippingFeePaise: isFree ? 0 : ratePaise,
        isFreeShipping: isFree,
        explanation: `Neighboring Kongu Regional Courier to ${z2.name}`,
      };
    }
  }

  // 2C. Check Zone 1 (Erode cities / localities)
  if (ERODE_LOCALITIES.some((kw) => cityNorm === kw || cityNorm.includes(kw))) {
    const rateRupees = 40;
    const ratePaise = rateRupees * PAISE_PER_RUPEE;
    return {
      zoneKey: 'zone-1',
      zoneName: 'Zone 1: Local (Erode)',
      district: 'Erode',
      baseRateRupees: rateRupees,
      baseRatePaise: ratePaise,
      shippingFeeRupees: isFree ? 0 : rateRupees,
      shippingFeePaise: isFree ? 0 : ratePaise,
      isFreeShipping: isFree,
      explanation: 'Local Intra-District Delivery from Erode Atelier',
    };
  }

  // 2D. Fallback for Tamil Nadu state keyword
  const isTamilNaduState =
    stateNorm.includes('tamil') ||
    stateNorm.includes('tamilnadu') ||
    stateNorm.includes('tn');

  if (isTamilNaduState) {
    const rateRupees = 75;
    const ratePaise = rateRupees * PAISE_PER_RUPEE;
    return {
      zoneKey: 'zone-3',
      zoneName: 'Zone 3: Rest of Tamil Nadu',
      district: address?.city ? String(address.city) : 'Tamil Nadu',
      baseRateRupees: rateRupees,
      baseRatePaise: ratePaise,
      shippingFeeRupees: isFree ? 0 : rateRupees,
      shippingFeePaise: isFree ? 0 : ratePaise,
      isFreeShipping: isFree,
      explanation: 'Intra-State Express Delivery across Tamil Nadu',
    };
  }

  // -------------------------------------------------------------------------
  // 3. REST OF INDIA (PAN-INDIA SHIPPING) -> ₹149 (Only when valid destination is provided)
  // -------------------------------------------------------------------------
  if (!pinValid && !cityNorm && !stateNorm) {
    return {
      zoneKey: 'pending',
      zoneName: 'Delivery',
      district: '',
      baseRateRupees: 0,
      baseRatePaise: 0,
      shippingFeeRupees: 0,
      shippingFeePaise: 0,
      isFreeShipping: isFree,
      explanation: isFree
        ? 'Complimentary Delivery (Privilege Circle Order above ₹1,999)'
        : 'Enter delivery address to calculate shipping',
    };
  }

  const defaultRateRupees = 149;
  const defaultRatePaise = defaultRateRupees * PAISE_PER_RUPEE;
  return {
    zoneKey: 'rest-of-india',
    zoneName: 'Pan-India Express Delivery',
    district: address?.city ? String(address.city) : 'National',
    baseRateRupees: defaultRateRupees,
    baseRatePaise: defaultRatePaise,
    shippingFeeRupees: isFree ? 0 : defaultRateRupees,
    shippingFeePaise: isFree ? 0 : defaultRatePaise,
    isFreeShipping: isFree,
    explanation: 'Standard Air & Surface Express across India',
  };
}

/**
 * Convenience function to get the shipping fee in integer Paise given subtotal and destination.
 */
export function calculateZonalShippingFeePaise(
  subtotalPaise: number,
  address?: DeliveryAddressInput | null
): number {
  const result = determineShippingZone(address, subtotalPaise);
  return result.shippingFeePaise;
}
