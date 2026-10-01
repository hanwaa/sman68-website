import { redirect } from "next/navigation";

// Halaman lama /tentang/guru-staf diganti dua halaman baru:
// /tentang/struktur-organisasi dan /tentang/struktur-tu.
export default function GuruStafLegacy() {
  redirect("/tentang/struktur-organisasi");
}
