'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package,
  Heart,
  Shield,
  Plus,
  Edit2,
  LogOut,
  User,
  Home,
  Briefcase,
  MapPin,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';

export interface SavedAddress {
  id: string;
  type: 'Home' | 'Work';
  recipientName: string;
  phone: string;
  houseNo: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  pincode: string;
  isDefault: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, updateUserProfile, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/profile');
    }
  }, [user, isLoading, router]);

  const profile = {
    name: user?.name || (user?.email ? user.email.split('@')[0] : 'Nilora Member'),
    email: user?.email || (user?.role === 'admin' ? 'niloratrends@gmail.com' : 'member@niloratrends.com'),
    phone: user?.phone || 'Not provided',
    memberSince: user?.joinedDate || 'Nov 2026',
    privilegeTier: user?.privilegeTier || 'Nilora Privilege Circle',
  };

  // Orders count state
  const [ordersCount, setOrdersCount] = useState<number | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/orders?userId=${encodeURIComponent(user.id)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.orders)) {
            setOrdersCount(data.orders.length);
          } else {
            setOrdersCount(0);
          }
        })
        .catch(() => setOrdersCount(0));
    } else {
      setOrdersCount(0);
    }
  }, [user?.id]);

  // Edit Profile modal & state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);
  const [profileUpdateError, setProfileUpdateError] = useState('');

  const handleOpenEditProfile = () => {
    setProfileForm({
      name: user?.name || (user?.email ? user.email.split('@')[0] : ''),
      email: user?.email || '',
      phone: user?.phone || '',
    });
    setProfileUpdateSuccess(false);
    setProfileUpdateError('');
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileUpdateError('');

    if (!profileForm.name.trim()) {
      setProfileUpdateError('Full name is required.');
      setIsUpdatingProfile(false);
      return;
    }
    if (!profileForm.email.trim()) {
      setProfileUpdateError('Email address is required.');
      setIsUpdatingProfile(false);
      return;
    }

    try {
      const res = await updateUserProfile({
        name: profileForm.name.trim(),
        email: profileForm.email.trim().toLowerCase(),
        phone: profileForm.phone.trim(),
      });

      if (res.success) {
        setProfileUpdateSuccess(true);
        setTimeout(() => {
          setIsEditProfileOpen(false);
          setProfileUpdateSuccess(false);
        }, 900);
      } else {
        setProfileUpdateError(res.error || 'Failed to update personal details.');
      }
    } catch {
      setProfileUpdateError('An unexpected error occurred while saving.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Addresses state - starts empty (demo addresses removed) and persists in localStorage
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Address modal & form state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    type: 'Home' as 'Home' | 'Work',
    recipientName: '',
    phone: '',
    houseNo: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    pincode: '',
    isDefault: false,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nilora_saved_addresses_v2');
      if (saved) {
        setAddresses(JSON.parse(saved));
      } else {
        // Clear out any old demo addresses
        setAddresses([]);
      }
    } catch {
      setAddresses([]);
    }
    setIsLoaded(true);
  }, []);

  const saveAddresses = (updated: SavedAddress[]) => {
    setAddresses(updated);
    try {
      localStorage.setItem('nilora_saved_addresses_v2', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save addresses to localStorage', e);
    }
  };

  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      type: 'Home',
      recipientName: user?.name || '',
      phone: user?.phone || '',
      houseNo: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      pincode: '',
      isDefault: addresses.length === 0,
    });
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: SavedAddress) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      type: addr.type,
      recipientName: addr.recipientName,
      phone: addr.phone,
      houseNo: addr.houseNo,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      pincode: addr.pincode,
      isDefault: addr.isDefault,
    });
    setIsAddressModalOpen(true);
  };

  const handleDeleteAddress = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
      updated[0].isDefault = true;
    }
    saveAddresses(updated);
  };

  const handleSetDefault = (id: string) => {
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    saveAddresses(updated);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();

    if (!addressForm.houseNo.trim() || !addressForm.addressLine1.trim() || !addressForm.city.trim() || !addressForm.pincode.trim()) {
      return;
    }

    let updated: SavedAddress[];

    if (editingAddressId) {
      updated = addresses.map((a) => {
        if (a.id === editingAddressId) {
          return {
            ...a,
            type: addressForm.type,
            recipientName: addressForm.recipientName.trim() || user?.name || 'Nilora Member',
            phone: addressForm.phone.trim() || user?.phone || '',
            houseNo: addressForm.houseNo.trim(),
            addressLine1: addressForm.addressLine1.trim(),
            addressLine2: addressForm.addressLine2.trim() || undefined,
            city: addressForm.city.trim(),
            pincode: addressForm.pincode.trim(),
            isDefault: addressForm.isDefault || addresses.length === 1,
          };
        }
        return addressForm.isDefault ? { ...a, isDefault: false } : a;
      });
    } else {
      const newAddress: SavedAddress = {
        id: `addr-${Date.now()}`,
        type: addressForm.type,
        recipientName: addressForm.recipientName.trim() || user?.name || 'Nilora Member',
        phone: addressForm.phone.trim() || user?.phone || '',
        houseNo: addressForm.houseNo.trim(),
        addressLine1: addressForm.addressLine1.trim(),
        addressLine2: addressForm.addressLine2.trim() || undefined,
        city: addressForm.city.trim(),
        pincode: addressForm.pincode.trim(),
        isDefault: addresses.length === 0 || addressForm.isDefault,
      };

      if (newAddress.isDefault) {
        updated = addresses.map((a) => ({ ...a, isDefault: false })).concat(newAddress);
      } else {
        updated = [...addresses, newAddress];
      }
    }

    saveAddresses(updated);
    setIsAddressModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="bg-[#F8F5F0] min-h-screen py-24 px-4 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#D9A08C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif text-xs text-[#735D50]">Loading your Nilora boutique profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="bg-[#F8F5F0] min-h-screen py-10 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <span className="text-xs uppercase tracking-widest text-[#B79A72] font-semibold">
            Boutique Account
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#392820] font-medium mt-1">
            My Profile &amp; Addresses
          </h1>
          <p className="text-xs sm:text-sm text-[#735D50] mt-1">
            Manage your personal profile, delivery destinations, and boutique privileges.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Account Navigation */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-[#E8DCCB] shadow-sm space-y-4 text-center">
              <div className="w-20 h-20 rounded-full bg-[#392820] text-[#E8DCCB] border-2 border-[#B79A72] flex items-center justify-center mx-auto text-2xl font-serif font-bold shadow-md uppercase">
                {profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'NT'}
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-[#392820]">
                  {profile.name}
                </h3>
                <p className="text-xs text-[#735D50] break-all">{profile.email}</p>
                <div className="inline-block mt-2 px-3 py-1 rounded-full bg-[#F8F5F0] text-[#B79A72] border border-[#E8DCCB] text-[10px] font-semibold uppercase tracking-wider">
                  {profile.privilegeTier}
                </div>
              </div>

              <div className="pt-4 border-t border-[#F8F5F0] space-y-1 text-left text-xs">
                <Link
                  href="/orders"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F8F5F0] text-[#392820] font-medium"
                >
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#B79A72]" /> My Orders
                  </span>
                  <span className="text-[#735D50] text-[11px]">
                    {ordersCount === null ? 'View →' : `${ordersCount} Orders →`}
                  </span>
                </Link>
                <Link
                  href="/wishlist"
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F8F5F0] text-[#392820] font-medium"
                >
                  <span className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[#B79A72]" /> Saved Wishlist
                  </span>
                  <span className="text-[#735D50] text-[11px]">View &rarr;</span>
                </Link>
                {user?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#392820] text-[#D9A08C] font-medium hover:bg-[#111111] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#D9A08C]" /> Admin Console
                    </span>
                    <span className="text-white text-[11px]">Open &rarr;</span>
                  </Link>
                )}

                {user ? (
                  <button
                    onClick={() => {
                      logout();
                      router.push('/login');
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-rose-50 text-rose-700 font-medium transition-colors mt-2"
                  >
                    <span className="flex items-center gap-2">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </span>
                    <span className="text-rose-500 text-[11px]">&rarr;</span>
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#E8DCCB] text-[#392820] font-medium transition-colors mt-2"
                  >
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#D9A08C]" /> Sign In / Register
                    </span>
                    <span className="text-[#D9A08C] text-[11px]">&rarr;</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Supabase Status Hint */}
            <div className="bg-[#F6F1EA] rounded-2xl p-4 border border-[#E8DCCB] text-[11px] text-[#735D50] space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-[#392820]">
                <Shield className="w-3.5 h-3.5 text-[#B79A72]" />
                Supabase Auth Architecture
              </div>
              <p>
                {isSupabaseConfigured
                  ? 'Supabase backend connected for authentication and persistent address storage.'
                  : 'Currently operating in demo preview mode. Connect Supabase credentials in .env.local to enable real OTP/Magic Link logins.'}
              </p>
            </div>
          </div>

          {/* Right Column: Profile & Addresses */}
          <div className="lg:col-span-8 space-y-8">
            {/* Personal Details */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8DCCB] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F8F5F0]">
                <h3 className="font-serif text-lg font-semibold text-[#392820]">
                  Personal Details
                </h3>
                <button
                  type="button"
                  onClick={handleOpenEditProfile}
                  className="text-xs text-[#B79A72] hover:text-[#392820] font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#FAF7F2] transition-all cursor-pointer border border-transparent hover:border-[#E8DCCB]"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[#735D50] text-[11px] uppercase tracking-wider">Full Name</p>
                  <p className="font-semibold text-sm text-[#392820] mt-0.5">{profile.name}</p>
                </div>
                <div>
                  <p className="text-[#735D50] text-[11px] uppercase tracking-wider">Email Address</p>
                  <p className="font-semibold text-sm text-[#392820] mt-0.5 break-all">{profile.email}</p>
                </div>
                <div>
                  <p className="text-[#735D50] text-[11px] uppercase tracking-wider">Phone</p>
                  <p className="font-semibold text-sm text-[#392820] mt-0.5">{profile.phone}</p>
                </div>
                <div>
                  <p className="text-[#735D50] text-[11px] uppercase tracking-wider">Member Since</p>
                  <p className="font-semibold text-sm text-[#392820] mt-0.5">{profile.memberSince}</p>
                </div>
              </div>
            </div>

            {/* Saved Delivery Addresses */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8DCCB] shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#F8F5F0]">
                <h3 className="font-serif text-lg font-semibold text-[#392820]">
                  Saved Delivery Addresses ({addresses.length})
                </h3>
                <button
                  onClick={handleOpenAddAddress}
                  className="inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full bg-[#392820] text-white hover:bg-[#111111] transition-all font-medium shadow-xs active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Address
                </button>
              </div>

              {/* Address list or Empty State */}
              {addresses.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-2xl border-2 border-dashed border-[#E8DCCB] bg-[#FAF7F2]/60 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-white border border-[#E8D6C7] text-[#D9A08C] flex items-center justify-center mx-auto shadow-2xs">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-serif text-base font-semibold text-[#392820]">
                      No Saved Delivery Addresses
                    </h4>
                    <p className="text-xs text-[#735D50] max-w-sm mx-auto">
                      Demo addresses have been removed. Add your Home or Work delivery destinations for seamless checkout.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenAddAddress}
                    className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-full bg-[#392820] text-white hover:bg-[#111111] transition-all font-semibold shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New Address
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-5 rounded-2xl border transition-all space-y-3 relative bg-[#F8F5F0] ${
                        addr.isDefault
                          ? 'border-[#B79A72] ring-1 ring-[#B79A72]/50 shadow-xs'
                          : 'border-[#E8DCCB] hover:border-[#B79A72]'
                      }`}
                    >
                      {/* Top Bar: Type Badge, Default Tag, Edit, Delete */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#392820] bg-white px-2 py-0.5 rounded border border-[#E8DCCB] shadow-2xs">
                            {addr.type === 'Home' ? (
                              <Home className="w-3 h-3 text-[#B79A72]" />
                            ) : (
                              <Briefcase className="w-3 h-3 text-[#B79A72]" />
                            )}
                            {addr.type}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#392820] text-[#E8DCCB] font-bold">
                              Default
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <button
                            onClick={() => handleOpenEditAddress(addr)}
                            className="text-[#735D50] hover:text-[#392820] transition-colors p-1"
                            title="Edit Address"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-[#735D50] hover:text-rose-600 transition-colors p-1"
                            title="Delete Address"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Recipient Details */}
                      <div>
                        <p className="font-semibold text-sm text-[#392820]">{addr.recipientName}</p>
                        <p className="text-xs text-[#735D50] mt-0.5">Mobile: {addr.phone}</p>
                      </div>

                      {/* Detailed Address Display */}
                      <div className="text-xs text-[#735D50] space-y-0.5 pt-2 border-t border-[#E8DCCB]/60 leading-relaxed">
                        <p>
                          <span className="font-medium text-[#392820]">House / Flat No:</span>{' '}
                          {addr.houseNo}
                        </p>
                        <p>
                          <span className="font-medium text-[#392820]">Address Line 1:</span>{' '}
                          {addr.addressLine1}
                        </p>
                        {addr.addressLine2 && (
                          <p>
                            <span className="font-medium text-[#392820]">Address Line 2:</span>{' '}
                            {addr.addressLine2}
                          </p>
                        )}
                        <p className="font-semibold text-[#392820] pt-0.5">
                          {addr.city} &bull; {addr.pincode}
                        </p>
                      </div>

                      {/* Set as default button */}
                      {!addr.isDefault && (
                        <div className="pt-2 border-t border-[#E8DCCB]/40">
                          <button
                            onClick={() => handleSetDefault(addr.id)}
                            className="text-[11px] text-[#B79A72] hover:text-[#392820] font-semibold transition-colors underline cursor-pointer"
                          >
                            Set as Default Address
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Address Modal */}
      {isAddressModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddressModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#E8D6C7] shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#FAF7F2]">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#D9A08C] font-bold">
                  Delivery Destination
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#392820]">
                  {editingAddressId ? 'Edit Address' : 'Add New Address'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="p-2 rounded-full hover:bg-[#FAF7F2] text-[#735D50] hover:text-[#392820] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Address Form */}
            <form onSubmit={handleSaveAddress} className="space-y-4">
              {/* 1. Two-way Selection: Home or Work */}
              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#392820]">
                  ADDRESS TYPE (HOME OR WORK)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAddressForm({ ...addressForm, type: 'Home' })}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
                      addressForm.type === 'Home'
                        ? 'border-[#392820] bg-[#FAF7F2] text-[#392820] ring-2 ring-[#392820]/80 shadow-xs'
                        : 'border-[#E8D6C7] bg-white text-[#735D50] hover:border-[#D9A08C]'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        addressForm.type === 'Home'
                          ? 'bg-[#392820] text-[#FAF7F2]'
                          : 'bg-[#FAF7F2] text-[#735D50]'
                      }`}
                    >
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-serif text-sm font-semibold text-[#392820]">Home</p>
                      <p className="text-[10px] text-[#735D50]">All-day delivery</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAddressForm({ ...addressForm, type: 'Work' })}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
                      addressForm.type === 'Work'
                        ? 'border-[#392820] bg-[#FAF7F2] text-[#392820] ring-2 ring-[#392820]/80 shadow-xs'
                        : 'border-[#E8D6C7] bg-white text-[#735D50] hover:border-[#D9A08C]'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        addressForm.type === 'Work'
                          ? 'bg-[#392820] text-[#FAF7F2]'
                          : 'bg-[#FAF7F2] text-[#735D50]'
                      }`}
                    >
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-serif text-sm font-semibold text-[#392820]">Work</p>
                      <p className="text-[10px] text-[#735D50]">Office hours (10AM - 6PM)</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. House No */}
              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#392820]">
                  HOUSE NO. / FLAT NO. / DOOR NO. *
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.houseNo}
                  onChange={(e) => setAddressForm({ ...addressForm, houseNo: e.target.value })}
                  placeholder="e.g. Flat 4B, Door No. 12, Floor 3"
                  className="w-full bg-[#FAF7F2]/60 border border-[#E8D6C7] px-4 py-2.5 rounded-xl text-sm text-[#392820] placeholder-[#735D50]/60 outline-none focus:bg-white focus:ring-2 focus:ring-[#D9A08C] transition-all"
                />
              </div>

              {/* 3. Address Line 1 */}
              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#392820]">
                  ADDRESS LINE 1 (STREET / ROAD / AREA) *
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  placeholder="e.g. Main Bazaar Street, Anna Nagar"
                  className="w-full bg-[#FAF7F2]/60 border border-[#E8D6C7] px-4 py-2.5 rounded-xl text-sm text-[#392820] placeholder-[#735D50]/60 outline-none focus:bg-white focus:ring-2 focus:ring-[#D9A08C] transition-all"
                />
              </div>

              {/* 4. Address Line 2 */}
              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#392820]">
                  ADDRESS LINE 2 (LANDMARK / APARTMENT NAME - OPTIONAL)
                </label>
                <input
                  type="text"
                  value={addressForm.addressLine2}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                  placeholder="e.g. Opposite Post Office, Lotus Tower"
                  className="w-full bg-[#FAF7F2]/60 border border-[#E8D6C7] px-4 py-2.5 rounded-xl text-sm text-[#392820] placeholder-[#735D50]/60 outline-none focus:bg-white focus:ring-2 focus:ring-[#D9A08C] transition-all"
                />
              </div>

              {/* 5. City and Pincode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#392820]">
                    CITY *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="e.g. Erode / Chennai"
                    className="w-full bg-[#FAF7F2]/60 border border-[#E8D6C7] px-4 py-2.5 rounded-xl text-sm text-[#392820] placeholder-[#735D50]/60 outline-none focus:bg-white focus:ring-2 focus:ring-[#D9A08C] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#392820]">
                    PINCODE *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    value={addressForm.pincode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setAddressForm({ ...addressForm, pincode: val });
                    }}
                    placeholder="6-digit pincode"
                    className="w-full bg-[#FAF7F2]/60 border border-[#E8D6C7] px-4 py-2.5 rounded-xl text-sm text-[#392820] placeholder-[#735D50]/60 outline-none focus:bg-white focus:ring-2 focus:ring-[#D9A08C] transition-all"
                  />
                </div>
              </div>

              {/* 6. Recipient Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#392820]">
                    RECIPIENT NAME
                  </label>
                  <input
                    type="text"
                    value={addressForm.recipientName}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, recipientName: e.target.value })
                    }
                    placeholder="Recipient Full Name"
                    className="w-full bg-[#FAF7F2]/60 border border-[#E8D6C7] px-4 py-2.5 rounded-xl text-sm text-[#392820] placeholder-[#735D50]/60 outline-none focus:bg-white focus:ring-2 focus:ring-[#D9A08C] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#392820]">
                    CONTACT PHONE
                  </label>
                  <input
                    type="tel"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    placeholder="+91 Mobile number"
                    className="w-full bg-[#FAF7F2]/60 border border-[#E8D6C7] px-4 py-2.5 rounded-xl text-sm text-[#392820] placeholder-[#735D50]/60 outline-none focus:bg-white focus:ring-2 focus:ring-[#D9A08C] transition-all"
                  />
                </div>
              </div>

              {/* 7. Default Checkbox */}
              <label className="flex items-center gap-2.5 pt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, isDefault: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-[#E8D6C7] text-[#392820] focus:ring-[#D9A08C] cursor-pointer"
                />
                <span className="text-xs text-[#392820] font-medium">
                  Set as default delivery address
                </span>
              </label>

              {/* 8. Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#FAF7F2]">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#E8D6C7] text-xs font-semibold text-[#735D50] hover:text-[#392820] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#392820] hover:bg-[#111111] text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {editingAddressId ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-[#1A1310]/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#E8DCCB] space-y-6 relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#FAF7F2]">
              <div>
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#D9A08C] font-bold">
                  Account Management
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#392820] mt-0.5">
                  Edit Personal Details
                </h3>
                <p className="text-xs text-[#735D50] mt-1">
                  Update your boutique customer profile and contact information.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#E8D6C7] text-[#735D50] hover:text-[#392820] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            {profileUpdateError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {profileUpdateError}
              </div>
            )}

            {/* Success Message */}
            {profileUpdateSuccess && (
              <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-medium flex items-center gap-2">
                <Check className="w-4 h-4" />
                Personal details successfully saved!
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#392820]">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="e.g. Chandrika Thangavel"
                  className="w-full bg-[#FAF7F2]/60 border border-[#E8D6C7] px-4 py-2.5 rounded-xl text-sm text-[#392820] placeholder-[#735D50]/60 outline-none focus:bg-white focus:ring-2 focus:ring-[#D9A08C] transition-all"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#392820]">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder="e.g. chandrikat2005@gmail.com"
                  className="w-full bg-[#FAF7F2]/60 border border-[#E8D6C7] px-4 py-2.5 rounded-xl text-sm text-[#392820] placeholder-[#735D50]/60 outline-none focus:bg-white focus:ring-2 focus:ring-[#D9A08C] transition-all"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#392820]">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+91 Mobile number"
                  className="w-full bg-[#FAF7F2]/60 border border-[#E8D6C7] px-4 py-2.5 rounded-xl text-sm text-[#392820] placeholder-[#735D50]/60 outline-none focus:bg-white focus:ring-2 focus:ring-[#D9A08C] transition-all"
                />
                <p className="text-[11px] text-[#735D50]">
                  Used for personal delivery coordinates and order status notifications.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#FAF7F2]">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#E8D6C7] text-xs font-semibold text-[#735D50] hover:text-[#392820] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="px-6 py-2.5 rounded-xl bg-[#392820] hover:bg-[#111111] text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
