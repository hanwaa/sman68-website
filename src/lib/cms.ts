import { EKSKUL_CATEGORIES } from "@/lib/ekskul";

export type CmsFieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "datetime"
  | "image"
  | "images"
  | "list";

export type CmsField = {
  name: string;
  label: string;
  type: CmsFieldType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
};

export type CmsResource = {
  id: string;
  table: string;
  label: string;
  primaryKey: string;
  orderBy: string;
  singleton?: boolean;
  listColumns: { name: string; label: string }[];
  fields: CmsField[];
};

export const CMS_RESOURCES: CmsResource[] = [
  {
    id: "news",
    table: "news",
    label: "Berita",
    primaryKey: "id",
    orderBy: "published_at desc",
    listColumns: [
      { name: "title", label: "Judul" },
      { name: "category", label: "Kategori" },
      { name: "status", label: "Status" },
      { name: "published_at", label: "Terbit" },
    ],
    fields: [
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "title", label: "Judul", type: "text", required: true },
      { name: "category", label: "Kategori", type: "select", options: ["Prestasi", "Kegiatan", "Pengumuman", "Akademik", "Alumni"] },
      { name: "author", label: "Penulis", type: "text" },
      { name: "excerpt", label: "Ringkasan", type: "textarea" },
      { name: "content", label: "Isi Berita", type: "textarea" },
      { name: "cover_key", label: "Cover (upload/URL)", type: "image", placeholder: "/assets/hero-1.png" },
      { name: "views", label: "Dilihat", type: "number" },
      { name: "status", label: "Status", type: "select", options: ["draft", "pending", "published", "archived"] },
      { name: "published_at", label: "Tanggal Terbit", type: "datetime" },
    ],
  },
  {
    id: "achievements",
    table: "achievements",
    label: "Prestasi",
    primaryKey: "id",
    orderBy: "case status when 'draft' then 0 when 'pending' then 1 else 2 end, year desc",
    listColumns: [
      { name: "title", label: "Judul" },
      { name: "level", label: "Tingkat" },
      { name: "year", label: "Tahun" },
      { name: "status", label: "Status" },
    ],
    fields: [
      { name: "id", label: "ID (slug, opsional)", type: "text" },
      { name: "title", label: "Judul", type: "text", required: true },
      { name: "description", label: "Deskripsi", type: "textarea", required: true },
      { name: "level", label: "Tingkat", type: "select", options: ["internasional", "nasional", "provinsi", "kota", "sekolah"] },
      { name: "category", label: "Bidang", type: "text" },
      { name: "award_type", label: "Jenis Penghargaan", type: "select", options: ["juara1", "juara2", "juara3", "semifinal", "partisipasi", "penghargaan"] },
      { name: "year", label: "Tahun", type: "number" },
      { name: "cover_key", label: "Cover (upload/URL)", type: "image" },
      { name: "status", label: "Status", type: "select", options: ["pending", "draft", "published", "rejected"] },
      { name: "student_name", label: "Nama Siswa (opsional)", type: "text" },
      {
        name: "participants",
        label: "Peserta (satu nama per baris)",
        type: "list",
        placeholder: "Satu nama per baris (contoh: Bima Putra, Sari Dewi)",
      },
    ],
  },
  {
    id: "extracurriculars",
    table: "extracurriculars",
    label: "Ekskul",
    primaryKey: "id",
    orderBy: "sort asc",
    listColumns: [
      { name: "id", label: "ID" },
      { name: "name", label: "Nama" },
      { name: "category", label: "Kategori" },
      { name: "members", label: "Anggota" },
    ],
    fields: [
      { name: "id", label: "ID (slug)", type: "text", required: true },
      { name: "name", label: "Nama", type: "text", required: true },
      { name: "category", label: "Kategori", type: "select", options: [...EKSKUL_CATEGORIES] },
      { name: "logo_key", label: "Logo (upload/URL)", type: "image" },
      { name: "thumb_key", label: "Thumbnail (upload/URL)", type: "image" },
      { name: "members", label: "Jumlah Anggota", type: "number" },
      { name: "achievements", label: "Jumlah Prestasi", type: "number" },
      { name: "description", label: "Deskripsi", type: "textarea" },
      { name: "schedule", label: "Jadwal", type: "text" },
      { name: "advisor", label: "Pembina", type: "text" },
      { name: "sort", label: "Urutan", type: "number" },
    ],
  },
  {
    id: "teachers",
    table: "teachers",
    label: "Guru & Staf",
    primaryKey: "id",
    orderBy: "sort asc",
    listColumns: [
      { name: "id", label: "ID" },
      { name: "name", label: "Nama" },
      { name: "subject", label: "Mapel" },
      { name: "position", label: "Jabatan" },
    ],
    fields: [
      { name: "id", label: "ID (slug)", type: "text", required: true },
      { name: "name", label: "Nama", type: "text", required: true },
      { name: "subject", label: "Mata Pelajaran", type: "text" },
      { name: "position", label: "Jabatan", type: "text" },
      { name: "photo_key", label: "Foto (upload/URL)", type: "image" },
      { name: "email", label: "Email", type: "text" },
      { name: "sort", label: "Urutan", type: "number" },
    ],
  },
  {
    id: "facilities",
    table: "facilities",
    label: "Fasilitas",
    primaryKey: "id",
    orderBy: "sort asc",
    listColumns: [
      { name: "id", label: "ID" },
      { name: "name", label: "Nama" },
      { name: "floor", label: "Lantai" },
      { name: "category", label: "Kategori" },
    ],
    fields: [
      { name: "id", label: "ID (slug)", type: "text", required: true },
      { name: "name", label: "Nama", type: "text", required: true },
      { name: "category", label: "Kategori", type: "text" },
      { name: "floor", label: "Lantai", type: "text" },
      { name: "building", label: "Gedung", type: "text" },
      { name: "capacity", label: "Kapasitas", type: "number" },
      { name: "description", label: "Deskripsi", type: "textarea" },
      { name: "image_key", label: "Foto Utama (upload/URL)", type: "image" },
      { name: "images", label: "Galeri Foto (satu URL per baris)", type: "images" },
      { name: "sort", label: "Urutan", type: "number" },
    ],
  },
  {
    id: "testimonials",
    table: "testimonials",
    label: "Testimoni",
    primaryKey: "id",
    orderBy: "sort asc",
    listColumns: [
      { name: "id", label: "ID" },
      { name: "name", label: "Nama" },
      { name: "role", label: "Peran" },
    ],
    fields: [
      { name: "id", label: "ID (slug)", type: "text", required: true },
      { name: "name", label: "Nama", type: "text", required: true },
      { name: "role", label: "Peran", type: "text" },
      { name: "quote", label: "Kutipan", type: "textarea", required: true },
      { name: "photo_key", label: "Inisial/Foto (upload/URL)", type: "image" },
      { name: "sort", label: "Urutan", type: "number" },
    ],
  },
  {
    id: "faqs",
    table: "faqs",
    label: "FAQ",
    primaryKey: "id",
    orderBy: "sort asc",
    listColumns: [
      { name: "id", label: "ID" },
      { name: "question", label: "Pertanyaan" },
      { name: "category", label: "Kategori" },
    ],
    fields: [
      { name: "id", label: "ID (slug)", type: "text", required: true },
      { name: "question", label: "Pertanyaan", type: "text", required: true },
      { name: "answer", label: "Jawaban", type: "textarea", required: true },
      { name: "category", label: "Kategori", type: "select", options: ["umum", "ppdb"] },
      { name: "sort", label: "Urutan", type: "number" },
    ],
  },
  {
    id: "events",
    table: "events",
    label: "Agenda Sekolah",
    primaryKey: "id",
    orderBy: "start_at asc",
    listColumns: [
      { name: "id", label: "ID" },
      { name: "title", label: "Kegiatan" },
      { name: "start_at", label: "Mulai" },
      { name: "location", label: "Lokasi" },
    ],
    fields: [
      { name: "id", label: "ID (slug)", type: "text", required: true },
      { name: "title", label: "Nama Kegiatan", type: "text", required: true },
      { name: "category", label: "Kategori", type: "select", options: ["Akademik", "Ekskul", "Seremonial", "Kegiatan", "Organisasi", "Rapat"] },
      { name: "start_at", label: "Waktu Mulai", type: "datetime", required: true },
      { name: "location", label: "Lokasi", type: "text" },
      { name: "description", label: "Deskripsi", type: "textarea" },
    ],
  },
  {
    id: "announcements",
    table: "announcements",
    label: "Pengumuman",
    primaryKey: "id",
    orderBy: "published_at desc",
    listColumns: [
      { name: "title", label: "Judul" },
      { name: "audience", label: "Audiens" },
      { name: "status", label: "Status" },
      { name: "published_at", label: "Terbit" },
    ],
    fields: [
      { name: "title", label: "Judul", type: "text", required: true },
      { name: "body", label: "Isi", type: "textarea" },
      { name: "audience", label: "Audiens", type: "select", options: ["all", "student", "teacher"] },
      { name: "urgent", label: "Mendesak (true/false)", type: "select", options: ["false", "true"] },
      { name: "pinned", label: "Sematkan (true/false)", type: "select", options: ["false", "true"] },
      { name: "author", label: "Penulis", type: "text" },
      { name: "status", label: "Status", type: "select", options: ["draft", "pending", "published", "archived"] },
      { name: "published_at", label: "Tanggal Terbit", type: "datetime" },
    ],
  },
  {
    id: "alumni",
    table: "alumni",
    label: "Alumni",
    primaryKey: "id",
    orderBy: "sort asc",
    listColumns: [
      { name: "id", label: "ID" },
      { name: "name", label: "Nama" },
      { name: "university", label: "Kampus" },
      { name: "job_title", label: "Pekerjaan" },
      { name: "company", label: "Perusahaan" },
      { name: "city", label: "Kota" },
    ],
    fields: [
      { name: "id", label: "ID (slug)", type: "text", required: true },
      { name: "name", label: "Nama", type: "text", required: true },
      { name: "university", label: "Kampus/Universitas", type: "text" },
      { name: "graduation_year", label: "Tahun Lulus", type: "number" },
      { name: "photo_key", label: "Foto (upload/URL)", type: "image" },
      { name: "job_title", label: "Pekerjaan", type: "text" },
      { name: "company", label: "Perusahaan", type: "text" },
      { name: "city", label: "Kota (ID kota)", type: "text" },
      { name: "linkedin_url", label: "LinkedIn", type: "text" },
      { name: "story", label: "Cerita/Bio", type: "textarea" },
      { name: "sort", label: "Urutan", type: "number" },
    ],
  },
  {
    id: "cities",
    table: "cities",
    label: "Kota Alumni",
    primaryKey: "id",
    orderBy: "name asc",
    listColumns: [
      { name: "id", label: "ID" },
      { name: "name", label: "Kota" },
      { name: "province", label: "Provinsi" },
    ],
    fields: [
      { name: "id", label: "ID (slug)", type: "text", required: true },
      { name: "name", label: "Nama Kota", type: "text", required: true },
      { name: "province", label: "Provinsi/Negara", type: "text" },
      { name: "lat", label: "Latitude", type: "number" },
      { name: "lng", label: "Longitude", type: "number" },
    ],
  },
  {
    id: "universities",
    table: "universities",
    label: "Kampus",
    primaryKey: "id",
    orderBy: "name asc",
    listColumns: [
      { name: "id", label: "ID" },
      { name: "name", label: "Kampus" },
      { name: "city", label: "Kota" },
    ],
    fields: [
      { name: "id", label: "ID (slug)", type: "text", required: true },
      { name: "name", label: "Nama Kampus", type: "text", required: true },
      { name: "city", label: "Kota", type: "text" },
      { name: "logo_key", label: "Logo (upload/URL)", type: "image" },
      { name: "lat", label: "Latitude", type: "number" },
      { name: "lng", label: "Longitude", type: "number" },
    ],
  },
  {
    id: "gallery_albums",
    table: "gallery_albums",
    label: "Album Galeri",
    primaryKey: "id",
    orderBy: "sort asc",
    listColumns: [
      { name: "id", label: "ID" },
      { name: "title", label: "Judul" },
      { name: "category", label: "Kategori" },
    ],
    fields: [
      { name: "id", label: "ID (slug)", type: "text", required: true },
      { name: "title", label: "Judul Album", type: "text", required: true },
      { name: "category", label: "Kategori", type: "text" },
      { name: "cover_key", label: "Cover (upload/URL)", type: "image" },
      { name: "taken_at", label: "Tanggal", type: "datetime" },
      { name: "sort", label: "Urutan", type: "number" },
    ],
  },
  {
    id: "gallery_photos",
    table: "gallery_photos",
    label: "Foto Galeri",
    primaryKey: "id",
    orderBy: "sort asc",
    listColumns: [
      { name: "image_key", label: "Foto" },
      { name: "caption", label: "Keterangan" },
      { name: "album_id", label: "Album" },
    ],
    fields: [
      { name: "album_id", label: "ID Album", type: "text" },
      { name: "image_key", label: "Foto (upload/URL)", type: "image", required: true },
      { name: "caption", label: "Keterangan", type: "text" },
      { name: "sort", label: "Urutan", type: "number" },
    ],
  },
  {
    id: "hero_slides",
    table: "hero_slides",
    label: "Hero Slideshow",
    primaryKey: "id",
    orderBy: "sort asc",
    listColumns: [
      { name: "id", label: "ID" },
      { name: "caption", label: "Caption" },
      { name: "sort", label: "Urutan" },
    ],
    fields: [
      { name: "id", label: "ID (slug)", type: "text", required: true },
      { name: "image_key", label: "Gambar (upload/URL)", type: "image", required: true },
      { name: "alt", label: "Teks Alternatif", type: "text" },
      { name: "caption", label: "Caption", type: "text" },
      { name: "sort", label: "Urutan", type: "number" },
    ],
  },
  {
    id: "facility_highlights",
    table: "facility_highlights",
    label: "Kartu Fasilitas Home",
    primaryKey: "id",
    orderBy: "sort asc",
    listColumns: [
      { name: "id", label: "ID" },
      { name: "title", label: "Judul" },
      { name: "sort", label: "Urutan" },
    ],
    fields: [
      { name: "id", label: "ID (slug)", type: "text", required: true },
      { name: "title", label: "Judul", type: "text", required: true },
      { name: "description", label: "Deskripsi", type: "textarea" },
      { name: "image_key", label: "Gambar (upload/URL)", type: "image" },
      { name: "sort", label: "Urutan", type: "number" },
    ],
  },
  {
    id: "people_photos",
    table: "people_photos",
    label: "Foto Komunitas Home",
    primaryKey: "id",
    orderBy: "sort asc",
    listColumns: [
      { name: "id", label: "ID" },
      { name: "alt", label: "Label" },
      { name: "sort", label: "Urutan" },
    ],
    fields: [
      { name: "id", label: "ID (slug)", type: "text", required: true },
      { name: "image_key", label: "Foto (upload/URL)", type: "image", required: true },
      { name: "alt", label: "Label", type: "text" },
      { name: "sort", label: "Urutan", type: "number" },
    ],
  },
  {
    id: "ppdb_config",
    table: "ppdb_config",
    label: "Konfigurasi PPDB",
    primaryKey: "id",
    orderBy: "id asc",
    singleton: true,
    listColumns: [
      { name: "id", label: "ID" },
      { name: "registration_open_at", label: "Pembukaan" },
      { name: "updated_at", label: "Diperbarui" },
    ],
    fields: [
      { name: "id", label: "ID", type: "text", required: true, placeholder: "default" },
      { name: "registration_open_at", label: "Waktu Pembukaan", type: "datetime" },
      { name: "steps", label: "Langkah (JSON)", type: "textarea" },
      { name: "schedule", label: "Jadwal (JSON)", type: "textarea" },
      { name: "fees", label: "Biaya (JSON)", type: "textarea" },
      { name: "scholarships", label: "Beasiswa (JSON)", type: "textarea" },
    ],
  },
  {
    id: "class_schedules",
    table: "class_schedules",
    label: "Jadwal Pelajaran",
    primaryKey: "id",
    orderBy: "day asc, start_time asc",
    listColumns: [
      { name: "day", label: "Hari" },
      { name: "start_time", label: "Mulai" },
      { name: "end_time", label: "Selesai" },
      { name: "subject", label: "Mapel" },
      { name: "class_name", label: "Kelas" },
    ],
    fields: [
      { name: "id", label: "ID (slug)", type: "text", required: true },
      { name: "day", label: "Hari", type: "select", options: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"] },
      { name: "start_time", label: "Jam Mulai (07.00)", type: "text", required: true },
      { name: "end_time", label: "Jam Selesai (08.30)", type: "text", required: true },
      { name: "subject", label: "Mata Pelajaran", type: "text", required: true },
      { name: "class_name", label: "Kelas", type: "text" },
      { name: "room", label: "Ruang", type: "text" },
      { name: "teacher", label: "Guru", type: "text" },
      {
        name: "audience",
        label: "Jenis",
        type: "select",
        options: ["student", "teacher"],
      },
      { name: "sort", label: "Urutan", type: "number" },
    ],
  },
  {
    id: "school_profile",
    table: "school_profile",
    label: "Profil Sekolah",
    primaryKey: "id",
    orderBy: "id asc",
    singleton: true,
    listColumns: [
      { name: "id", label: "ID" },
      { name: "nama", label: "Nama" },
      { name: "alamat", label: "Alamat" },
      { name: "updated_at", label: "Diperbarui" },
    ],
    fields: [
      { name: "id", label: "ID", type: "text", required: true, placeholder: "default" },
      { name: "nama", label: "Nama Sekolah", type: "text" },
      { name: "npsn", label: "NPSN", type: "text" },
      { name: "akreditasi", label: "Akreditasi", type: "text" },
      { name: "skor_akreditasi", label: "Skor Akreditasi", type: "text" },
      { name: "tahun_berdiri", label: "Tahun Berdiri", type: "number" },
      { name: "alamat", label: "Alamat", type: "textarea" },
      { name: "telepon", label: "Telepon", type: "text" },
      { name: "email", label: "Email", type: "text" },
      { name: "maps_url", label: "URL Maps", type: "text" },
      { name: "jam_layanan", label: "Jam Layanan", type: "text" },
      { name: "visi", label: "Visi", type: "textarea" },
      { name: "misi", label: "Misi (JSON array)", type: "textarea" },
    ],
  },
];

export const cmsResourceById = (id: string) => CMS_RESOURCES.find((r) => r.id === id);
