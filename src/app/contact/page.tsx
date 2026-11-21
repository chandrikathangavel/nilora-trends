'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { useStore } from '@/context/StoreContext';

function InstagramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export default function ContactPage() {
  const { sendCustomerInquiry } = useStore();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;

    sendCustomerInquiry({
      name: form.name.trim(),
      phone: form.phone.trim() || '+91 9597186404',
      email: form.email.trim(),
      message: form.message.trim(),
    });

    setSubmitted(true);
  };

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs uppercase tracking-[0.25em] text-[#D9A08C] font-semibold">
            Customer Care &amp; Support
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-[#392820] font-medium">
            Get in Touch
          </h1>
          <p className="text-xs sm:text-sm text-[#735D50]">
            We&apos;re here to help. Reach out through any of the channels below and our team will get back to you within 24 hours.
          </p>
        </div>

        {/* Contact Grid: Left Cards & Right Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Left: Contact Channels Cards */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* 4 Main Communication Channels Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* 1. WhatsApp Card */}
              <div className="bg-white rounded-3xl p-6 border border-[#E8D6C7] shadow-xs hover:border-[#D9A08C] hover:shadow-md transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#E8F5E9] text-[#25D366] flex items-center justify-center border border-[#C8E6C9] shadow-2xs">
                    <WhatsAppIcon className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-semibold text-[#392820]">
                      WhatsApp
                    </h3>
                    <p className="text-xs text-[#735D50] mt-0.5">Chat with us anytime</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-[#FAF7F2] mt-4">
                  <a
                    href="https://wa.me/919597186404"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-[#392820] hover:text-[#25D366] transition-colors inline-block"
                  >
                    +91 9597186404 &rarr;
                  </a>
                </div>
              </div>

              {/* 2. Email Card */}
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=niloratrends@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-3xl p-6 border border-[#E8D6C7] shadow-xs hover:border-[#D9A08C] hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer block"
              >
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#FAF7F2] text-[#D9A08C] group-hover:bg-[#FAF7F2]/80 flex items-center justify-center border border-[#E8D6C7] shadow-2xs transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-semibold text-[#392820] group-hover:text-[#D9A08C] transition-colors">
                      Email
                    </h3>
                    <p className="text-xs text-[#735D50] mt-0.5">For orders &amp; general queries</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-[#FAF7F2] mt-4">
                  <span className="text-xs sm:text-sm font-bold text-[#392820] group-hover:text-[#D9A08C] transition-colors break-all inline-block">
                    niloratrends@gmail.com &rarr;
                  </span>
                </div>
              </a>

              {/* 3. Call Us Card */}
              <div className="bg-white rounded-3xl p-6 border border-[#E8D6C7] shadow-xs hover:border-[#D9A08C] hover:shadow-md transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#FAF7F2] text-[#D9A08C] flex items-center justify-center border border-[#E8D6C7] shadow-2xs">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-semibold text-[#392820]">
                      Call Us
                    </h3>
                    <p className="text-xs text-[#735D50] mt-0.5">Mon–Sat, 10AM–7PM IST</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-[#FAF7F2] mt-4">
                  <a
                    href="tel:+919597186404"
                    className="text-sm font-bold text-[#392820] hover:text-[#D9A08C] transition-colors inline-block"
                  >
                    +91 9597186404 &rarr;
                  </a>
                </div>
              </div>

              {/* 4. Official Instagram Card */}
              <div className="bg-white rounded-3xl p-6 border border-[#E8D6C7] shadow-xs hover:border-[#D9A08C] hover:shadow-md transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#FAF7F2] text-[#D9A08C] flex items-center justify-center border border-[#E8D6C7] shadow-2xs">
                    <InstagramIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-semibold text-[#392820]">
                      Official Instagram
                    </h3>
                    <p className="text-xs text-[#735D50] mt-0.5">DM us for style tips &amp; drops</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-[#FAF7F2] mt-4">
                  <a
                    href="https://www.instagram.com/nilora_trends"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-[#D9A08C] hover:text-[#392820] transition-colors inline-block"
                  >
                    @nilora_trends &rarr;
                  </a>
                </div>
              </div>

            </div>

            {/* 5. Shop Name & Location Card (Nilora_Trends, Tamilnadu,Erode,Nambiyur) */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8D6C7] shadow-xs hover:border-[#D9A08C] transition-all">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-[#FAF7F2] text-[#D9A08C] flex items-center justify-center shrink-0 border border-[#E8D6C7] shadow-2xs">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#D9A08C] block">
                    Flagship Boutique &amp; Studio
                  </span>
                  <h3 className="font-serif text-lg font-semibold text-[#392820]">
                    Nilora_Trends
                  </h3>
                  <p className="text-xs sm:text-sm text-[#735D50] font-sans font-medium leading-relaxed">
                    Tamilnadu, Erode, Nambiyur
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right: Send Us a Message Form (ONLY Name, Phone, Email, Message) */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8D6C7] shadow-xl space-y-6">
              <div className="space-y-1 border-b border-[#FAF7F2] pb-4">
                <span className="text-[10px] uppercase tracking-widest text-[#D9A08C] font-semibold">
                  Direct Boutique Inquiry
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#392820] font-medium">
                  Send Us a Message
                </h2>
                <p className="text-xs text-[#735D50]">
                  Leave your details and our team will get in touch with you shortly.
                </p>
              </div>

              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-serif text-lg font-semibold text-emerald-900">
                    Message Received
                  </h4>
                  <p className="text-xs text-emerald-800 max-w-sm mx-auto">
                    Thank you, {form.name}. A Nilora Trends customer care advisor will connect with you shortly at {form.email} or {form.phone}.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* 1. NAME */}
                  <div className="space-y-1.5">
                    <label className="block text-xs uppercase tracking-wider font-semibold text-[#392820]">
                      NAME
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your name"
                      className="w-full bg-[#FAF7F2]/60 border border-[#E8D6C7] px-4 py-3 rounded-xl text-sm text-[#392820] placeholder-[#735D50]/60 outline-none focus:bg-white focus:ring-2 focus:ring-[#D9A08C] transition-all"
                    />
                  </div>

                  {/* 2. PHONE */}
                  <div className="space-y-1.5">
                    <label className="block text-xs uppercase tracking-wider font-semibold text-[#392820]">
                      PHONE
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+91 95971 86404"
                      className="w-full bg-[#FAF7F2]/60 border border-[#E8D6C7] px-4 py-3 rounded-xl text-sm text-[#392820] placeholder-[#735D50]/60 outline-none focus:bg-white focus:ring-2 focus:ring-[#D9A08C] transition-all"
                    />
                  </div>

                  {/* 3. EMAIL */}
                  <div className="space-y-1.5">
                    <label className="block text-xs uppercase tracking-wider font-semibold text-[#392820]">
                      EMAIL
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="your@email.com"
                      className="w-full bg-[#FAF7F2]/60 border border-[#E8D6C7] px-4 py-3 rounded-xl text-sm text-[#392820] placeholder-[#735D50]/60 outline-none focus:bg-white focus:ring-2 focus:ring-[#D9A08C] transition-all"
                    />
                  </div>

                  {/* 4. MESSAGE BOX */}
                  <div className="space-y-1.5">
                    <label className="block text-xs uppercase tracking-wider font-semibold text-[#392820]">
                      MESSAGE
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="How can we help?"
                      className="w-full bg-[#FAF7F2]/60 border border-[#E8D6C7] px-4 py-3 rounded-xl text-sm text-[#392820] placeholder-[#735D50]/60 outline-none focus:bg-white focus:ring-2 focus:ring-[#D9A08C] transition-all resize-y"
                    />
                  </div>

                  {/* 5. SUBMIT BUTTON */}
                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl bg-[#392820] hover:bg-[#111111] text-[#FAF7F2] font-semibold text-xs tracking-widest uppercase transition-all shadow-md flex items-center justify-center gap-2 group mt-2"
                  >
                    <span>SEND MESSAGE</span>
                    <Send className="w-4 h-4 text-[#D9A08C] group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
