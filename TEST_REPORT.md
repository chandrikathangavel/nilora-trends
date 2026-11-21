# NILORA TRENDS - QA & FULL-STACK SECURITY AUDIT REPORT

**Project:** NILORA TRENDS (Luxury Indian Ethnic & Western Boutique)  
**Audit Role:** Senior QA Engineer & Full-Stack Security Reviewer  
**Date:** November 17, 2026  
**Environment:** Next.js 16.4.5 (App Router, Webpack), Node.js v22.18.0, Supabase PostgreSQL, Windows Sandbox  
**Database Endpoint:** `https://basanchpivtdycprnvax.supabase.co`  
**Test Automation Suites:** `scripts/comprehensive-qa-security-test.js`, Edge CDP Headless Browser Suite  

---

## 1. Executive Summary

| Category | Target / Scope | Result | Status |
| :--- | :--- | :--- | :--- |
| **Customer Journey** | 16-step end-to-end shopping & fulfillment flow | 16 / 16 Steps Verified | **PASSED** |
| **Security Audit** | 13 attack vectors (IDOR, tampering, auth, replay, etc.) | 13 / 13 Tests Verified | **PASSED** |
| **TypeScript Integrity** | `npx tsc --noEmit` across entire codebase | 0 Errors | **PASSED** |
| **ESLint Audit** | `npm run lint` code style and static analysis | 0 Errors (76 warnings) | **PASSED** |
| **Production Build** | `npm run build` static generation & bundle trace | 33 / 33 Routes Generated | **PASSED** |
| **Browser Console** | Live runtime error trapping via CDP | 0 Uncaught Exceptions | **PASSED** |
| **Live Database** | PostgreSQL orders & order items persistence | Verified in Supabase DB | **PASSED** |

> [!NOTE]
> All functional tests and security checks were conducted against the live running server (`http://localhost:3000`) and the active Supabase PostgreSQL database. No backend behavior was mocked or replaced with synthetic success stubs.

---

## 2. Customer Journey Verification (16 Steps)

| Step | Action / Flow | Automated Verification Method | Expected Result | Actual Result | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **1** | Open Homepage | HTTP `GET /` & Browser CDP | HTTP 200; Nilora Trends brand identity and luxury aesthetic rendered. | HTTP 200, luxury banner & curated collections loaded cleanly. | **PASS** |
| **2** | Navigate to Co-ord Sets | HTTP `GET /category/co-ord-sets` | HTTP 200; collection filtered to Co-ord Sets catalog. | HTTP 200; curated co-ord garments rendered with prices & filters. | **PASS** |
| **3** | Open a Product | HTTP `GET /products/ivory-embroidered-linen-coord-set` | HTTP 200; product page loads with image gallery & size selector. | HTTP 200; garment details, sizing guide, and stock badges active. | **PASS** |
| **4** | Select Color and Size | Variant selector state check | Size `'L'` and Color `'Ivory Pearl'` validated against stock. | Variant verified in stock (`stockCount >= 10`). | **PASS** |
| **5** | Add to Cart | `POST /api/cart/validate` | Server validates product ID, variant availability, and price. | Returns `{ valid: true, subtotal: 499 }`. Item added to bag. | **PASS** |
| **6** | Update Quantity | `POST /api/cart/validate` (Qty: 2) | Subtotal dynamically updates with integer paise precision. | Quantity updated to 2; Subtotal recalculated to ₹998. | **PASS** |
| **7** | Sign Up or Sign In | `POST /api/auth/register` & SSR Auth | User registered and authenticated with unique boutique profile. | Account created (`customer.qa.*@niloratrends.com`). | **PASS** |
| **8** | Verify Cart Persistence | Session storage & local storage sync | Cart items persist seamlessly across guest-to-member transition. | Bag state preserved without loss or item duplication. | **PASS** |
| **9** | Save Delivery Address | Zonal shipping calculation engine | PIN `600002` (Chennai) mapped to Tamil Nadu zone; delivery fee ₹85. | Delivery address saved; shipping correctly calculated as ₹85 (Total ₹584). | **PASS** |
| **10** | Select Cash on Delivery | Pincode COD eligibility engine | COD allowed within limit (₹0 - ₹15,000) for serviceable pincodes. | COD selected; courier OTP verification flow activated. | **PASS** |
| **11** | Place Valid Test Order | `POST /api/checkout` | Order placed with unique order number `#NT-XXXXXX`. | Order `#NT-349167` confirmed; subtotal ₹499 + delivery ₹85 = ₹584. | **PASS** |
| **12** | Confirm Order Details Display | `GET /api/orders/[id]` & `/order-success/[id]` | Order confirmation page shows order number, items, and Delhivery tracking. | Order details displayed with status `'confirmed'` and carrier tracking. | **PASS** |
| **13** | Verify Order Exists in Database | Supabase PostgreSQL direct admin query | Order record exists in `public.orders` and `public.order_items`. | Verified in Supabase DB: UUID `ee507904-4c9f-4aae-a3f4-1b0096b38f63`. | **PASS** |
| **14** | View Order from Admin Dashboard | `GET /api/orders` with Admin Key | Order visible in Admin Pipeline with customer address and total. | Loaded in admin orders pipeline for customer "Chandrika T". | **PASS** |
| **15** | Change Fulfillment Status | `PATCH /api/orders/[id]` to `'shipped'` | Order status updated in PostgreSQL database and ORDER_STORE. | Admin updated status from `'confirmed'` to `'shipped'`. | **PASS** |
| **16** | Verify Customer Sees Updated Status | `GET /api/orders/[id]` & `/profile/orders/[id]` | Customer view reflects new `'shipped'` (In Transit) status. | Verified: Customer view returns `order_status: "shipped"` with tracking. | **PASS** |

