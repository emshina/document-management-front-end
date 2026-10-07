// app/page.tsx

'use client';

import Link from 'next/link';
import { 
  FolderKanban, 
  Users, 
  PenTool, 
  ShieldCheck, 
  Building2, 
  ArrowRight, 
  CheckCircle2, 
  Mail, 
  Phone, 
  Menu, 
  X,
  FileText
} from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased selection:bg-[#ef7632] selection:text-white">
      {/* Top Navbar - Clean, Compact, Professional */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <img 
              src="/logo.png" 
              alt="Lymton Technologies Logo" 
              className="w-9 h-9 object-contain rounded-lg bg-white shadow-sm group-hover:scale-105 transition"
            />
            <div>
              <span className="text-lg font-extrabold tracking-tight text-[#0d253c] block leading-none">
                LYMTON
              </span>
              <span className="text-[9px] font-bold tracking-widest text-[#ef7632] uppercase block mt-0.5">
                TECHNOLOGIES
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-[#ef7632] transition">Features</a>
            <a href="#solutions" className="hover:text-[#ef7632] transition">EDMS & Workflow</a>
            <a href="#about" className="hover:text-[#ef7632] transition">About Us</a>
            <a href="#contact" className="hover:text-[#ef7632] transition">Contact</a>
          </nav>

          {/* Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link 
              href="/login" 
              className="px-4 py-2 text-sm font-semibold text-[#0d253c] hover:text-[#ef7632] transition"
            >
              Log In
            </Link>
            <Link 
              href="/signup" 
              style={{ backgroundColor: '#ef7632' }}
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-md shadow-[#ef7632]/20 hover:opacity-95 transition"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 px-6 py-6 space-y-4 shadow-xl">
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)} 
              className="block font-medium text-gray-700 hover:text-[#ef7632]"
            >
              Features
            </a>
            <a 
              href="#solutions" 
              onClick={() => setMobileMenuOpen(false)} 
              className="block font-medium text-gray-700 hover:text-[#ef7632]"
            >
              EDMS & Workflow
            </a>
            <a 
              href="#about" 
              onClick={() => setMobileMenuOpen(false)} 
              className="block font-medium text-gray-700 hover:text-[#ef7632]"
            >
              About Us
            </a>
            <a 
              href="#contact" 
              onClick={() => setMobileMenuOpen(false)} 
              className="block font-medium text-gray-700 hover:text-[#ef7632]"
            >
              Contact
            </a>
            <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
              <Link 
                href="/login" 
                className="w-full text-center py-2.5 font-semibold text-[#0d253c] bg-gray-50 rounded-lg text-sm"
              >
                Log In
              </Link>
              <Link 
                href="/signup" 
                style={{ backgroundColor: '#ef7632' }}
                className="w-full text-center py-2.5 font-semibold text-white rounded-lg shadow-sm text-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0d253c]/5 via-white to-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ef7632]/10 text-[#ef7632] text-xs font-semibold tracking-wide uppercase">
                <ShieldCheck size={14} /> Enterprise Digital Transformation
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0d253c] tracking-tight leading-tight">
                Agility, Reliability & Performance for Your <span style={{ color: '#ef7632' }}>Enterprise Data</span>
              </h1>
              
              <p className="text-base text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Empower your organization with Lymton Technologies EDMS. Seamlessly manage electronic documents, automate employee life cycles, track contract expirations, and execute secure eSignatures all in one unified platform.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link 
                  href="/signup" 
                  style={{ backgroundColor: '#ef7632' }}
                  className="w-full sm:w-auto px-7 py-3 rounded-xl text-white font-semibold text-sm shadow-lg shadow-[#ef7632]/25 hover:opacity-95 transition flex items-center justify-center gap-2"
                >
                  Start Free Trial <ArrowRight size={16} />
                </Link>
                <Link 
                  href="/login" 
                  className="w-full sm:w-auto px-7 py-3 rounded-xl border-2 border-[#0d253c] text-[#0d253c] font-semibold text-sm hover:bg-[#0d253c] hover:text-white transition flex items-center justify-center"
                >
                  Client Portal Log In
                </Link>
              </div>

              {/* Trust badges */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-gray-200/60 max-w-md mx-auto lg:mx-0">
                <div>
                  <div className="text-xl font-extrabold text-[#0d253c]">100%</div>
                  <div className="text-xs text-gray-500 font-medium">Secure & Encrypted</div>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-[#0d253c]">24/7</div>
                  <div className="text-xs text-gray-500 font-medium">Cloud Availability</div>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-[#0d253c]">Multi-Tier</div>
                  <div className="text-xs text-gray-500 font-medium">Sub-Company Control</div>
                </div>
              </div>
            </div>

            {/* Right Graphic Mockup */}
            <div className="lg:col-span-5 relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#ef7632] to-[#0d253c] rounded-3xl opacity-15 blur-xl"></div>
              <div className="relative bg-[#0d253c] rounded-2xl p-5 shadow-xl border border-gray-800 text-white space-y-5">
                <div className="flex items-center justify-between border-b border-gray-700/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  </div>
                  <span className="text-[11px] text-gray-400 font-mono">lymton-edms-v2.6.sys</span>
                </div>

                <div className="space-y-3">
                  <div className="bg-gray-800/80 p-3.5 rounded-xl border border-gray-700/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FolderKanban className="text-[#ef7632]" size={20} />
                      <div>
                        <div className="text-xs font-bold">Electronic Document Vault</div>
                        <div className="text-[11px] text-gray-400">Structured folders & template registry</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">Active</span>
                  </div>

                  <div className="bg-gray-800/80 p-3.5 rounded-xl border border-gray-700/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Users className="text-[#ef7632]" size={20} />
                      <div>
                        <div className="text-xs font-bold">Employee & Contract Alerts</div>
                        <div className="text-[11px] text-gray-400">Automated 30/60 day expiry tracking</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-semibold">Expiring Soon</span>
                  </div>

                  <div className="bg-gray-800/80 p-3.5 rounded-xl border border-gray-700/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <PenTool className="text-[#ef7632]" size={20} />
                      <div>
                        <div className="text-xs font-bold">Secure eSignature Module</div>
                        <div className="text-[11px] text-gray-400">Legally binding digital authorizations</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-semibold">Ready</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Core Solutions & Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#ef7632]">Comprehensive Suite</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0d253c]">
              Everything Your Organization Needs to Go Fully Paperless
            </h3>
            <p className="text-sm text-gray-600">
              Built on Lymton Technologies pillars of Agility, Reliability, and Performance to handle enterprise-grade document workloads.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 hover:shadow-md transition group">
              <div className="w-12 h-12 rounded-xl bg-[#ef7632]/10 text-[#ef7632] flex items-center justify-center mb-4 group-hover:bg-[#ef7632] group-hover:text-white transition">
                <FolderKanban size={24} />
              </div>
              <h4 className="text-base font-bold text-[#0d253c] mb-2">Electronic Document Management</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Centralize company records with hierarchical folder structures, automated template generation, and lightning-fast search indexing.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 hover:shadow-md transition group">
              <div className="w-12 h-12 rounded-xl bg-[#0d253c]/10 text-[#0d253c] flex items-center justify-center mb-4 group-hover:bg-[#0d253c] group-hover:text-white transition">
                <Users size={24} />
              </div>
              <h4 className="text-base font-bold text-[#0d253c] mb-2">Employee & Contract Lifecycle</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Monitor staff records, manage departments, track contract expiry thresholds (7 to 60 days), and handle terminations seamlessly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 hover:shadow-md transition group">
              <div className="w-12 h-12 rounded-xl bg-[#ef7632]/10 text-[#ef7632] flex items-center justify-center mb-4 group-hover:bg-[#ef7632] group-hover:text-white transition">
                <PenTool size={24} />
              </div>
              <h4 className="text-base font-bold text-[#0d253c] mb-2">Digital eSignatures</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Execute secure, legally binding signatures on contracts, proposals, and internal approvals without printing a single page.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 hover:shadow-md transition group">
              <div className="w-12 h-12 rounded-xl bg-[#0d253c]/10 text-[#0d253c] flex items-center justify-center mb-4 group-hover:bg-[#0d253c] group-hover:text-white transition">
                <Building2 size={24} />
              </div>
              <h4 className="text-base font-bold text-[#0d253c] mb-2">Multi-Tenant Sub-Companies</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Manage multiple subsidiaries and independent corporate entities under one unified master control panel with tenant branding.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 hover:shadow-md transition group">
              <div className="w-12 h-12 rounded-xl bg-[#ef7632]/10 text-[#ef7632] flex items-center justify-center mb-4 group-hover:bg-[#ef7632] group-hover:text-white transition">
                <FileText size={24} />
              </div>
              <h4 className="text-base font-bold text-[#0d253c] mb-2">Document Requests & Approval</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Streamline internal workflows by letting departments request files, review permissions, and track status updates in real-time.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 hover:shadow-md transition group">
              <div className="w-12 h-12 rounded-xl bg-[#0d253c]/10 text-[#0d253c] flex items-center justify-center mb-4 group-hover:bg-[#0d253c] group-hover:text-white transition">
                <ShieldCheck size={24} />
              </div>
              <h4 className="text-base font-bold text-[#0d253c] mb-2">Role-Based Security</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Protect sensitive corporate data with granular permission controls, audit logs, and encrypted user access credentials.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0d253c]/10 text-[#0d253c] text-xs font-semibold tracking-wide uppercase">
                About Lymton Technologies
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0d253c] tracking-tight">
                Driving Corporate <span style={{ color: '#ef7632' }}>Agility & Performance</span>
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                At Lymton Technologies, we engineer robust digital ecosystems that eliminate bureaucratic bottlenecks. Our Electronic Document Management System (EDMS) is meticulously crafted to empower organizations to store, retrieve, secure, and manage their workforce and records with ultimate confidence.
              </p>

              <div className="space-y-2.5 pt-1">
                <div className="flex items-center gap-2.5 font-medium text-sm text-gray-800">
                  <CheckCircle2 className="text-[#ef7632]" size={18} />
                  <span>Agile document indexing and instant retrieval</span>
                </div>
                <div className="flex items-center gap-2.5 font-medium text-sm text-gray-800">
                  <CheckCircle2 className="text-[#ef7632]" size={18} />
                  <span>Reliable automated contract expiry alerts</span>
                </div>
                <div className="flex items-center gap-2.5 font-medium text-sm text-gray-800">
                  <CheckCircle2 className="text-[#ef7632]" size={18} />
                  <span>High-performance cloud architecture for scaling enterprises</span>
                </div>
              </div>

              <div className="pt-3">
                <Link 
                  href="/signup" 
                  style={{ backgroundColor: '#0d253c' }}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-white font-semibold text-xs shadow-md hover:opacity-90 transition"
                >
                  Join Lymton EDMS Today <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            <div className="bg-[#0d253c] p-8 sm:p-10 rounded-2xl text-white space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-x-6 translate-y-6 w-52 h-52 bg-[#ef7632]/20 rounded-full blur-2xl"></div>
              
              <h3 className="text-xl font-bold tracking-tight">Ready to Modernize Your Office?</h3>
              <p className="text-gray-300 text-xs leading-relaxed">
                Log in to access your company dashboard, manage active contracts, and oversee your document workflows instantly.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link 
                  href="/login" 
                  style={{ backgroundColor: '#ef7632' }}
                  className="w-full text-center py-3 px-5 rounded-xl font-semibold text-white shadow-md text-xs hover:opacity-95 transition"
                >
                  Log In Now
                </Link>
                <Link 
                  href="/signup" 
                  className="w-full text-center py-3 px-5 rounded-xl font-semibold bg-white text-[#0d253c] hover:bg-gray-100 transition text-xs"
                >
                  Create Account
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-xl mx-auto space-y-3 mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#ef7632]">Get in Touch</h2>
            <h3 className="text-2xl font-extrabold text-[#0d253c]">We Are Here to Assist Your Business</h3>
            <p className="text-xs text-gray-600">
              Reach out to our engineering and support team for custom enterprise onboarding or queries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            
            {/* Email Card */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-[#ef7632]/10 text-[#ef7632] flex items-center justify-center shrink-0">
                <Mail size={24} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Email Address</div>
                <a href="mailto:info@lymtontech.com" className="text-sm sm:text-base font-bold text-[#0d253c] hover:text-[#ef7632] transition">
                  info@lymtontech.com
                </a>
              </div>
            </div>

            {/* Phone Card */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-[#0d253c]/10 text-[#0d253c] flex items-center justify-center shrink-0">
                <Phone size={24} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Phone Number</div>
                <a href="tel:0715428479" className="text-sm sm:text-base font-bold text-[#0d253c] hover:text-[#ef7632] transition">
                  0715428479
                </a>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d253c] text-white py-10 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Lymton Technologies Logo" 
              className="w-8 h-8 object-contain rounded-lg bg-white p-0.5"
            />
            <div>
              <span className="text-sm font-extrabold tracking-tight block leading-none">
                LYMTON TECHNOLOGIES
              </span>
              <span className="text-[9px] font-semibold text-gray-400 tracking-widest uppercase block mt-1">
                Agility • Reliability • Performance
              </span>
            </div>
          </div>

          <div className="text-xs text-gray-400 text-center md:text-right">
            &copy; {new Date().getFullYear()} Lymton Technologies. All rights reserved. EDMS Platform.
          </div>
        </div>
      </footer>

    </div>
  );
}