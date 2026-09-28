import Link from "next/link";
import Image from "next/image";
import {
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Link as LinkIcon,
  Play,
  Share2,
} from "lucide-react";
import { schoolData } from "@/lib/school-data";

const footerLinks = {
  tentang: {
    title: "Tentang SMAN 68",
    links: [
      { label: "Profil Sekolah", href: "/tentang/profil" },
      { label: "Visi & Misi", href: "/tentang/visi-misi" },
      { label: "Guru & Staf", href: "/tentang/guru-staf" },
      { label: "Fasilitas", href: "/tentang/fasilitas" },
    ],
  },
  layanan: {
    title: "Akses Cepat",
    links: [
      { label: "Ruang Siswa", href: "/dashboard" },
      { label: "Info PPDB", href: "/ppdb" },
      { label: "Ruang Orang Tua", href: "/#kontak" },
      { label: "Berita", href: "/berita" },
      { label: "Galeri", href: "/kehidupan/galeri" },
    ],
  },
  kehidupan: {
    title: "Kehidupan Sekolah",
    links: [
      { label: "Berita", href: "/berita" },
      { label: "Ekskul", href: "/kehidupan/ekskul" },
      { label: "Prestasi", href: "/prestasi" },
      { label: "Alumni", href: "/komunitas/alumni" },
    ],
  },
};

const socialLinks = [
  { icon: Share2, label: "Instagram SMAN 68", href: "https://www.instagram.com/smanegeri68jakarta/" },
  { icon: Play, label: "YouTube SMAN 68", href: "https://youtube.com/@sman68jakarta" },
  { icon: LinkIcon, label: "Facebook SMAN 68", href: "https://facebook.com/sman68jakarta" },
];

export default function Footer() {
  return (
    <footer className="bg-brand-pine text-white a11y-layer" role="contentinfo">
      <div className="container-custom">
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 group mb-4">
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image
                  src="/assets/logo.png"
                  alt="Logo SMAN 68 Jakarta"
                  fill
                  className="object-contain"
                  sizes="40px"
                />
              </div>
              <div>
                <span className="font-display font-extrabold text-white text-lg tracking-tight leading-none block whitespace-nowrap">
                  SMAN 68 JAKARTA
                </span>
              </div>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-xs">
              SMA Negeri 68 Jakarta. Unggul dalam Prestasi, Teguh dalam Karakter.
            </p>
            <div className="space-y-2 text-sm text-white/60">
              <div className="flex items-start gap-2">
                <MapPin size={15} className="text-brand-lime mt-0.5 flex-shrink-0" />
                <span>{schoolData.kontak.alamat}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={15} className="text-brand-lime flex-shrink-0" />
                <a href={schoolData.kontak.teleponHref} className="hover:text-white transition-colors">
                  {schoolData.kontak.telepon}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={15} className="text-brand-lime flex-shrink-0" />
                <a href={schoolData.kontak.emailHref} className="hover:text-white transition-colors">
                  {schoolData.kontak.email}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/60 hover:bg-brand-lime hover:text-brand-pine transition-colors duration-200 ease-out"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h2 className="font-semibold text-sm text-white mb-4 uppercase tracking-wider">
                {section.title}
              </h2>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/60">
            © {new Date().getFullYear()} SMA Negeri 68 Jakarta. Hak cipta dilindungi.
          </p>
          <div className="flex items-center gap-6 text-sm text-white/60">
            <Link href="/kebijakan-privasi" className="hover:text-white transition-colors">
              Kebijakan Privasi
            </Link>
            <Link href="/sitemap.xml" className="hover:text-white transition-colors flex items-center gap-1">
              Sitemap <ExternalLink size={12} />
            </Link>
            <Link href="/aksesibilitas" className="hover:text-white transition-colors">
              Aksesibilitas
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
