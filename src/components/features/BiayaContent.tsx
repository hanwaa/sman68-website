"use client";

import Link from "next/link";
import {
  Wallet,
  GraduationCap,
  HeartHandshake,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import { useContent } from "@/lib/use-content";

const SCHOLARSHIP_ICONS = [Wallet, GraduationCap, HeartHandshake];

export default function BiayaContent() {
  const ppdb = useContent<{
    steps: { title: string; description: string }[];
    schedule: { label: string; date: string; note?: string }[];
    fees: { label: string; amount: string; note?: string }[];
    scholarships: { title: string; description: string }[];
  }>("ppdb", { steps: [], schedule: [], fees: [], scholarships: [] });

  const komponen = ppdb.fees.map((fee) => ({
    label: fee.label,
    value: fee.amount,
    desc: fee.note ?? "",
  }));

  const beasiswa = ppdb.scholarships.map((scholarship, i) => ({
    icon: SCHOLARSHIP_ICONS[i] ?? Wallet,
    title: scholarship.title,
    desc: scholarship.description,
  }));

  return (
    <div className="container-custom py-10 space-y-10">
      <section aria-label="Rincian komponen biaya">
        <h2 className="font-display font-extrabold text-2xl text-ink mb-2">
          Rincian Komponen Biaya
        </h2>
        <p className="text-muted text-sm mb-6 max-w-2xl">
          Pendaftaran PPDB melalui jalur resmi <strong>tidak dipungut biaya</strong>. Rincian di
          bawah hanya berlaku untuk komponen opsional setelah siswa diterima.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {komponen.map((item) => (
            <div key={item.label} className="card p-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="font-semibold text-ink text-sm">{item.label}</span>
                <span className="badge bg-brand-green/10 text-brand-green">{item.value}</span>
              </div>
              <p className="text-muted text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-start gap-3 bg-brand-mist border border-brand-leaf/20 rounded-xl p-4 max-w-3xl">
          <Info size={16} className="text-brand-green flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-muted leading-relaxed">
            Waspadai pihak yang meminta biaya pendaftaran. Semua proses resmi PPDB DKI Jakarta
            dilakukan melalui portal <strong>ppdb.jakarta.go.id</strong> tanpa perantara.
          </p>
        </div>
      </section>

      <section aria-label="Jalur beasiswa">
        <h2 className="font-display font-extrabold text-2xl text-ink mb-6">Jalur Beasiswa</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {beasiswa.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="card p-6">
                <div className="w-11 h-11 rounded-xl bg-brand-green/10 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-brand-green" aria-hidden="true" />
                </div>
                <h3 className="font-display font-bold text-ink text-base mb-2">{item.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-xl">
          <h2 className="font-display font-extrabold text-xl text-ink mb-2">Siap mendaftar?</h2>
          <p className="text-muted text-sm leading-relaxed">
            Pendaftaran resmi dibuka melalui portal PPDB DKI Jakarta. Siapkan Kartu Keluarga, Akta
            Kelahiran, dan rapor SMP.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 flex-shrink-0">
          <a
            href="https://ppdb.jakarta.go.id"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary btn-lg"
          >
            <ExternalLink size={15} /> Portal PPDB Resmi
          </a>
          <Link href="/ppdb" className="btn-ghost btn-lg">
            Alur Pendaftaran
            <ChevronRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