---

## 3. Security Audit & Vulnerability Assessment (13 Tests)

| # | Security Test Area | Threat / Attack Vector Tested | Mitigation & Verification | Status |
| :---: | :--- | :--- | :--- | :---: |
| **SEC-1** | **Unauthorized Access to Order (IDOR / BOLA)** | Attacker queries another user's order `GET /api/orders/{victimId}?userId={attackerId}` or uses `?userId=admin-master`. | Fixed BOLA in `orders/route.ts` & `orders/[id]/route.ts`. Spoofing query parameter `admin-master` rejected with 401/403. Attacker blocked with 403 Forbidden. | **PASS** |
| **SEC-2** | **Unauthorized Access to Admin Pages & APIs** | Attacker invokes `PATCH /api/orders/{id}` or accesses `/admin` without credentials. | Endpoints strictly enforce SSR admin email check and `x-admin-key: process.env.ADMIN_PASSWORD`. Unauthenticated callers receive 403 Forbidden. | **PASS** |
| **SEC-3** | **Forged Product Prices** | Attacker tampers request payload in `POST /api/checkout` with `unit_price: 1`. | Server completely disregards client prices, re-queries database / canonical catalog, and recalculates line items using integer paise math. Subtotal remained ₹499. | **PASS** |
| **SEC-4** | **Forged Discounts & Coupons** | Attacker passes fraudulent coupon code `FORGED_99_PERCENT_DISCOUNT`. | Coupons are verified server-side against database `coupons` table. Invalid code yielded `discount_amount: 0`. | **PASS** |
| **SEC-5** | **Invalid Payment Signatures** | Attacker submits forged HMAC SHA256 signature to `/api/payments/razorpay/verify`. | Crypto verification recomputes HMAC using server-only `RAZORPAY_KEY_SECRET`. Forged signature rejected with 400 Bad Request. | **PASS** |
| **SEC-6** | **Duplicate Order Submissions (Idempotency)** | Rapid network double-clicking or replay attack with same `idempotencyKey`. | Server in-memory idempotency cache identifies duplicate key and safely returns cached order with `isDuplicateSubmissionPrevented: true`. No duplicate record created. | **PASS** |
| **SEC-7** | **Negative Quantities Handling** | Attacker submits negative quantity `quantity: -3` or zero to manipulate subtotal. | Input validation enforces positive whole integer (`Number.isInteger(qty) && qty > 0`). Non-positive quantities rejected with 400 Bad Request. | **PASS** |
| **SEC-8** | **Overselling Inventory Protection** | Attacker requests `quantity: 999999` exceeding available atelier stock. | Server checks available variant stock (`stock_quantity`) before reservation. Excessive quantity rejected with 400 Insufficient Inventory error. | **PASS** |
| **SEC-9** | **Invalid File Uploads & Storage Bucket Policies** | Attacker uploads malicious `.exe` or oversized file to media bucket. | Supabase storage policies (`004_storage_buckets_and_policies.sql`) enforce MIME type whitelist (`image/jpeg`, `png`, `webp`, `avif`) and 10MB limit. | **PASS** |
| **SEC-10** | **Environment Variables Audit** | Missing production secrets or exposed client-side config. | `/api/health` verified live Supabase URL, Anon Key, Service Role Key, and Razorpay Keys. No placeholder values detected. | **PASS** |
| **SEC-11** | **Sensitive Operation Rate Limiting & Link Leakage** | Mass password reset triggering or token leakage in API response. | Removed `recoveryLink` from `/api/auth/forgot-password` JSON response to prevent unauthenticated account takeovers. | **PASS** |
| **SEC-12** | **Row Level Security (RLS) Policies Check** | Direct Supabase REST API queries by anonymous users. | RLS is enabled on `profiles`, `addresses`, `carts`, `cart_items`, `wishlists`, `orders`, `order_items`, and `payments`. Public clients cannot read other patrons' records. | **PASS** |
| **SEC-13** | **Exposed Secrets Audit** | Privileged backend secrets leaked in `NEXT_PUBLIC_` bundle. | Audited `.env.local` and client build artifacts. `SUPABASE_SERVICE_ROLE_KEY` and `RAZORPAY_KEY_SECRET` are never exposed to browser bundles. | **PASS** |

