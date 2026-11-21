# NILORA TRENDS — Luxury Indian Clothing Boutique

<div align="center">
  <img src="public/nilora-logo.jpg" alt="Nilora Trends Crest" width="300" style="border-radius: 12px; margin-bottom: 12px;" />
  <p><strong>"Your Style. Your Statement."</strong></p>
  <p><em>An Indian online clothing boutique specializing in contemporary Co-ord Sets, royal Kurtas, and artisanal Sarees.</em></p>
</div>

---

## 💎 About The Brand

**Nilora Trends** is an Indian online clothing boutique celebrating women's individuality across everyday wear, office chic, college styling, festive occasions, and wedding guest looks.

### Signature Specializations
1. **Co-ord Sets:** Impeccably tailored two-piece sets in organic linens, fluid modal blends, and lustrous crepe silks.
2. **Kurtas & Anarkalis:** 24-kali flared Chanderi Anarkalis, Gota Patti work, and authentic Lucknowi Chikankari with soft mulmul linings.
3. **Artisanal Sarees:** Metallic tissue organzas, certified handwoven Banarasi Katans, and fluid modal satins.

---

## 🎨 Luxury Brand Design System

Designed with a feminine, minimal, modern aesthetic:

- **Ivory (`#F8F5F0`):** Soft, warm boutique backdrop
- **Champagne Beige (`#E8DCCB`):** Secondary cards, borders, badge backgrounds
- **Deep Espresso Brown (`#392820`):** Primary editorial typography, dark luxury footer, primary CTAs
- **Muted Gold (`#B79A72`):** Brand logo crest accents, ratings, active links, luxury highlights
- **Pure White (`#FFFFFF`):** High-contrast product cards and dialog panels

---

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **UI Library:** React 19, Tailwind CSS v4, Lucide React Icons
- **Database Architecture:** Supabase PostgreSQL with Row Level Security (RLS)
- **Authentication:** Supabase Auth (OTP / Magic Links ready)
- **Storage:** Supabase Storage for product photography
- **Payment Processing:** Razorpay (UPI, NetBanking, Cards) prepared for Phase 2
- **Deployment:** Vercel

---

## 📁 Project Structure

```
Nilora_trends/
├── public/
│   └── nilora-logo.jpg           # Official brand logo asset
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Global layout with Providers, Header & Footer
│   │   ├── page.tsx              # Polished Editorial Boutique Homepage
│   │   ├── globals.css           # Design tokens, fonts, and luxury styles
│   │   ├── products/
│   │   │   ├── page.tsx          # All Products with Filter & Sort
│   │   │   └── [slug]/
│   │   │       └── page.tsx      # Dynamic Product Details with gallery
│   │   ├── category/
│   │   │   └── [category]/
│   │   │       └── page.tsx      # Category pages (co-ord-sets, kurtas, sarees)
│   │   ├── cart/
│   │   │   └── page.tsx          # Full Shopping Bag with voucher logic
│   │   ├── wishlist/
│   │   │   └── page.tsx          # Customer Wishlist view
│   │   ├── checkout/
│   │   │   └── page.tsx          # Multi-step boutique checkout (Demo Mode)
│   │   ├── orders/
│   │   │   └── page.tsx          # Order tracking & fulfillment status
│   │   ├── profile/
│   │   │   └── page.tsx          # Customer profile & delivery addresses
│   │   ├── about/
│   │   │   └── page.tsx          # Atelier story & slow fashion heritage
│   │   ├── contact/
│   │   │   └── page.tsx          # Concierge desk, styling inquiries, FAQs
│   │   └── admin/
│   │       └── page.tsx          # Protected boutique admin management portal
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx        # Sticky header with search, cart, wishlist
│   │   │   ├── AnnouncementBar.tsx # Dynamic luxury ticker
│   │   │   ├── Footer.tsx        # Deep espresso brand footer
│   │   │   ├── MobileMenu.tsx    # Responsive mobile drawer
│   │   │   ├── SearchModal.tsx   # Live instant product search modal
│   │   │   └── CartDrawer.tsx    # Slide-over bag with free shipping bar
│   │   ├── home/
│   │   │   ├── HeroBanner.tsx    # Editorial hero banner with logo crest
│   │   │   ├── CategoryShowcase.tsx # 3 Specialization visual cards
│   │   │   ├── CuratedTabs.tsx   # Tabbed interactive product grid
│   │   │   ├── ProductCard.tsx   # Reusable boutique product card
│   │   │   ├── CraftsmanshipSpotlight.tsx # Atelier slow fashion story
│   │   │   └── CustomerReviews.tsx # Customer testimonials & ratings
│   │   └── ui/
│   │       └── BrandLogo.tsx     # Official brand logo component
│   ├── context/
│   │   ├── CartContext.tsx       # Shopping bag state with localStorage
│   │   └── WishlistContext.tsx   # Saved wishlist state with localStorage
│   ├── data/
│   │   └── demoProducts.ts       # Realistic demo product catalog
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client setup
│   │   └── utils.ts              # Price formatting (INR ₹) and clsx helper
│   └── types/
│       └── index.ts              # Comprehensive TypeScript interfaces
├── .env.example                  # Environment configuration template
├── DEVELOPMENT_PLAN.md           # Architecture blueprint & SQL schema
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v20 or newer)
- npm or pnpm

### 2. Environment Configuration
Copy the sample environment file:
```bash
cp .env.example .env.local
```

### 3. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view Nilora Trends.

### 4. Build for Production
```bash
npm run build
```

---

## 🔒 Security & Data Integrity
- No secret keys are exposed to the client bundle.
- No hardcoded customer accounts or credentials.
- Orders in Phase 1 are explicitly marked as Demo Mode with zero fake payment confirmations.
- Strict Row Level Security (RLS) SQL policies documented in `DEVELOPMENT_PLAN.md`.
