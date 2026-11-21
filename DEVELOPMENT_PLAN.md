# NILORA TRENDS — Full-Stack Development Plan & Architecture Blueprint

> **Brand Tagline:** *"Your Style. Your Statement."*  
> **Brand Identity:** Premium, feminine, minimal Indian clothing boutique specializing in **Co-ord Sets**, **Kurtas**, and **Sarees**.

---

## 1. System Architecture Overview

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS + Lucide Icons    |
|  - Responsive Mobile-first UX (Ivory #F8F5F0, Espresso #392820, Gold #B79A72)     |
|  - Client Contexts: CartContext (localStorage) & WishlistContext                  |
|  - Real-time Product Search Modal & Slide-over Boutique Bag Drawer               |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                             SERVER LAYER (Next.js)                                |
|  - Server Components (SSR & SSG for SEO and lightning-fast LCP)                   |
|  - Server Actions & API Route Handlers (/api/checkout, /api/auth, /api/webhooks)  |
|  - Input Validation (Zod schemas for checkout, addresses, and product listings)   |
+-----------------------------------------------------------------------------------+
                                         |
                     +-------------------+-------------------+
                     |                                       |
                     v                                       v
+-------------------------------------+   +-----------------------------------------+
|        DATABASE & STORAGE           |   |            PAYMENT GATEWAY              |
|        (Supabase PostgreSQL)        |   |       (Razorpay - Phase 2 Ready)        |
|  - Tables with Row Level Security   |   |  - Server-side Order Creation (₹ INR)   |
|  - Supabase Auth (OTP / Password)   |   |  - Razorpay Checkout Modal              |
|  - Supabase Storage (Photo buckets) |   |  - Signature Verification & Webhooks    |
+-------------------------------------+   +-----------------------------------------+
```

---

## 2. Design System & Palette Guidelines

The design system is strictly maintained across all current and future development phases.

| Element | Color Value | Purpose |
| :--- | :--- | :--- |
| **Ivory** | `#F8F5F0` | Primary app canvas background, soft luxury contrast |
| **Champagne Beige** | `#E8DCCB` | Secondary cards, pill filters, subtle borders, tags |
| **Deep Espresso Brown** | `#392820` | Primary brand typography, CTA buttons, dark luxury footer |
| **Muted Gold / Rose Gold** | `#B79A72` | Brand crest accents, star ratings, active highlights, badges |
| **Pure White** | `#FFFFFF` | Card surfaces, modals, popovers |

### Typography Stack
- **Editorial Serif:** `Playfair Display`, `Cormorant Garamond`, Georgia, serif (Headlines, product titles, brand wordmark)
- **Modern Sans:** `Montserrat`, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif (Body copy, prices, tags, buttons)

---

## 3. Database Schema Blueprint (Supabase PostgreSQL)

```sql
-- 1. Profiles Table (Extends Supabase Auth users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  privilege_tier TEXT DEFAULT 'Nilora Privilege Circle',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Customer Delivery Addresses
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  address_type TEXT DEFAULT 'Home',
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  street_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Rajasthan',
  pincode TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Product Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- 'co-ord-sets', 'kurtas', 'sarees'
  name TEXT NOT NULL,
  description TEXT,
  banner_url TEXT
);

-- 4. Products Table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subtitle TEXT,
  category_slug TEXT REFERENCES public.categories(slug),
  occasion TEXT NOT NULL, -- 'Daily Wear', 'Office Wear', 'Ethnic & Festive', 'Occasion Wear'
  price NUMERIC(10, 2) NOT NULL,
  original_price NUMERIC(10, 2),
  fabric TEXT NOT NULL,
  description TEXT NOT NULL,
  features JSONB DEFAULT '[]'::JSONB,
  care_instructions JSONB DEFAULT '[]'::JSONB,
  images JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_new_arrival BOOLEAN DEFAULT FALSE,
  is_best_seller BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  rating NUMERIC(3, 2) DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  sku TEXT UNIQUE NOT NULL,
  in_stock BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Product Inventory (Size & Color Matrix)
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT NOT NULL, -- 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'
  color_name TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  stock_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product_id, size, color_name)
);

-- 6. Orders Table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Processing', -- 'Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'
  subtotal NUMERIC(10, 2) NOT NULL,
  shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL,
  shipping_address JSONB NOT NULL,
  payment_method TEXT NOT NULL, -- 'razorpay', 'cod'
  payment_id TEXT,
  razorpay_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Order Line Items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL
);

-- 8. Customer Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  city TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  comment TEXT NOT NULL,
  verified_buyer BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Discount Vouchers
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL, -- 'percentage', 'fixed'
  discount_value NUMERIC(10, 2) NOT NULL,
  min_order_value NUMERIC(10, 2) DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);
```

---

## 4. Security Architecture & Rules

1. **Row Level Security (RLS):** All tables in Supabase have RLS enabled. Customers can only read/update their own profile, orders, and addresses.
2. **Never Expose Secret Keys:** Client-side bundles only read `NEXT_PUBLIC_*` environment variables. Secret API keys (`SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`) are strictly kept on the server.
3. **No Hardcoded Credentials:** Real auth utilizes Supabase OTP / Magic link workflows.
4. **No Fake Payment Confirmations:** Orders during Phase 1 are explicitly marked as *Demo Mode* without spoofing banking or live Razorpay status.
5. **Input Sanitation:** All server actions and API route handlers sanitize inputs and validate payload schemas.

---

## 5. Development Phases

### Phase 1: Foundations & Polished Storefront (CURRENT)
- [x] Next.js App Router initialization with TypeScript & Tailwind CSS
- [x] Design token system matching Nilora Trends palette (`#F8F5F0`, `#E8DCCB`, `#392820`, `#B79A72`)
- [x] Official NT botanical crest logo integration
- [x] Shared Site Layout (Announcement bar, sticky responsive navbar, luxury footer)
- [x] Global CartContext & WishlistContext with localStorage persistence
- [x] Slide-over Cart Drawer with free shipping calculator (threshold: ₹1,999)
- [x] Real-time Product Search Modal
- [x] High-fashion Hero Editorial with 3 specialization shortcuts
- [x] Curated Tabbed Product Grid for Co-ord Sets, Kurtas, Sarees
- [x] Artisanal Craftsmanship & Slow Fashion Atelier section
- [x] Customer Diaries & verified reviews section
- [x] Product Listing Page (`/products`) with Category, Occasion, Price filters, and Sort
- [x] Dynamic Product Details Page (`/products/[slug]`) with image gallery, size selector, fabric care
- [x] Category Pages (`/category/co-ord-sets`, `/category/kurtas`, `/category/sarees`)
- [x] Saved Wishlist view (`/wishlist`)
- [x] Dedicated Cart & Voucher management view (`/cart`)
- [x] Checkout experience preview (`/checkout`) with delivery address collection
- [x] Order history & tracking timeline (`/orders`)
- [x] Customer Profile & saved address management (`/profile`)
- [x] Boutique Heritage Story (`/about`)
- [x] Customer Concierge & Styling appointment form (`/contact`)
- [x] Interactive Protected Admin Dashboard (`/admin`)

### Phase 2: Live Supabase Database & Auth Integration
- [ ] Connect production Supabase project with PostgreSQL schema
- [ ] Implement Supabase Auth (Email OTP and Google OAuth)
- [ ] Move demo products to Supabase PostgreSQL table
- [ ] Connect Supabase Storage bucket (`nilora-product-media`) for admin photo uploads

### Phase 3: Razorpay Payment Gateway & Order Automation
- [ ] Server action for Razorpay Order creation in INR
- [ ] Razorpay checkout modal integration
- [ ] Webhook signature verification endpoint (`/api/webhooks/razorpay`)
- [ ] Automated SMS & Email dispatch with tracking numbers via WhatsApp / SendGrid

### Phase 4: Vercel Deployment & SEO Optimization
- [ ] Automated CI/CD pipeline on Vercel
- [ ] OpenGraph image generation & structured JSON-LD Schema for rich Google Shopping snippets
- [ ] Performance caching and static generation for fast loading times across India
