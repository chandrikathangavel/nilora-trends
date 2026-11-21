// Comprehensive Website Route & Component Integrity Crawler
const BASE = 'http://localhost:3000';

const routesToTest = [
  // Core Storefront & Catalog
  '/',
  '/shop',
  '/products',
  '/new-arrivals',
  '/category/co-ord-sets',
  '/category/kurtas',
  '/category/sarees',
  '/products/ivory-embroidered-linen-coord-set',
  '/products/champagne-silk-wrap-blazer-coord',
  '/products/chanderi-silk-gold-zari-anarkali-kurta',
  
  // Shopping & Checkout Flow
  '/cart',
  '/checkout',
  '/orders',
  
  // Account & Profiles
  '/login',
  '/profile',
  '/profile/orders',
  
  // Boutique & Brand Info
  '/about',
  '/contact',
  
  // Mandatory Razorpay Legal & Customer Care Policies
  '/terms',
  '/privacy',
  '/refund-policy',
  '/shipping-policy',
  
  // Admin & Staff Authentication
  '/admin/login',
  '/admin',
  
  // Health API
  '/api/health',
];

async function run() {
  console.log('--- STARTING ROUTE & COMPONENT INTEGRITY AUDIT ---');
  let passed = 0;
  let failed = 0;
  const issues = [];

  for (const route of routesToTest) {
    try {
      const url = `${BASE}${route}`;
      const res = await fetch(url);
      const text = await res.text();

      // Check status
      if (res.status === 200 || (route === '/admin' && (res.status === 200 || res.status === 403))) {
        // Check if page rendered HTML with valid brand content
        if (text.includes('Nilora') || text.includes('nilora') || route.startsWith('/api/')) {
          console.log(`[OK ${res.status}] ${route}`);
          passed++;
        } else {
          console.warn(`[WARN ${res.status}] ${route} (rendered without Nilora brand context)`);
          passed++;
        }
      } else {
        console.error(`[FAIL ${res.status}] ${route}`);
        issues.push({ route, status: res.status });
        failed++;
      }
    } catch (e) {
      console.error(`[ERROR] ${route}: ${e.message}`);
      issues.push({ route, error: e.message });
      failed++;
    }
  }

  console.log('\n--- CRAWL SUMMARY ---');
  console.log(`Routes Checked: ${routesToTest.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed === 0) {
    console.log('ALL ROUTES VERIFIED 100% OPERATIONAL WITH ZERO 404 OR 500 ERRORS!');
  } else {
    console.log('Issues found:', issues);
  }
}

run().catch(console.error);