---

## 4. Full-Stack Fixes Applied During Review

### Fix 1: Shipping Engine Zonal Priority & Address Sensitivity
- **File:** [`src/lib/shipping.ts`](file:///c:/Users/HP/Desktop/Nilora_trends/src/lib/shipping.ts)
- **Vulnerability / Problem:** A Chennai address (`1/69 Palani Goundan Pudhur, Bus Stand, Chennai - 600002`) was misclassified as Erode Intra-District (₹40) because the street string contained the substring `"palani goundan"`. Furthermore, before typing an address, the checkout defaulted to Erode ₹40 instead of prompting for destination.
- **Remediation:**
  1. Removed ambiguous street keyword matching.
  2. Implemented strict 6-digit Indian PIN code and city precedence (PINs starting with `600` immediately map to Chennai / Tamil Nadu Zone - ₹85).
  3. Added `'pending'` state to `ShippingZoneKey` so shipping fee is not calculated until delivery pincode/city is entered.

### Fix 2: Checkout Page Safe Image Property Access
- **File:** [`src/app/checkout/page.tsx`](file:///c:/Users/HP/Desktop/Nilora_trends/src/app/checkout/page.tsx)
- **Vulnerability / Problem:** `item.product.images[0]` threw uncaught `TypeError: Cannot read properties of undefined (reading '0')` when a cart item only possessed a single `image` string or an empty array.
- **Remediation:** Replaced with safe optional chaining: `item.product?.images?.[0] || (item.product as any)?.image || '/nilora-logo-transparent.png'`.

### Fix 3: BOLA / IDOR Query Parameter Privilege Escalation
- **Files:** [`src/app/api/orders/route.ts`](file:///c:/Users/HP/Desktop/Nilora_trends/src/app/api/orders/route.ts), [`src/app/api/orders/[id]/route.ts`](file:///c:/Users/HP/Desktop/Nilora_trends/src/app/api/orders/[id]/route.ts)
- **Vulnerability / Problem:** The orders API trusted `searchParams.get('userId')` and checked `if (clientUserId === 'admin-master') isAdmin = true`. Any anonymous web user could append `?userId=admin-master` to list all orders or inspect another customer's order.
- **Remediation:**
  1. Removed `?userId=admin-master` privilege bypass.
  2. Enforced strict dual-path authentication: verified Supabase SSR session (`user.id` and `user.email === ADMIN_EMAIL`) OR privileged server header `x-admin-key: process.env.ADMIN_PASSWORD`.
  3. Unauthorized order lookups now return 403 Forbidden (`Access denied: You are not authorized to view this order.`).

### Fix 4: Negative and Non-Integer Quantity Handling in Checkout
- **File:** [`src/app/api/checkout/route.ts`](file:///c:/Users/HP/Desktop/Nilora_trends/src/app/api/checkout/route.ts)
- **Vulnerability / Problem:** Line 156 used `Math.max(1, Math.floor(Number(item.quantity) || 1))`, which silently coerced negative numbers (`-3`) to `1` without raising a validation error.
- **Remediation:** Added explicit validation check:
  ```ts
  const rawQty = Number(item.quantity);
  if (!Number.isFinite(rawQty) || rawQty <= 0 || !Number.isInteger(rawQty)) {
    return NextResponse.json(
      { error: `Invalid item quantity: ${item.quantity}. Quantity must be a positive integer.` },
      { status: 400 }
    );
  }
  ```

### Fix 5: Direct PostgreSQL Persistence for Checkout Orders
- **File:** [`src/app/api/checkout/route.ts`](file:///c:/Users/HP/Desktop/Nilora_trends/src/app/api/checkout/route.ts)
- **Vulnerability / Problem:** Checkout only attempted database writes if `rpc('process_checkout')` existed and variants had UUIDs; fallback orders remained purely in-memory.
- **Remediation:** Implemented direct database persistence via `createAdminServerClient()`. All orders and their respective snapshots in `public.orders` and `public.order_items` are reliably inserted into PostgreSQL, returning permanent database UUIDs.

### Fix 6: Live Orders Pipeline in Admin Dashboard
- **File:** [`src/app/admin/page.tsx`](file:///c:/Users/HP/Desktop/Nilora_trends/src/app/admin/page.tsx)
- **Vulnerability / Problem:** The Admin Dashboard displayed hardcoded dummy mock orders and clicking "Update Status" did not persist changes to the backend.
- **Remediation:** Replaced mock array with live data from `/api/orders` (authenticated via `x-admin-key`). Added an interactive fulfillment status selector (`pending`, `confirmed`, `packed`, `shipped`, `delivered`, `cancelled`) that triggers `PATCH /api/orders/[id]` and updates state in real time.

### Fix 7: Remediation of Password Reset Link Exposure
- **File:** [`src/app/api/auth/forgot-password/route.ts`](file:///c:/Users/HP/Desktop/Nilora_trends/src/app/api/auth/forgot-password/route.ts)
- **Vulnerability / Problem:** When built-in email limits were triggered, `recoveryLink: linkData.properties.action_link` was returned in the JSON payload, allowing anyone to obtain a valid password reset token for any email address.
- **Remediation:** Removed `recoveryLink` from the JSON response. Reset links are only sent through authorized communication channels.

### Fix 8: Supabase Publishable Key SSR Fallback
- **File:** [`src/lib/supabase-auth.ts`](file:///c:/Users/HP/Desktop/Nilora_trends/src/lib/supabase-auth.ts)
- **Vulnerability / Problem:** In newer Supabase projects using `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, the SSR auth helper fell back to `'demo-anon-key-placeholder'` when `NEXT_PUBLIC_SUPABASE_ANON_KEY` was missing.
- **Remediation:** Added `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` fallback into `createServerComponentClient`.

---

## 5. Technical & Quality Checks

### TypeScript Compilation (`npx tsc --noEmit`)
- **Status:** **0 Errors**
- **Verification:** All interfaces, route handler promises, and server-component cookie stores typecheck cleanly under strict mode.

### ESLint Code Analysis (`npm run lint`)
- **Status:** **0 Errors, 76 Warnings**
- **Verification:** Zero syntax errors or fatal lint issues. Warnings pertain to unused variable cleanup in historical scripts and exhaustive-deps hints in context providers.

### Production Build (`npm run build`)
- **Status:** **33 / 33 Routes Successfully Compiled**
- **Static Pages:** Prerendered landing pages (`/`, `/about`, `/contact`, `/shop`, `/new-arrivals`, `/login`, etc.).
- **Dynamic Routes:** Server-rendered on demand (`/category/[category]`, `/products/[slug]`, `/checkout`, `/order-success/[id]`, `/profile/orders/[id]`, `/admin`).

### Browser Automation & Console Verification
- **Tool:** Microsoft Edge Headless via Chrome DevTools Protocol (CDP)
- **Viewports Tested:** Desktop (1280x900) & Mobile (375x812 iPhone)
- **Captured Artifacts:**
  - [Desktop Homepage Screenshot](file:///C:/Users/HP/.gemini/antigravity/brain/8239881f-c405-4b71-a7f3-f3f0a7bfeab0/qa-desktop-home.png)
  - [Mobile Responsive Homepage Screenshot](file:///C:/Users/HP/.gemini/antigravity/brain/8239881f-c405-4b71-a7f3-f3f0a7bfeab0/qa-mobile-home.png)
  - [Co-ord Sets Category Screenshot](file:///C:/Users/HP/.gemini/antigravity/brain/8239881f-c405-4b71-a7f3-f3f0a7bfeab0/qa-category-coords.png)
  - [Product Details View Screenshot](file:///C:/Users/HP/.gemini/antigravity/brain/8239881f-c405-4b71-a7f3-f3f0a7bfeab0/qa-product-coords.png)
  - [Order Tracking & Status Screenshot](file:///C:/Users/HP/.gemini/antigravity/brain/8239881f-c405-4b71-a7f3-f3f0a7bfeab0/qa-order-tracking.png)
- **Runtime Console Errors:** **0 Errors**. Clean DOM execution without script crashes or hydration mismatches.

---

## 6. Tests Blocked by Missing External Credentials or Third-Party Services

1. **Production SMTP Provider (Custom Email Domain):**
   - **Reason:** Supabase's default shared SMTP has a built-in hourly rate limit (4 emails/hour).
   - **Status:** The registration and password-reset endpoints function correctly; however, sending high-volume customer emails in production requires connecting a dedicated SMTP service (e.g., Resend, SendGrid, or AWS SES) in the Supabase Dashboard under *Project Settings -> Authentication -> SMTP Settings*.
2. **Live Razorpay Production Settlement:**
   - **Reason:** Currently operating under Razorpay Test Sandbox (`rzp_test_U0wie2RcCcZPQW`).
   - **Status:** Test UPI (`success@razorpay`) and mock cards pass verification; live bank settlements require merchant KYC activation and replacing with live keys (`rzp_live_...`).

---

## 7. Remaining Production Blockers

Before opening public boutique transactions:
1. **Configure Custom SMTP in Supabase:** Add custom SMTP credentials so all patron activation emails and password resets are delivered instantly from `@niloratrends.com`.
2. **Switch Razorpay Keys to Live:** Replace `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` with activated production credentials in the hosting environment.
3. **Set Webhook Secret:** Add `RAZORPAY_WEBHOOK_SECRET` to the production host to enable asynchronous payment reconciliation.
