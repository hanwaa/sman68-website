export const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export type AgendaCategory = "Akademik" | "Ekskul" | "Seremonial" | "Kegiatan" | "Organisasi" | "Rapat";

export type AgendaEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: AgendaCategory;
  color: string;
};

export const agendaCatColors: Record<string, string> = {
  Akademik: "bg-brand-pine/10 text-brand-pine border-brand-pine/15",
  Ekskul: "bg-brand-green/10 text-brand-green border-brand-leaf/20",
  Seremonial: "bg-brand-green/10 text-brand-green border-brand-green/20",
  Kegiatan: "bg-brand-leaf/15 text-brand-green border-brand-leaf/20",
  Organisasi: "bg-brand-green/10 text-brand-green border-brand-leaf/20",
  Rapat: "bg-brand-mist text-brand-green border-brand-leaf/20",
};
