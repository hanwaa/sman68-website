"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Bot, Phone, RotateCcw, Send, X } from "lucide-react";
import { DEFAULT_CHIPS, ERROR_ANSWER, GREETING } from "@/lib/chat-copy";
import { schoolData } from "@/lib/school-data";

type ChatLink = { label: string; href: string };
type ChatMessage = { id: number; role: "user" | "bot"; text: string; link?: ChatLink; sources?: ChatLink[] };

const kontak = schoolData.kontak;
const MAX_LENGTH = 400;

const greetingMessage = (): ChatMessage => ({ id: 0, role: "bot", text: GREETING });

export default function SchoolChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([greetingMessage()]);
  const [chips, setChips] = useState<string[]>(DEFAULT_CHIPS);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, pending, chips]);

  const send = useCallback(async (raw: string) => {
    const text = raw.trim();
    if (!text || pending) return;

    setMessages((prev) => [
      ...prev,
      { id: prev.length, role: "user", text },
    ]);
    setInput("");
    setPending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = (await response.json()) as {
        answer?: string;
        link?: ChatLink;
        sources?: ChatLink[];
        chips?: string[];
      };

      const answer = response.ok && data.answer ? data.answer : ERROR_ANSWER;
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length,
          role: "bot",
          text: answer,
          link: response.ok ? data.link : undefined,
          sources: response.ok ? data.sources : undefined,
        },
      ]);
      setChips(
        response.ok && data.chips?.length ? data.chips : ["Kontak sekolah", "Info PPDB", "Prestasi terbaru"]
      );
    } catch {
      setMessages((prev) => [...prev, { id: prev.length, role: "bot", text: ERROR_ANSWER }]);
      setChips(["Kontak sekolah", "Info PPDB", "Jam pelajaran"]);
    } finally {
      setPending(false);
    }
  }, [pending]);

  const reset = () => {
    setMessages([greetingMessage()]);
    setChips(DEFAULT_CHIPS);
    setInput("");
    inputRef.current?.focus({ preventScroll: true });
  };

  return (
    <motion.div
      key="chat"
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="w-[min(21rem,calc(100vw-2rem))] h-[min(30rem,70vh)] bg-white rounded-2xl shadow-card-hover border border-line overflow-hidden flex flex-col"
      role="dialog"
      aria-label="Tanya sekolah"
    >
      <div className="bg-brand-pine px-3.5 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-xl bg-brand-lime/15 flex items-center justify-center flex-shrink-0">
            <Bot size={16} className="text-brand-lime" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="text-white font-semibold text-sm leading-tight">Tanya Sekolah</div>
            <div className="text-white/50 text-[10px] truncate">
              Jawaban otomatis · SMAN 68 Jakarta
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={reset}
            className="btn-icon-dark"
            aria-label="Mulai ulang percakapan"
          >
            <RotateCcw size={15} />
          </button>
          <button onClick={onClose} className="btn-icon-dark" aria-label="Tutup tanya sekolah">
            <X size={16} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5">
        {messages.map((message) => (
          <div key={message.id} className={message.role === "user" ? "flex justify-end" : ""}>
            <div
              className={
                message.role === "user"
                  ? "max-w-[85%] bg-brand-green text-white rounded-2xl rounded-br-md px-3 py-2 text-sm leading-relaxed whitespace-pre-line"
                  : "max-w-[88%] bg-mist text-ink rounded-2xl rounded-bl-md px-3 py-2 text-sm leading-relaxed whitespace-pre-line"
              }
            >
              {message.text}
              {message.link && (
                <a
                  href={message.link.href}
                  target={message.link.href.startsWith("http") ? "_blank" : undefined}
                  rel={message.link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="mt-2 flex w-fit items-center gap-1 text-xs font-semibold text-brand-green hover:underline"
                >
                  {message.link.label}
                  <ArrowUpRight size={12} aria-hidden="true" />
                </a>
              )}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 border-t border-brand-green/15 pt-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                    Sumber web
                  </div>
                  <ul className="space-y-0.5">
                    {message.sources.map((source) => (
                      <li key={source.href}>
                        <a
                          href={source.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-1 text-[11px] leading-snug text-brand-green hover:underline"
                        >
                          <ArrowUpRight size={11} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
                          <span className="line-clamp-2">{source.label}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}

        {pending && (
          <div className="bg-mist text-ink rounded-2xl rounded-bl-md px-3 py-2.5 w-fit flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green/60 animate-bounce" />
            <span
              className="w-1.5 h-1.5 rounded-full bg-brand-green/60 animate-bounce"
              style={{ animationDelay: "0.15s" }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-brand-green/60 animate-bounce"
              style={{ animationDelay: "0.3s" }}
            />
            <span className="sr-only">Asisten sedang mencari jawaban</span>
          </div>
        )}

        {!pending && chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {chips.map((chip) => (
              <button
                key={chip}
                onClick={() => send(chip)}
                className="rounded-full border border-brand-green/25 px-2.5 py-1 text-[11px] font-medium text-brand-green hover:bg-brand-green/10 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-line px-3 pt-2 pb-2.5 space-y-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={MAX_LENGTH}
            placeholder="Tulis pertanyaan Anda..."
            aria-label="Pesan untuk asisten sekolah"
            className="flex-1 h-10 rounded-xl border border-line px-3 text-sm text-ink placeholder:text-muted/70 bg-white focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none transition"
          />
          <button
            type="submit"
            disabled={pending || input.trim().length === 0}
            aria-label="Kirim pesan"
            className="w-10 h-10 rounded-xl bg-brand-green text-white flex items-center justify-center hover:bg-brand-green-deep disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </form>
        <p className="text-[11px] text-muted flex items-center gap-1.5">
          <span>Belum ketemu? Tata usaha:</span>
          <a
            href={kontak.teleponHref}
            className="inline-flex items-center gap-1 font-semibold text-brand-green hover:underline"
          >
            <Phone size={11} aria-hidden="true" />
            {kontak.telepon}
          </a>
        </p>
      </div>
    </motion.div>
  );
}
