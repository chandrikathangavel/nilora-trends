export type ProductCategory = 'co-ord-sets' | 'kurtas' | 'sarees';

export type StandardProductOccasion = 
  | 'Daily Wear' 
  | 'Office Wear' 
  | 'Ethnic & Festive' 
  | 'Occasion Wear' 
  | 'College & Casual';

export type ProductOccasion = StandardProductOccasion | (string & {});

export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL' | 'Free Size';

export interface ProductInventorySize {
  size: ProductSize;
  inStock: boolean;
  stockCount: number;
}

export interface ProductColor {
  name: string;
  hex: string;
  image?: string;
  closeUpImage?: string;
  images?: string[];
  sizes?: ProductInventorySize[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  category: ProductCategory;
  categoryLabel: string;
  occasion: ProductOccasion;
  price: number;
  originalPrice: number;
  discountPercent?: number;
  fabric: string;
  description: string;
  features: string[];
  careInstructions: string[];
  images: string[];
  sizes: ProductInventorySize[];
  colors: ProductColor[];
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  rating: number;
  reviewCount: number;
  sku: string;
  inStock: boolean;
  createdAt?: string;
  updatedAt?: number | string;
}

export interface CartItem {
  id: string;
  product: Product;
  selectedSize: ProductSize;
  selectedColor: string;
  selectedColorImage?: string;
  quantity: number;
}

export interface Review {
  id: string;
  authorName: string;
  city: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  verifiedBuyer: boolean;
  purchasedItem?: string;
  avatarUrl?: string;
}

export interface OrderItem {
  product: Product;
  size: ProductSize;
  color: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: 'Processing' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  paymentMethod: string;
}

export interface FestivalOffer {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  couponCode: string;
  discountPercentage: number;
  targetCategory: 'all' | ProductCategory;
  bannerImage?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export interface StoreCoupon {
  code: string;
  discount: string;
  discountValue: number;
  discountType: 'percent' | 'flat';
  minOrderValue: number;
  usageCount: number;
  status: 'Active' | 'Expired' | 'Paused';
}

export interface SearchPriceRangeTier {
  key: string;
  label: string;
  min: number;
  max: number;
}

export interface StoreSettings {
  storeName: string;
  announcementMessages: string[];
  freeShippingThreshold: number;
  supportPhone: string;
  supportEmail: string;
  festivalMode: boolean;
  searchPriceRanges?: SearchPriceRangeTier[];
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  privilegeTier?: string;
  joinedDate?: string;
  avatarUrl?: string;
}

export interface CustomerInquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  createdAt: string;
  read: boolean;
  replied?: boolean;
}

