'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Truck,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Plus,
  ShieldCheck,
  Tag,
  ArrowRight,
  Info,
  Lock,
  Edit3,
  UserCheck,
  User,
  LogIn,
  Sparkles,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice, getCartItemImage } from '@/lib/utils';
import { validateIndianPincode, checkCodEligibility } from '@/lib/pincode';
import { loadCustomerAddresses, saveCustomerAddress, SavedAddress } from '@/lib/addresses';
import { determineShippingZone } from '@/lib/shipping';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    user,
    isLoading: isAuthLoading,
    loginCustomer,
    registerCustomer,
  } = useAuth();

  const {
    cart,
    cartSubtotal,
    shippingFee,
    discountAmount,
    totalAmount,
    appliedCoupon,
    applyCouponCode,
    removeCouponCode,
    clearCart,
    cartCount,
  } = useCart();

  // Multi-step checkout progression: 'details' -> 'payment'
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'payment'>('details');

  // Inline Auth Gate Form State (for unauthenticated guests)
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isAuthProcessing, setIsAuthProcessing] = useState(false);

  // Step 1: Contact Details
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Step 1: Address Selection
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [showNewAddressForm, setShowNewAddressForm] = useState(true);

  // Step 1: Address Form State
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Step 2: Coupon Input State
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Step 2: Payment Selection
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Razorpay configuration checks
  const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const isRazorpayConfigured = Boolean(
    razorpayKey && !razorpayKey.includes('placeholder') && !razorpayKey.includes('your_razorpay')
  );
  const isRazorpayTestMode = Boolean(razorpayKey && razorpayKey.startsWith('rzp_test_'));

  // Dynamic Zonal Shipping Calculation based on Current Address Inputs (From Erode)
  const currentAddressInput = {
    pincode,
    city,
    state,
    addressLine1,
    addressLine2,
  };
  const cartSubtotalPaise = Math.round(cartSubtotal * 100);
  const zonalShipping = determineShippingZone(currentAddressInput, cartSubtotalPaise);
  const effectiveShippingFee = zonalShipping.shippingFeeRupees;
  const effectiveTotalAmount = Math.max(0, cartSubtotal - discountAmount + effectiveShippingFee);

  // Dynamic loader for official Razorpay Checkout SDK
  const loadRazorpaySdk = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(false);
      if ((window as any).Razorpay) return resolve(true);
      const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existing) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Reset fields upon logout or synchronize upon login
  useEffect(() => {
    if (!user) {
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setAddressLine1('');
      setAddressLine2('');
      setCity('');
      setState('');
      setPincode('');
      setSavedAddresses([]);
      setSelectedAddressId('new');
      setShowNewAddressForm(true);
      setCheckoutStep('details');
      setDetailsError(null);
      setCheckoutError(null);
    } else {
      if (user.name) setContactName(user.name);
      if (user.email) setContactEmail(user.email);
      if (user.phone) setContactPhone(user.phone.replace('+91', '').trim());
    }
  }, [user]);

  // Load saved addresses strictly for the authenticated user
  useEffect(() => {
    if (!user?.id) {
      setSavedAddresses([]);
      return;
    }

    loadCustomerAddresses(user.id).then((addrs) => {
      setSavedAddresses(addrs);
      if (addrs.length > 0) {
        const defaultAddr = addrs.find((a) => a.isDefault) || addrs[0];
        setSelectedAddressId(defaultAddr.id);
        setShowNewAddressForm(false);
        setContactName(defaultAddr.recipientName || user.name || '');
        setContactPhone(defaultAddr.phone || (user.phone ? user.phone.replace('+91', '').trim() : ''));
        setAddressLine1(defaultAddr.addressLine1 || '');
        setAddressLine2(defaultAddr.addressLine2 || '');
        setCity(defaultAddr.city || '');
        setState(defaultAddr.state || '');
        setPincode(defaultAddr.pincode || '');
      }
    });
  }, [user?.id, user?.name, user?.phone]);

  // Handle Pincode changes & real-time Indian PIN validation
  const handlePincodeChange = (val: string) => {
    const cleaned = String(val || '').replace(/\D/g, '').slice(0, 6);
    setPincode(cleaned);

    if (cleaned.length === 6) {
      const check = validateIndianPincode(cleaned);
      if (check.valid) {
        setPincodeError(null);
        if (check.state && !state) {
          setState(check.state);
        }
      } else {
        setPincodeError(check.error || 'Invalid 6-digit Indian PIN code.');
      }
    } else if (cleaned.length > 0) {
      setPincodeError('PIN code must be exactly 6 numeric digits.');
    } else {
      setPincodeError(null);
    }
  };

  const handleSelectSavedAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setShowNewAddressForm(false);
    setContactName(addr.recipientName || '');
    setContactPhone(addr.phone || '');
    setAddressLine1(addr.addressLine1 || '');
    setAddressLine2(addr.addressLine2 || '');
    setCity(addr.city || '');
    setState(addr.state || '');
    setPincode(addr.pincode || '');
    setPincodeError(null);
  };

  // Inline Authentication Handlers for Guests
  const handleInlineAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsAuthProcessing(true);

    if (authMode === 'signin') {
      const res = await loginCustomer(authEmail, authPassword);
      setIsAuthProcessing(false);
      if (!res.success) {
        setAuthError(
          res.error || 'The email or password entered is incorrect. Please check your credentials and try again.'
        );
      }
    } else {
      const res = await registerCustomer({
        name: authName,
        email: authEmail,
        password: authPassword,
        phone: authPhone,
      });
      setIsAuthProcessing(false);
      if (res.success) {
        setAuthMode('signin');
        setAuthPassword('');
        setAuthSuccess('Account created successfully! Please sign in with your password to proceed with checkout.');
      } else {
        setAuthError(res.error || 'Unable to create account. Please check your details.');
      }
    }
  };

  // Proceed from Step 1 (Contact & Delivery Address) to Step 2 (Payment)
  const handleProceedToPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setDetailsError(null);

    const safeName = String(contactName || '').trim();
    const safeEmail = String(contactEmail || '').trim();
    const safePhone = String(contactPhone || '').trim();
    const safeLine1 = String(addressLine1 || '').trim();
    const safeLine2 = String(addressLine2 || '').trim();
    const safeCity = String(city || '').trim();
    const safePincode = String(pincode || '').trim();

    if (!safeName) {
      setDetailsError('Please enter your full contact name.');
      return;
    }

    if (!safeEmail || !safeEmail.includes('@') || !safeEmail.includes('.')) {
      setDetailsError('Please provide a valid email address for dispatch & tracking updates.');
      return;
    }

    if (!safePhone || safePhone.length !== 10) {
      setDetailsError('Please provide a valid 10-digit Indian phone number for courier delivery OTP.');
      return;
    }

    if (!safeLine1) {
      setDetailsError('Please enter your street address / apartment / house details.');
      return;
    }

    if (!safePincode || safePincode.length !== 6) {
      setDetailsError('Please enter a 6-digit Indian PIN code.');
      return;
    }

    const pinCheck = validateIndianPincode(safePincode);
    if (!pinCheck.valid) {
      setDetailsError(pinCheck.error || 'Invalid 6-digit Indian PIN code.');
      return;
    }

    const safeState = String(state || '').trim() || pinCheck.state || 'India';
    if (!safeCity) {
      setDetailsError('Please specify your delivery city or town.');
      return;
    }

    // Save newly entered address to customer's address book
    if (user?.id && showNewAddressForm && selectedAddressId === 'new') {
      try {
        const newAddr: SavedAddress = {
          id: `addr-${Date.now()}`,
          type: 'Home',
          recipientName: safeName,
          phone: safePhone,
          houseNo: '',
          addressLine1: safeLine1,
          addressLine2: safeLine2,
          city: safeCity,
          state: safeState,
          pincode: safePincode,
          isDefault: savedAddresses.length === 0,
        };
        const updated = await saveCustomerAddress(user.id, newAddr);
        setSavedAddresses(updated);
      } catch (err) {
        console.warn('Address persistence notice:', err);
      }
    }

    // Unlock and advance to Step 2: Payment
    setCheckoutStep('payment');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Coupon handling
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);

    const safeCoupon = String(couponInput || '').trim();
    if (!safeCoupon) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    setIsApplyingCoupon(true);
    const res = await applyCouponCode(safeCoupon);
    setIsApplyingCoupon(false);

    if (res.success) {
      setCouponSuccess(res.message || 'Coupon applied successfully!');
      setCouponInput('');
    } else {
      setCouponError(res.error || 'Failed to apply coupon.');
    }
  };

  // Real-time COD eligibility check with zonal total
  const codCheck = checkCodEligibility(effectiveTotalAmount, pincode || '110001');

  // Submit Order (Executed from Step 2)
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    if (cart.length === 0) {
      setCheckoutError('Your shopping bag is empty.');
      return;
    }

    if (!user) {
      setCheckoutError('Please sign in to complete and place your order.');
      return;
    }

    const safeName = String(contactName || '').trim();
    const safeEmail = String(contactEmail || '').trim();
    const safePhone = String(contactPhone || '').trim();
    const safeLine1 = String(addressLine1 || '').trim();
    const safeLine2 = String(addressLine2 || '').trim();
    const safeCity = String(city || '').trim();
    const safePincode = String(pincode || '').trim();
    const pinCheck = validateIndianPincode(safePincode);
    const safeState = String(state || '').trim() || pinCheck.state || 'India';

    if (!safeName || !safeEmail || !safePhone || !safeLine1 || !safeCity || !safePincode) {
      setCheckoutError('Incomplete delivery details. Please return to Step 1 to verify your address.');
      setCheckoutStep('details');
      return;
    }

    if (!pinCheck.valid) {
      setCheckoutError(pinCheck.error || 'Please provide a valid 6-digit Indian PIN code.');
      setCheckoutStep('details');
      return;
    }

    if (paymentMethod === 'cod' && !codCheck.eligible) {
      setCheckoutError(codCheck.reason || 'Cash on Delivery is unavailable for this order.');
      return;
    }

    if (paymentMethod === 'razorpay' && !isRazorpayConfigured) {
      setCheckoutError(
        'Online payment via Razorpay is pending API key configuration in .env.local. Please select Cash on Delivery.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // -----------------------------------------------------------------
      // WORKFLOW A: Online Payment via Razorpay
      // -----------------------------------------------------------------
      if (paymentMethod === 'razorpay') {
        const createRes = await fetch('/api/payments/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            couponCode: appliedCoupon?.code || null,
            shippingAddress: {
              fullName: safeName,
              email: safeEmail,
              phone: safePhone,
              addressLine1: safeLine1,
              addressLine2: safeLine2,
              city: safeCity,
              state: safeState,
              pincode: safePincode,
              country: 'India',
            },
            items: cart.map((item) => ({
              productId: item.product.id,
              selectedSize: item.selectedSize,
              selectedColor: item.selectedColor,
              quantity: item.quantity,
            })),
          }),
        });

        const orderData = await createRes.json();
        if (!createRes.ok || !orderData.success) {
          throw new Error(orderData.error || 'Failed to initiate Razorpay order on server.');
        }

        const isLoaded = await loadRazorpaySdk();
        if (!isLoaded || !(window as any).Razorpay) {
          throw new Error('Razorpay Checkout SDK failed to load. Please verify your internet connection.');
        }

        const rzp = new (window as any).Razorpay({
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'NILORA TRENDS',
          description: `Boutique Order #${orderData.orderNumber}`,
          image: '/favicon.ico',
          order_id: orderData.orderId,
          prefill: {
            name: safeName,
            email: safeEmail,
            contact: safePhone,
          },
          theme: {
            color: '#392820',
          },
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch('/api/payments/razorpay/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  internal_order_id: orderData.internalOrderId,
                  order_number: orderData.orderNumber,
                }),
              });

              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success) {
                clearCart();
                if (typeof window !== 'undefined' && orderData.orderNumber) {
                  try {
                    const rawExisting = localStorage.getItem('nilora_placed_orders');
                    const existing = rawExisting ? JSON.parse(rawExisting) : [];
                    if (!existing.includes(orderData.orderNumber)) {
                      existing.unshift(orderData.orderNumber);
                      localStorage.setItem('nilora_placed_orders', JSON.stringify(existing.slice(0, 20)));
                    }
                    if (verifyData.order) {
                      localStorage.setItem(`nilora_order_${orderData.orderNumber}`, JSON.stringify(verifyData.order));
                      sessionStorage.setItem('nilora_latest_order', JSON.stringify(verifyData.order));
                    }
                  } catch {}
                }
                router.push(`/order-success/${orderData.orderNumber}`);
              } else {
                setCheckoutError(verifyData.error || 'Payment signature verification failed.');
                setIsSubmitting(false);
              }
            } catch {
              setCheckoutError('Error verifying payment response with server.');
              setIsSubmitting(false);
            }
          },
          modal: {
            ondismiss: async function () {
              setIsSubmitting(false);
              await fetch('/api/payments/razorpay/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderNumber: orderData.orderNumber,
                  internalOrderId: orderData.internalOrderId,
                  reason: 'Customer dismissed payment gateway modal',
                }),
              }).catch(() => {});
            },
          },
        });

        rzp.open();
        return;
      }

      // -----------------------------------------------------------------
      // WORKFLOW B: Cash on Delivery (COD)
      // -----------------------------------------------------------------
      const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          idempotencyKey,
          paymentMethod: 'cod',
          couponCode: appliedCoupon?.code || null,
          shippingAddress: {
            fullName: safeName,
            email: safeEmail,
            phone: safePhone,
            addressLine1: safeLine1,
            addressLine2: safeLine2,
            city: safeCity,
            state: safeState,
            pincode: safePincode,
            country: 'India',
          },
          items: cart.map((item) => ({
            productId: item.product.id,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order. Please review your cart.');
      }

      clearCart();
      const orderRef = data.order?.order_number || data.order?.id;
      if (typeof window !== 'undefined' && orderRef) {
        try {
          const rawExisting = localStorage.getItem('nilora_placed_orders');
          const existing = rawExisting ? JSON.parse(rawExisting) : [];
          if (!existing.includes(orderRef)) {
            existing.unshift(orderRef);
            localStorage.setItem('nilora_placed_orders', JSON.stringify(existing.slice(0, 20)));
          }
          if (data.order) {
            localStorage.setItem(`nilora_order_${orderRef}`, JSON.stringify(data.order));
            sessionStorage.setItem('nilora_latest_order', JSON.stringify(data.order));
          }
        } catch {}
      }
      router.push(`/order-success/${orderRef}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Checkout encountered an error';
      setCheckoutError(msg);
      setIsSubmitting(false);
    }
  };

  // Loading state while checking user session
  if (isAuthLoading) {
    return (
      <div className="bg-[#FAF7F2] min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-3 border-[#D9A08C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif text-sm text-[#735D50] tracking-wider uppercase">Loading Checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-8 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 sm:mb-8">
          <nav className="flex items-center gap-2 text-xs text-[#735D50]">
            <Link href="/cart" className="hover:text-[#392820]">
              Bag ({cartCount})
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#D9A08C]" />
            <span className="text-[#392820] font-medium">Boutique Checkout</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
            <h1 className="font-serif text-2xl sm:text-3xl text-[#392820] font-medium">
              Secure Boutique Checkout
            </h1>
            {user && (
              <div className="inline-flex items-center gap-2 text-xs text-[#735D50] bg-white px-3 py-1.5 rounded-full border border-[#E8D6C7]">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Signed in as <strong>{user.name}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Empty Bag State */}
        {cart.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center max-w-md mx-auto border border-[#E8D6C7] shadow-sm space-y-4">
            <h3 className="font-serif text-xl font-semibold text-[#392820]">
              Your bag is empty
            </h3>
            <p className="text-xs text-[#735D50]">
              Please add your desired pieces to your boutique bag before checking out.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#392820] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#111111]"
            >
              Explore Collections <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : !user ? (
          /* ================================================================= */
          /* MANDATORY AUTHENTICATION GATE FOR GUESTS                          */
          /* ================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-7">
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8D6C7] shadow-sm space-y-6">
                <div className="text-center space-y-2 pb-4 border-b border-[#FAF7F2]">
                  <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#E8D6C7] flex items-center justify-center mx-auto text-[#D9A08C]">
                    <Lock className="w-5 h-5 text-[#392820]" />
                  </div>
                  <h2 className="font-serif text-xl sm:text-2xl text-[#392820] font-semibold">
                    Sign In to Place Your Order
                  </h2>
                  <p className="text-xs text-[#735D50] max-w-md mx-auto leading-relaxed">
                    Your bag items are safely reserved. To verify delivery eligibility, apply member privileges, and protect your order, please sign in or register.
                  </p>
                </div>

                {/* Switcher: Sign In vs Create Account */}
                <div className="flex rounded-xl bg-[#FAF7F2] p-1 border border-[#E8D6C7]">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setAuthError(null);
                      setAuthSuccess(null);
                    }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                      authMode === 'signin'
                        ? 'bg-white text-[#392820] shadow-xs'
                        : 'text-[#735D50] hover:text-[#392820]'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setAuthError(null);
                      setAuthSuccess(null);
                    }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                      authMode === 'register'
                        ? 'bg-white text-[#392820] shadow-xs'
                        : 'text-[#735D50] hover:text-[#392820]'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {/* Auth Form */}
                <form onSubmit={handleInlineAuthSubmit} className="space-y-4">
                  {authMode === 'register' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-[#392820] mb-1">
                          Full Name <span className="text-[#D9A08C]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          placeholder="Your Full Name"
                          className="w-full bg-[#FAF7F2] border border-[#E8D6C7] px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-[#D9A08C] text-[#392820]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#392820] mb-1">
                          Phone Number (for Courier SMS &amp; OTP) <span className="text-[#D9A08C]">*</span>
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-[#E8D6C7] bg-[#E8D6C7]/30 text-xs text-[#392820] font-bold">
                            +91
                          </span>
                          <input
                            type="tel"
                            required
                            value={authPhone}
                            onChange={(e) => setAuthPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="9876543210"
                            className="flex-1 bg-[#FAF7F2] border border-[#E8D6C7] px-3.5 py-2.5 rounded-r-xl text-xs outline-none focus:border-[#D9A08C] text-[#392820]"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-[#392820] mb-1">
                      Email Address <span className="text-[#D9A08C]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full bg-[#FAF7F2] border border-[#E8D6C7] px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-[#D9A08C] text-[#392820]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#392820] mb-1">
                      Password <span className="text-[#D9A08C]">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#FAF7F2] border border-[#E8D6C7] px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-[#D9A08C] text-[#392820]"
                    />
                  </div>

                  {authSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{authSuccess}</span>
                    </div>
                  )}

                  {authError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isAuthProcessing}
                    className="w-full py-3.5 rounded-full bg-[#392820] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#111111] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60"
                  >
                    <LogIn className="w-4 h-4 text-[#D9A08C]" />
                    <span>
                      {isAuthProcessing
                        ? 'Authenticating...'
                        : authMode === 'signin'
                        ? 'Sign In & Proceed to Address'
                        : 'Create Account & Proceed'}
                    </span>
                  </button>
                </form>

                <p className="text-[11px] text-center text-[#735D50]">
                  🔒 Your information is confidential and protected by 256-bit SSL encryption.
                </p>
              </div>
            </div>

            {/* Right Summary Column for Guest Preview */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-[#E8DCCB] shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#FAF7F2]">
                  <h4 className="font-serif text-base font-semibold text-[#392820]">
                    Your Bag ({cartCount} {cartCount === 1 ? 'piece' : 'pieces'})
                  </h4>
                  <Link href="/cart" className="text-xs text-[#D9A08C] font-semibold hover:underline">
                    Edit Bag
                  </Link>
                </div>

                <div className="divide-y divide-[#FAF7F2] max-h-72 overflow-y-auto space-y-2 pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="pt-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-18 rounded-xl overflow-hidden bg-[#FAF7F2] shrink-0 border border-[#E8DCCB]">
                          <Image
                            src={getCartItemImage(item)}
                            alt={`${item.product?.name || 'Product'} - ${item.selectedColor}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-serif font-semibold text-[#392820] line-clamp-1">{item.product.name}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#735D50]">
                            <span>Size: <strong className="text-[#392820]">{item.selectedSize}</strong></span>
                            <span>&bull;</span>
                            <span>{item.selectedColor}</span>
                          </div>
                          <p className="text-[11px] text-[#735D50]">
                            Qty: {item.quantity} &times; {formatPrice(item.product.price)}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-[#392820]">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-[#FAF7F2] space-y-2 text-xs text-[#735D50]">
                  <div className="flex justify-between">
                    <span>Bag Subtotal</span>
                    <span className="font-semibold text-[#392820]">{formatPrice(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <span className="font-medium text-[#392820]">
                        {zonalShipping.isFreeShipping
                          ? 'Delivery'
                          : zonalShipping.zoneKey === 'pending'
                          ? 'Delivery'
                          : zonalShipping.zoneKey === 'zone-1'
                          ? 'Local Courier (Erode)'
                          : zonalShipping.zoneKey === 'zone-2'
                          ? `Kongu Region (${zonalShipping.district})`
                          : zonalShipping.zoneKey === 'zone-3'
                          ? `Tamil Nadu (${zonalShipping.district})`
                          : 'Pan-India Delivery'}
                      </span>
                      <p className="text-[10px] text-[#735D50]/80">
                        {zonalShipping.explanation}
                      </p>
                    </div>
                    <span>
                      {zonalShipping.isFreeShipping ? (
                        <strong className="text-emerald-700 font-bold uppercase text-[11px] tracking-wider">
                          FREE
                        </strong>
                      ) : zonalShipping.zoneKey === 'pending' ? (
                        <span className="text-[11px] text-[#D9A08C] font-semibold">
                          Calculated on address
                        </span>
                      ) : (
                        <span className="font-semibold text-[#392820]">
                          {formatPrice(effectiveShippingFee)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-[#FAF7F2] flex justify-between text-base font-bold text-[#392820]">
                    <span>Total Amount</span>
                    <span className="font-serif text-xl">{formatPrice(effectiveTotalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================================================================= */
          /* AUTHENTICATED CUSTOMER: 2-STEP PROGRESSIVE CHECKOUT               */
          /* ================================================================= */
          <div>
            {/* Step Progress Tracker */}
            <div className="mb-8 max-w-2xl mx-auto">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#E8D6C7] -translate-y-1/2 z-0" />
                <div
                  className={`absolute top-1/2 left-0 h-0.5 bg-[#392820] -translate-y-1/2 z-0 transition-all duration-300 ${
                    checkoutStep === 'payment' ? 'w-full' : 'w-1/2'
                  }`}
                />

                {/* Step 1 Node */}
                <div
                  onClick={() => setCheckoutStep('details')}
                  className="relative z-10 flex flex-col items-center cursor-pointer group"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      checkoutStep === 'details'
                        ? 'bg-[#392820] text-white ring-4 ring-[#E8D6C7]'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {checkoutStep === 'payment' ? <CheckCircle2 className="w-5 h-5" /> : '1'}
                  </div>
                  <span className="text-[11px] font-semibold mt-1.5 text-[#392820]">
                    1. Delivery Details
                  </span>
                </div>

                {/* Step 2 Node */}
                <div
                  onClick={() => {
                    if (contactName && contactPhone && addressLine1 && pincode) {
                      setCheckoutStep('payment');
                    }
                  }}
                  className={`relative z-10 flex flex-col items-center transition-all ${
                    contactName && contactPhone && addressLine1 && pincode
                      ? 'cursor-pointer group'
                      : 'cursor-not-allowed opacity-70'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      checkoutStep === 'payment'
                        ? 'bg-[#392820] text-white ring-4 ring-[#E8D6C7]'
                        : 'bg-[#FAF7F2] text-[#735D50] border-2 border-[#E8D6C7]'
                    }`}
                  >
                    2
                  </div>
                  <span
                    className={`text-[11px] font-semibold mt-1.5 ${
                      checkoutStep === 'payment' ? 'text-[#392820]' : 'text-[#735D50]'
                    }`}
                  >
                    2. Payment Selection
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* Left Column: Stage 1 or Stage 2 */}
              <div className="lg:col-span-7 space-y-6">

                {/* ----------------------------------------------------------- */}
                {/* STAGE 1: CONTACT DETAILS & DELIVERY ADDRESS                 */}
                {/* ----------------------------------------------------------- */}
                {checkoutStep === 'details' && (
                  <form onSubmit={handleProceedToPayment} className="space-y-6">
                    {/* 1. Contact Information */}
                    <div className="bg-white rounded-2xl p-6 border border-[#E8D6C7] shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-[#FAF7F2]">
                        <h3 className="font-serif text-base sm:text-lg font-semibold text-[#392820] flex items-center gap-2">
                          <User className="w-4 h-4 text-[#D9A08C]" />
                          1. Contact Information
                        </h3>
                        <span className="text-[11px] text-[#735D50]">
                          Required for dispatch &amp; courier OTP
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#392820] mb-1">
                            Full Name <span className="text-[#D9A08C]">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            placeholder="Your Full Name"
                            className="w-full bg-[#FAF7F2] border border-[#E8D6C7] px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-[#D9A08C] text-[#392820]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#392820] mb-1">
                            Email Address (for Dispatch Updates) <span className="text-[#D9A08C]">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            placeholder="your.email@example.com"
                            className="w-full bg-[#FAF7F2] border border-[#E8D6C7] px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-[#D9A08C] text-[#392820]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#392820] mb-1">
                          Phone Number (for Courier SMS &amp; OTP) <span className="text-[#D9A08C]">*</span>
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-[#E8D6C7] bg-[#E8D6C7]/30 text-xs text-[#392820] font-bold">
                            +91
                          </span>
                          <input
                            type="tel"
                            required
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="9876543210"
                            className="flex-1 bg-[#FAF7F2] border border-[#E8D6C7] px-3.5 py-2.5 rounded-r-xl text-xs outline-none focus:border-[#D9A08C] text-[#392820]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. Delivery Address */}
                    <div className="bg-white rounded-2xl p-6 border border-[#E8D6C7] shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-[#FAF7F2]">
                        <h3 className="font-serif text-base sm:text-lg font-semibold text-[#392820] flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#D9A08C]" />
                          2. Delivery Destination
                        </h3>
                        {savedAddresses.length > 0 && !showNewAddressForm && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewAddressForm(true);
                              setSelectedAddressId('new');
                              setAddressLine1('');
                              setAddressLine2('');
                              setCity('');
                              setState('');
                              setPincode('');
                            }}
                            className="inline-flex items-center gap-1 text-xs text-[#D9A08C] font-semibold hover:underline cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add New Address
                          </button>
                        )}
                      </div>

                      {/* Saved Address Cards */}
                      {savedAddresses.length > 0 && (
                        <div className="space-y-2.5">
                          <p className="text-xs font-semibold text-[#735D50]">Saved Addresses:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {savedAddresses.map((addr) => (
                              <div
                                key={addr.id}
                                onClick={() => handleSelectSavedAddress(addr)}
                                className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-1 ${
                                  selectedAddressId === addr.id && !showNewAddressForm
                                    ? 'border-[#392820] bg-[#FAF7F2] ring-1 ring-[#392820]'
                                    : 'border-[#E8D6C7] hover:border-[#D9A08C]'
                                }`}
                              >
                                <div className="flex items-center justify-between text-xs font-bold text-[#392820]">
                                  <span className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-[#D9A08C]" />
                                    {addr.recipientName}
                                  </span>
                                  {addr.isDefault && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#392820] text-white">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[#735D50] line-clamp-2">
                                  {addr.addressLine1}, {addr.city} - {addr.pincode}
                                </p>
                                <p className="text-[11px] text-[#735D50]">+91 {addr.phone}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Address Form Inputs */}
                      {showNewAddressForm && (
                        <div className="pt-2 space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-[#392820] mb-1">
                              Street Address / Flat / House No. <span className="text-[#D9A08C]">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={addressLine1}
                              onChange={(e) => setAddressLine1(e.target.value)}
                              placeholder="Flat 4B, Gulmohar Enclave, Civil Lines"
                              className="w-full bg-[#FAF7F2] border border-[#E8D6C7] px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-[#D9A08C] text-[#392820]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#392820] mb-1">
                              Landmark / Area (Optional)
                            </label>
                            <input
                              type="text"
                              value={addressLine2}
                              onChange={(e) => setAddressLine2(e.target.value)}
                              placeholder="Near Central Park / Behind City Mall"
                              className="w-full bg-[#FAF7F2] border border-[#E8D6C7] px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-[#D9A08C] text-[#392820]"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-[#392820] mb-1">
                                Indian PIN Code <span className="text-[#D9A08C]">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={pincode}
                                onChange={(e) => handlePincodeChange(e.target.value)}
                                placeholder="302006"
                                maxLength={6}
                                className="w-full bg-[#FAF7F2] border border-[#E8D6C7] px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-[#D9A08C] text-[#392820]"
                              />
                              {pincodeError && (
                                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 shrink-0" />
                                  <span>{pincodeError}</span>
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-[#392820] mb-1">
                                City <span className="text-[#D9A08C]">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="Jaipur"
                                className="w-full bg-[#FAF7F2] border border-[#E8D6C7] px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-[#D9A08C] text-[#392820]"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-[#392820] mb-1">
                                State <span className="text-[#D9A08C]">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                placeholder="Rajasthan"
                                className="w-full bg-[#FAF7F2] border border-[#E8D6C7] px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-[#D9A08C] text-[#392820]"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {detailsError && (
                      <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 shadow-xs">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>{detailsError}</span>
                      </div>
                    )}

                    {/* Step 1 CTA: Proceed to Payment Selection */}
                    <button
                      type="submit"
                      className="w-full py-4 rounded-full bg-[#392820] text-white text-xs font-semibold uppercase tracking-widest shadow-xl hover:bg-[#111111] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <span>Proceed to Payment Selection</span>
                      <ArrowRight className="w-4 h-4 text-[#D9A08C]" />
                    </button>
                  </form>
                )}

                {/* ----------------------------------------------------------- */}
                {/* STAGE 2: PAYMENT SELECTION & ORDER PLACEMENT                */}
                {/* ----------------------------------------------------------- */}
                {checkoutStep === 'payment' && (
                  <form onSubmit={handlePlaceOrder} className="space-y-6">
                    {/* Confirmed Delivery Address Summary Card */}
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                            Delivering to: {contactName}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-900 leading-relaxed">
                          {addressLine1}
                          {addressLine2 ? `, ${addressLine2}` : ''}, {city}, {state} -{' '}
                          <strong>{pincode}</strong>
                        </p>
                        <p className="text-[11px] text-emerald-800">
                          Courier Contact: +91 {contactPhone} &bull; Updates to: {contactEmail}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setCheckoutStep('details')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-900 text-xs font-semibold hover:bg-emerald-100 transition-colors shrink-0 shadow-xs cursor-pointer self-start sm:self-center"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Details</span>
                      </button>
                    </div>

                    {/* Payment Method Selector */}
                    <div className="bg-white rounded-2xl p-6 border border-[#E8D6C7] shadow-xs space-y-4">
                      <div className="pb-3 border-b border-[#FAF7F2]">
                        <h3 className="font-serif text-base sm:text-lg font-semibold text-[#392820]">
                          3. Choose Payment Method
                        </h3>
                        <p className="text-xs text-[#735D50] mt-0.5">
                          Select Cash on Delivery or fast online payment via UPI and cards.
                        </p>
                      </div>

                      <div className="space-y-3">
                        {/* Cash on Delivery */}
                        <label
                          onClick={() => setPaymentMethod('cod')}
                          className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                            paymentMethod === 'cod'
                              ? 'border-[#392820] bg-[#FAF7F2] ring-1 ring-[#392820]'
                              : 'border-[#E8D6C7] hover:border-[#D9A08C]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMethod === 'cod'}
                            onChange={() => setPaymentMethod('cod')}
                            className="mt-1 accent-[#392820]"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-[#D9A08C]" />
                              <span className="font-semibold text-xs text-[#392820]">
                                Cash on Delivery (Pay at Doorstep)
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
                                Active
                              </span>
                            </div>
                            <p className="text-[11px] text-[#735D50] leading-relaxed">
                              Pay safely with cash or UPI (GPay/PhonePe) directly to the delivery courier upon arrival. Verified via courier OTP.
                            </p>
                            {!codCheck.eligible && (
                              <p className="text-[11px] text-amber-700 font-medium">
                                &bull; {codCheck.reason}
                              </p>
                            )}
                          </div>
                        </label>

                        {/* Online Payment Interface (Razorpay) */}
                        <div
                          className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                            isRazorpayConfigured
                              ? paymentMethod === 'razorpay'
                                ? 'border-[#392820] bg-[#FAF7F2] cursor-pointer ring-1 ring-[#392820]'
                                : 'border-[#E8D6C7] hover:border-[#D9A08C] cursor-pointer'
                              : 'border-neutral-200 bg-neutral-50/70 opacity-85 cursor-not-allowed'
                          }`}
                          onClick={() => {
                            if (isRazorpayConfigured) setPaymentMethod('razorpay');
                          }}
                        >
                          <input
                            type="radio"
                            name="payment"
                            disabled={!isRazorpayConfigured}
                            checked={paymentMethod === 'razorpay'}
                            onChange={() => {
                              if (isRazorpayConfigured) setPaymentMethod('razorpay');
                            }}
                            className="mt-1 accent-[#392820] disabled:opacity-50"
                          />
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-[#D9A08C]" />
                                <span className="font-semibold text-xs text-[#392820]">
                                  Online Payment (Razorpay Gateway)
                                </span>
                              </div>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  isRazorpayConfigured
                                    ? isRazorpayTestMode
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : 'bg-emerald-100 text-emerald-800'
                                    : 'bg-neutral-200 text-neutral-600'
                                }`}
                              >
                                {isRazorpayConfigured
                                  ? isRazorpayTestMode
                                    ? 'Sandbox / Test Mode'
                                    : 'Active'
                                  : 'Razorpay Key Pending'}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#735D50] leading-relaxed">
                              Supports UPI (GPay, PhonePe, Paytm), Debit/Credit Cards &amp; NetBanking.
                            </p>
                            {isRazorpayTestMode && (
                              <div className="p-2 rounded-lg bg-amber-50/90 border border-amber-200/90 text-[11px] text-amber-900 flex items-start gap-1.5">
                                <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                                <span>
                                  <strong>Test Mode Active:</strong> You can test payments safely with Razorpay sandbox UPI (<code>success@razorpay</code>) and test cards without real bank deductions.
                                </span>
                              </div>
                            )}
                            {!isRazorpayConfigured && (
                              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-1.5">
                                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                <span>
                                  Configure <code>NEXT_PUBLIC_RAZORPAY_KEY_ID</code> in <code>.env.local</code> to activate live UPI/Card gateway. Cash on Delivery is currently active for all orders.
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {checkoutError && (
                      <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 shadow-xs">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>{checkoutError}</span>
                      </div>
                    )}

                    {/* Final Order CTA */}
                    <button
                      type="submit"
                      disabled={isSubmitting || (paymentMethod === 'cod' && !codCheck.eligible)}
                      className="w-full py-4 rounded-full bg-[#392820] text-white text-xs font-semibold uppercase tracking-widest shadow-xl hover:bg-[#111111] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      {isSubmitting ? (
                        <span>Validating &amp; Creating Order...</span>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-[#D9A08C]" />
                          <span>
                            {paymentMethod === 'cod' ? 'Place Boutique Order' : 'Proceed to Pay with Razorpay'} &bull;{' '}
                            {formatPrice(effectiveTotalAmount)}
                          </span>
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-center text-[#735D50]">
                      🔒 256-bit Secure Checkout &bull; Easy 7-Day Doorstep Size &amp; Style Exchange
                    </p>
                  </form>
                )}
              </div>

              {/* Right Column: Order Summary & Coupon (Visible in Both Steps) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-[#E8DCCB] shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#FAF7F2]">
                    <h4 className="font-serif text-base font-semibold text-[#392820]">
                      Order Summary ({cartCount} {cartCount === 1 ? 'piece' : 'pieces'})
                    </h4>
                    <Link href="/cart" className="text-xs text-[#D9A08C] font-semibold hover:underline">
                      Edit Bag
                    </Link>
                  </div>

                  <div className="divide-y divide-[#FAF7F2] max-h-72 overflow-y-auto space-y-2 pr-1">
                    {cart.map((item) => (
                      <div key={item.id} className="pt-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="relative w-14 h-18 rounded-xl overflow-hidden bg-[#FAF7F2] shrink-0 border border-[#E8DCCB]">
                            <Image
                              src={getCartItemImage(item)}
                              alt={`${item.product?.name || 'Product'} - ${item.selectedColor}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-serif font-semibold text-[#392820] line-clamp-1">{item.product.name}</p>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#735D50]">
                              <span>Size: <strong className="text-[#392820]">{item.selectedSize}</strong></span>
                              <span>&bull;</span>
                              <span>{item.selectedColor}</span>
                            </div>
                            <p className="text-[11px] text-[#735D50]">
                              Qty: {item.quantity} &times; {formatPrice(item.product.price)}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-[#392820]">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Coupon Code Box */}
                  <div className="pt-3 border-t border-[#FAF7F2] space-y-2">
                    <span className="text-xs font-semibold text-[#392820] flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#D9A08C]" /> Promo / Privilege Code
                    </span>

                    {appliedCoupon ? (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-emerald-900">{appliedCoupon.code}</span>
                          <p className="text-[10px] text-emerald-700">
                            {appliedCoupon.message || `Saved ${formatPrice(appliedCoupon.discountAmount)}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={removeCouponCode}
                          className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          placeholder="NILORA10"
                          className="flex-1 bg-[#FAF7F2] border border-[#E8D6C7] px-3 py-2 rounded-xl text-xs uppercase outline-none focus:border-[#D9A08C] text-[#392820]"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={isApplyingCoupon}
                          className="px-3.5 py-2 bg-[#392820] text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-[#111111] transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isApplyingCoupon ? '...' : 'Apply'}
                        </button>
                      </div>
                    )}

                    {couponError && <p className="text-xs text-rose-600">{couponError}</p>}
                    {couponSuccess && !appliedCoupon && <p className="text-xs text-emerald-700">{couponSuccess}</p>}
                  </div>

                  {/* Totals Breakdown */}
                  <div className="pt-3 border-t border-[#FAF7F2] space-y-2 text-xs text-[#735D50]">
                    <div className="flex justify-between">
                      <span>Bag Subtotal</span>
                      <span className="font-semibold text-[#392820]">{formatPrice(cartSubtotal)}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-800 font-medium">
                        <span>Privilege Discount ({appliedCoupon?.code})</span>
                        <span>-{formatPrice(discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="font-medium text-[#392820]">
                          {zonalShipping.isFreeShipping
                            ? 'Delivery'
                            : zonalShipping.zoneKey === 'pending'
                            ? 'Delivery'
                            : zonalShipping.zoneKey === 'zone-1'
                            ? 'Local Courier (Erode)'
                            : zonalShipping.zoneKey === 'zone-2'
                            ? `Kongu Region (${zonalShipping.district})`
                            : zonalShipping.zoneKey === 'zone-3'
                            ? `Tamil Nadu (${zonalShipping.district})`
                            : 'Pan-India Delivery'}
                        </span>
                        <p className="text-[10px] text-[#735D50]/80">
                          {zonalShipping.explanation}
                        </p>
                      </div>
                      <span>
                        {zonalShipping.isFreeShipping ? (
                          <strong className="text-emerald-700 font-bold uppercase text-[11px] tracking-wider">
                            FREE
                          </strong>
                        ) : zonalShipping.zoneKey === 'pending' ? (
                          <span className="text-[11px] text-[#D9A08C] font-semibold">
                            Calculated on address
                          </span>
                        ) : (
                          <span className="font-semibold text-[#392820]">
                            {formatPrice(effectiveShippingFee)}
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-[#FAF7F2] flex justify-between text-base font-bold text-[#392820]">
                      <span>Total Amount</span>
                      <span className="font-serif text-xl">{formatPrice(effectiveTotalAmount)}</span>
                    </div>
                    <p className="text-[10px] text-[#735D50]/80">Inclusive of all taxes &amp; GST</p>
                  </div>
                </div>

                {/* Trust Badge */}
                <div className="p-4 rounded-2xl bg-white border border-[#E8D6C7] text-xs text-[#735D50] space-y-2">
                  <div className="flex items-center gap-2 text-[#392820] font-semibold">
                    <ShieldCheck className="w-4 h-4 text-[#D9A08C]" />
                    <span>Nilora Boutique Guarantee</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Every piece is handcrafted with couture precision, steam-pressed, and delivered in signature presentation packaging.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
