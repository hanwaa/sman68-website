"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, ExternalLink, LogIn } from "lucide-react";
import { schoolData } from "@/lib/school-data";
import PhotoBackdrop from "@/components/sections/PhotoBackdrop";

const contacts = [
  {
    icon: MapPin,
    label: "Alamat",
    value: schoolData.kontak.alamat,
    href: schoolData.kontak.mapsUrl,
    external: true,
  },
  {
    icon: Phone,
    label: "Telepon",
    value: schoolData.kontak.telepon,
    href: schoolData.kontak.teleponHref,
  },
  {
    icon: Mail,
    label: "Email",
    value: schoolData.kontak.email,
    href: schoolData.kontak.emailHref,
  },
  {
    icon: Clock,
    label: "Jam Layanan",
    value: "Senin–Jumat, 07.00–15.30 WIB",
  },
];

export default function ContactSection() {
  return (
    <section
      id="kontak"
      className="relative section-padding bg-brand-pine scroll-mt-20"
      aria-label="Kontak dan kunjungan"
    >
      <PhotoBackdrop src="/assets/sekolah/sekolah-03-papan-nama.jpg" overlayClassName="bg-black/55" />

      <div className="container-custom relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <h2 className="font-display display-heading text-white">
            Kunjungi <span className="text-brand-lime">SMAN 68</span> Jakarta
          </h2>
          <p className="mt-4 text-white/65 text-base md:text-lg leading-relaxed">
            Kami terbuka untuk kunjungan calon siswa dan orang tua pada jam layanan sekolah.
          </p>
        </motion.div>

        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {contacts.map((item, i) => {
            const Icon = item.icon;
            const content = (
              <>
                <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-lime/15 flex items-center justify-center mb-3 sm:mb-4">
                  <Icon size={18} className="text-brand-lime" aria-hidden="true" />
                </span>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-white/45 mb-1">
                  {item.label}
                </span>
                <span className="block text-sm text-white/85 leading-relaxed">
                  {item.value}
                </span>
              </>
            );

            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
              >
                {item.href ? (
                  <a
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="group flex flex-col h-full rounded-2xl border border-edge-1 bg-surface-1 p-4 sm:p-6 hover:bg-surface-2 hover:border-edge-2 transition-colors"
                  >
                    {content}
                  </a>
                ) : (
                  <div className="flex flex-col h-full rounded-2xl border border-edge-1 bg-surface-1 p-4 sm:p-6">
                    {content}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex flex-wrap gap-3"
        >
          <a
            href={schoolData.kontak.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-accent"
          >
            <MapPin size={15} /> Lihat Lokasi di Maps
          </a>
          <Link
            href="/login"
            className="btn-secondary"
          >
            <LogIn size={15} /> Masuk Portal
          </Link>
          <a
            href={schoolData.kontak.emailHref}
            className="btn-secondary"
          >
            <ExternalLink size={15} /> Kirim Email
          </a>
        </motion.div>
      </div>
    </section>
  );
}
