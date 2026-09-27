"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { schoolData } from "@/lib/school-data";
import {
  Menu,
  X,
  Search,
  ChevronDown,
  BookOpen,
  Users,
  Star,
  Calendar,
  Map,
  MapPin,
  Trophy,
  LogIn,
  ExternalLink,
  Wallet,
  HelpCircle,
  Phone,
  Mail,
} from "lucide-react";

function InstagramIcon({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function YoutubeIcon({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

const navItems = [
  { label: "Beranda", href: "/" },
  {
    label: "PPDB",
    href: "/ppdb",
    highlight: true,
    children: [
      { label: "Alur & Jadwal", href: "/ppdb#alur", icon: Calendar },
      { label: "Biaya & Beasiswa", href: "/ppdb/biaya", icon: Wallet },
      { label: "FAQ PPDB", href: "/ppdb/faq", icon: HelpCircle },
      {
        label: "Portal PPDB Resmi",
        href: "https://ppdb.jakarta.go.id",
        icon: ExternalLink,
        external: true,
      },
    ],
  },
  {
    label: "Profil",
    href: "/tentang",
    children: [
      { label: "Profil Sekolah", href: "/tentang/profil", icon: BookOpen },
      { label: "Visi & Misi", href: "/tentang/visi-misi", icon: Star },
      { label: "Guru & Staf", href: "/tentang/guru-staf", icon: Users },
      { label: "Fasilitas", href: "/tentang/fasilitas", icon: Map },
    ],
  },
  {
    label: "Akademik",
    href: "/akademik",
    children: [
      { label: "Program Studi", href: "/akademik/program", icon: BookOpen },
      { label: "Ekstrakurikuler", href: "/kehidupan/ekskul", icon: Star },
    ],
  },
  {
    label: "Informasi",
    href: "/berita",
    children: [
      { label: "Berita", href: "/berita", icon: BookOpen },
      { label: "Prestasi", href: "/prestasi", icon: Trophy },
      { label: "Galeri", href: "/kehidupan/galeri", icon: Map },
    ],
  },
  {
    label: "Komunitas",
    href: "/komunitas",
    children: [
      { label: "Alumni", href: "/komunitas/alumni", icon: Users },
      { label: "Testimoni", href: "/#testimoni", icon: Star },
    ],
  },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const dropdownTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  useEffect(() => {
    if (scrolled) setActiveDropdown(null);
  }, [scrolled]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleDropdownEnter = (label: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setActiveDropdown(label);
  };

  const handleDropdownLeave = () => {
    dropdownTimeout.current = setTimeout(() => setActiveDropdown(null), 150);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      const target = e.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;
      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-brand-pine border-b border-white/10"
        role="banner"
      >
        <div
          className={cn(
            "hidden md:block overflow-hidden border-b bg-white transition-all duration-300 ease-out",
            scrolled ? "h-0 opacity-0 border-transparent" : "h-9 opacity-100 border-line"
          )}
        >
          <div className="container-custom flex h-9 items-center justify-between text-xs">
            <div className="flex items-center gap-4 text-ink">
              <a
                href={schoolData.kontak.teleponHref}
                className="inline-flex items-center gap-1.5 font-semibold hover:text-brand-green transition-colors"
              >
                <Phone size={12} aria-hidden="true" />
                {schoolData.kontak.telepon}
              </a>
              <span className="w-px h-3.5 bg-line" aria-hidden="true" />
              <a
                href={schoolData.kontak.emailHref}
                className="inline-flex items-center gap-1.5 font-semibold hover:text-brand-green transition-colors"
              >
                <Mail size={12} aria-hidden="true" />
                {schoolData.kontak.email}
              </a>
              <span className="w-px h-3.5 bg-line hidden xl:block" aria-hidden="true" />
              <a
                href={schoolData.kontak.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden xl:inline-flex items-center gap-1.5 font-medium hover:text-brand-green transition-colors"
              >
                <MapPin size={12} aria-hidden="true" />
                Jl. Salemba Raya No. 18, Jakarta Pusat
              </a>
            </div>

            <div className="flex items-center gap-4">
              <span className="hidden lg:inline text-ink/70">
                Senin–Jumat, 07.00–15.30 WIB
              </span>
              <span className="w-px h-3.5 bg-line hidden lg:block" aria-hidden="true" />
              <div className="flex items-center gap-3 text-ink/70">
                <a
                  href="https://www.instagram.com/smanegeri68jakarta/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram SMAN 68 Jakarta"
                  className="hover:text-brand-green transition-colors"
                >
                  <InstagramIcon size={13} />
                </a>
                <a
                  href="https://youtube.com/@sman68jakarta"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube SMAN 68 Jakarta"
                  className="hover:text-brand-green transition-colors"
                >
                  <YoutubeIcon size={13} />
                </a>
              </div>
              <span className="w-px h-3.5 bg-line" aria-hidden="true" />
              <Link
                href="/ppdb"
                className="font-semibold text-brand-green hover:text-brand-pine transition-colors"
              >
                Informasi PPDB
              </Link>
              <span className="w-px h-3.5 bg-line" aria-hidden="true" />
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-brand-pine text-white text-xs font-semibold hover:bg-brand-green transition-colors"
                aria-label="Masuk ke portal"
              >
                <LogIn size={12} />
                Masuk
              </Link>
            </div>
          </div>
        </div>

        <nav className="container-custom" aria-label="Navigasi utama">
          <div
            className={cn(
              "relative flex items-center justify-between transition-all duration-300 ease-out",
              scrolled ? "h-16" : "h-24"
            )}
          >
            <Link
              href="/"
              className="flex items-center group flex-shrink-0"
              aria-label="SMAN 68 Jakarta - Beranda"
            >
              <div
                className={cn(
                  "relative flex-shrink-0 group-hover:scale-105 transition-all duration-300 ease-out",
                  scrolled ? "w-10 h-10" : "w-14 h-14"
                )}
              >
                <Image
                  src="/assets/logo.png"
                  alt="Logo SMAN 68 Jakarta"
                  fill
                  className="object-contain"
                  sizes="56px"
                />
              </div>
            </Link>

            <ul
              className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 lg:flex"
              role="list"
            >
              {navItems.map((item) => (
                <li key={item.label} className="relative">
                  {item.children ? (
                    <div
                      onMouseEnter={() => handleDropdownEnter(item.label)}
                      onMouseLeave={handleDropdownLeave}
                    >
                      <button
                        className={cn(
                          "nav-link flex items-center gap-1 px-3 py-2 transition-all duration-300 ease-out",
                          scrolled ? "text-sm" : "text-base",
                          "highlight" in item && item.highlight && "text-brand-lime font-semibold",
                          pathname.startsWith(item.href) && "text-white"
                        )}
                        aria-expanded={activeDropdown === item.label}
                        aria-haspopup="true"
                      >
                        {item.label}
                        <ChevronDown
                          size={14}
                          className={cn(
                            "transition-transform duration-200",
                            activeDropdown === item.label && "rotate-180"
                          )}
                        />
                      </button>

                      {activeDropdown === item.label && (
                        <div
                          className="absolute top-full left-0 mt-2 w-60 bg-white rounded-xl shadow-card py-2 border border-line"
                          role="menu"
                        >
                          {item.children.map((child) => {
                            const Icon = child.icon;
                            const isExternal = "external" in child && child.external;
                            const childClass =
                              "flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-cream hover:text-brand-green transition-colors";
                            return isExternal ? (
                              <a
                                key={child.href}
                                href={child.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(childClass, "font-medium")}
                                role="menuitem"
                              >
                                <Icon size={15} className="text-brand-green flex-shrink-0" />
                                {child.label}
                              </a>
                            ) : (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={childClass}
                                role="menuitem"
                              >
                                <Icon size={15} className="text-brand-green flex-shrink-0" />
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "nav-link px-3 py-2 transition-all duration-300 ease-out",
                        scrolled ? "text-sm" : "text-base",
                        pathname === item.href && "text-white"
                      )}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden md:flex items-center gap-2 h-9 w-40 xl:w-56 px-3 rounded-md border border-white/15 bg-white/5 text-sm text-white/60 hover:bg-white/10 hover:border-white/25 hover:text-white/85 transition-colors"
                aria-label="Cari berita, prestasi, ekskul (Ctrl+K atau /)"
                title="Cari (Ctrl+K)"
              >
                <Search size={15} className="flex-shrink-0" />
                <span>Cari...</span>
              </button>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="btn-icon-dark lg:hidden"
                aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {mobileOpen && (
        <div
          className={cn(
            "fixed inset-0 z-40 bg-brand-pine flex flex-col transition-all",
            scrolled ? "pt-16" : "pt-24"
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi mobile"
        >
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-1">
            {navItems.map((item) => (
              <div key={item.label}>
                <Link
                  href={item.href}
                  className={cn(
                    "block py-3 text-white font-semibold text-lg border-b border-white/10 hover:text-brand-leaf transition-colors",
                    "highlight" in item && item.highlight && "text-brand-lime"
                  )}
                >
                  {item.label}
                </Link>
                {item.children && (
                  <div className="pl-4 pt-1 space-y-0.5">
                    {item.children.map((child) =>
                      "external" in child && child.external ? (
                        <a
                          key={child.href}
                          href={child.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block py-2 text-white/60 text-sm hover:text-white transition-colors"
                        >
                          {child.label}
                        </a>
                      ) : (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block py-2 text-white/60 text-sm hover:text-white transition-colors"
                        >
                          {child.label}
                        </Link>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-6 space-y-3">
              <Link
                href="/login"
                className="btn-primary btn-lg w-full text-base"
              >
                <LogIn size={16} />
                Masuk Portal
              </Link>
              <Link
                href="/ppdb"
                className="btn-secondary btn-lg w-full text-base"
              >
                Daftar PPDB
              </Link>
            </div>
          </div>
        </div>
      )}

      {searchOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center pt-20 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Pencarian global"
          onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}
        >
          <div className="absolute inset-0 bg-brand-pine/70" />
          <div className="relative w-full max-w-xl bg-white rounded-xl shadow-card border border-line overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
              <Search size={18} className="text-muted flex-shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Cari berita, prestasi, ekskul, guru..."
                className="flex-1 text-sm text-ink placeholder-muted outline-none bg-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Input pencarian"
              />
              <kbd className="text-xs bg-line px-2 py-0.5 rounded font-mono text-muted">
                ESC
              </kbd>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {searchQuery ? (
                (() => {
                  const q = searchQuery.toLowerCase();
                  const results = [
                    { title: "Tim Robotika SMAN 68 Raih Juara 1 Nasional", type: "Berita", href: "/berita/tim-robotika-juara-1-nasional" },
                    { title: "PPDB Resmi Dibuka — Jadwal & Syarat", type: "Pengumuman", href: "/ppdb" },
                    { title: "Festival Seni SMAN 68", type: "Kegiatan", href: "/berita/festival-seni-sman-68" },
                    { title: "Drs. Ahmad Fauzi, M.Pd. — Matematika", type: "Guru", href: "/tentang/guru-staf" },
                    { title: "Basket Putra", type: "Ekskul", href: "/kehidupan/ekskul" },
                    { title: "Paduan Suara", type: "Ekskul", href: "/kehidupan/ekskul" },
                    { title: "Robotika", type: "Ekskul", href: "/kehidupan/ekskul" },
                    { title: "Laboratorium Komputer", type: "Fasilitas", href: "/tentang/fasilitas" },
                    { title: "Perpustakaan", type: "Fasilitas", href: "/tentang/fasilitas" },
                    { title: "Juara 1 Olimpiade Matematika Nasional", type: "Prestasi", href: "/prestasi" },
                    { title: "Best Innovation — International Science Fair", type: "Prestasi", href: "/prestasi" },
                  ].filter((item) => item.title.toLowerCase().includes(q) || item.type.toLowerCase().includes(q));

                  return results.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-xs text-muted mb-2 font-medium">Ditemukan {results.length} hasil:</p>
                      {results.map((r, i) => (
                        <Link
                          key={i}
                          href={r.href}
                          onClick={() => setSearchOpen(false)}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-cream transition-colors group"
                        >
                          <span className="text-sm font-medium text-ink group-hover:text-brand-green transition-colors">
                            {r.title}
                          </span>
                          <span className="badge bg-brand-green/10 text-brand-green text-[10px]">
                            {r.type}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted text-center py-8">
                      Tidak ada hasil untuk &ldquo;<strong className="text-ink">{searchQuery}</strong>&rdquo;
                    </div>
                  );
                })()
              ) : (
                <div>
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                    Pintasan Cepat
                  </p>
                  <div className="space-y-1">
                    {[
                      { label: "Prestasi Terbaru", href: "/prestasi", icon: Trophy },
                      { label: "Agenda & Jadwal", href: "/dashboard", icon: Calendar },
                      { label: "Info PPDB", href: "/ppdb", icon: BookOpen },
                      { label: "Ekskul & Organisasi", href: "/kehidupan/ekskul", icon: Users },
                      { label: "Guru & Staf", href: "/tentang/guru-staf", icon: Users },
                      { label: "Fasilitas & Denah Ruang", href: "/tentang/fasilitas", icon: Map },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSearchOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cream text-sm text-ink transition-colors"
                        >
                          <Icon size={15} className="text-brand-green" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
