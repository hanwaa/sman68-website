"use client";

import Link from "next/link";
import { ChevronDown, ExternalLink, MessageCircle } from "lucide-react";
import { useContent } from "@/lib/use-content";

export default function FaqContent() {
  const faqData = useContent<{ id: string; question: string; answer: string; category: string }[]>("faqs", []);
  const faqs = faqData
    .filter((faq) => faq.category === "umum")
    .map((faq) => ({ q: faq.question, a: faq.answer }));

  return (
    <div className="container-custom py-10 max-w-3xl">
      <div className="space-y-3">
        {faqs.map((faq) => (
          <details key={faq.q} className="card group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex items-center justify-between gap-4 cursor-pointer list-none">
              <h2 className="font-semibold text-ink text-sm md:text-base leading-snug">{faq.q}</h2>
              <ChevronDown
                size={18}
                className="text-muted flex-shrink-0 transition-transform duration-200 group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <p className="text-muted text-sm leading-relaxed mt-3 pt-3 border-t border-line">
              {faq.a}
            </p>
          </details>
        ))}
      </div>

      <div className="mt-10 card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center flex-shrink-0">
            <MessageCircle size={18} className="text-brand-green" aria-hidden="true" />
          </div>
          <div>
            <div className="font-display font-bold text-ink text-sm">
              Pertanyaanmu belum terjawab?
            </div>
            <p className="text-muted text-xs mt-0.5">
              Tanya asisten digital kami atau hubungi Tata Usaha.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 flex-shrink-0">
          <a
            href="https://ppdb.jakarta.go.id"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            <ExternalLink size={15} /> Portal PPDB
          </a>
          <Link href="/ppdb" className="btn-ghost">
            Alur Pendaftaran
          </Link>
        </div>
      </div>
    </div>
  );
}
