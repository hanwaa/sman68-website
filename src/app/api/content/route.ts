import { NextRequest, NextResponse } from "next/server";
import { dbConfigured, getDb } from "@/lib/db";
import { getSessionAccount } from "@/lib/auth-server";
import { classInitials } from "@/lib/classroom";
import { newsArticles, type NewsArticle } from "@/lib/news";
import {
  achievements as staticAchievements,
  facilities as staticFacilities,
  faqs as staticFaqs,
  galleryAlbums as staticAlbums,
  galleryPhotos as staticPhotos,
  ppdbFees,
  ppdbSchedule,
  ppdbScholarships,
  ppdbSteps,
  teachers as staticTeachers,
  testimonials as staticTestimonials,
  facilityHighlights,
  peoplePhotos,
} from "@/lib/content";
import { ekskulList, normalizeEkskulCategory } from "@/lib/ekskul";
import { orgMembers, orgUnits } from "@/lib/struktur-organisasi";
import { filterPublicRooms } from "@/lib/fasilitas-publik";
import { getInstagramFeed } from "@/lib/instagram";
import {
  alumniCareer,
  universityLocations,
  universityLogos,
  universityShortNames,
} from "@/lib/alumni-career";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
const text = (v: unknown) => (v == null ? "" : String(v));

const relativeLabel = (iso: string | null) => {
  if (!iso) return "";
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Hari ini";
  if (days === 1) return "Kemarin";
  return `${days} hari lalu`;
};

const heroSlidesFallback = [
  { src: "/assets/hero-4.jpeg", alt: "Bazkom Seranoua SMAN 68 Jakarta", caption: "Bazkom Seranoua 2024" },
  { src: "/assets/hero-1.png", alt: "Kegiatan siswa SMAN 68 Jakarta", caption: "Kegiatan belajar siswa" },
  { src: "/assets/hero-2.png", alt: "Prestasi siswa SMAN 68 Jakarta", caption: "Prestasi siswa" },
  { src: "/assets/hero-3.png", alt: "Apel pembinaan SMAN 68 Jakarta", caption: "Apel pembinaan" },
  { src: "/assets/foto-2.webp", alt: "Semangat siswa SMAN 68 Jakarta", caption: "Kebersamaan siswa" },
];

/** GET /api/content?resource=news|achievements|gallery|facilities|teachers|testimonials|faqs|ppdb|ekskul|events */
export async function GET(request: NextRequest) {
  const resource = request.nextUrl.searchParams.get("resource") ?? "";

  // Data guru bersifat internal (nama, jabatan, foto). Hanya akun yang sudah
  // login yang boleh membacanya — sebelumnya endpoint ini terbuka untuk publik
  // sehingga siapa pun bisa mengambil seluruh daftar guru.
  if (resource === "teachers") {
    const account = await getSessionAccount();
    if (!account) {
      return NextResponse.json(
        { error: "Sesi tidak valid. Silakan masuk terlebih dahulu." },
        { status: 401 }
      );
    }
  }

  const fallback = () => {
    switch (resource) {
      case "news":
        return newsArticles;
      case "achievements":
        return staticAchievements;
      case "gallery":
        return { albums: staticAlbums, photos: staticPhotos };
      case "facilities":
        return {
          facilities: filterPublicRooms(staticFacilities),
          highlights: facilityHighlights,
        };
      case "teachers":
        return staticTeachers;
      case "testimonials":
        return { testimonials: staticTestimonials, photos: peoplePhotos };
      case "faqs":
        return staticFaqs;
      case "ppdb":
        return { steps: ppdbSteps, schedule: ppdbSchedule, fees: ppdbFees, scholarships: ppdbScholarships };
      case "ekskul":
        return ekskulList;
      case "struktur":
        return { units: orgUnits, members: orgMembers };
      case "events":
        return [];
      case "hero":
        return heroSlidesFallback.map((slide, index) => ({
          id: `hero-${index + 1}`,
          src: slide.src,
          alt: slide.alt,
          caption: slide.caption,
        }));
      case "alumni":
        return alumniCareer.map((a) => ({
          id: a.id,
          name: a.name,
          graduationYear: Number(a.angkatan) || null,
          photo: a.photo,
          jobTitle: a.role,
          company: a.company,
          cityId: a.cityId,
          linkedin: a.linkedin,
          bio: a.bio,
          field: a.field,
          universityId: null,
          universityName: a.university,
          universityLogo: null,
        }));
      case "universities":
        return Object.entries(universityShortNames).map(([name, short]) => ({
          id: short.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          name,
          city: null,
          logo: universityLogos[name] ?? null,
          lat: universityLocations[name]?.lat ?? null,
          lng: universityLocations[name]?.lng ?? null,
          alumniCount: 0,
        }));
      default:
        return null;
    }
  };

  if (!resource) {
    return NextResponse.json({ error: "resource wajib diisi." }, { status: 400 });
  }

  // Instagram tidak bergantung pada database — ambil langsung dari feed widget.
  if (resource === "instagram") {
    const feed = await getInstagramFeed();
    return NextResponse.json({ data: feed, source: "instagram" });
  }

  if (!dbConfigured()) {
    return NextResponse.json({ data: fallback(), source: "static" });
  }

  try {
    const sql = getDb();

    switch (resource) {
      case "news": {
        const rows = (await sql`
          select slug, title, excerpt, content, category, author, cover_key, views, published_at
          from news where status = 'published'
          order by published_at desc
        `) as Row[];
        if (rows.length === 0) break;
        const data: NewsArticle[] = rows.map((row, index) => ({
          id: text(index + 1),
          slug: text(row.slug),
          title: text(row.title),
          excerpt: text(row.excerpt),
          content: text(row.content),
          category: text(row.category) as NewsArticle["category"],
          author: text(row.author),
          cover: text(row.cover_key),
          views: Number(row.views) || 0,
          dateLabel: relativeLabel(row.published_at as string | null),
          publishedAt: text(row.published_at),
        }));
        return NextResponse.json({ data, source: "db" });
      }

      case "achievements": {
        const rows = (await sql`
          select a.id, a.title, a.description, a.level, a.category, a.award_type, a.year,
                 a.cover_key, a.participants, a.student_name, a.ekskul_id, a.created_at,
                 n.slug as news_slug, n.title as news_title
          from achievements a
          left join news n
            on n.achievement_id = a.id
           and n.status = 'published'
          where a.status = 'published'
          order by a.year desc, a.title asc
        `) as Row[];
        if (rows.length === 0) break;
        return NextResponse.json({
          data: rows.map((row) => ({
            id: text(row.id),
            title: text(row.title),
            description: text(row.description),
            level: text(row.level),
            category: text(row.category),
            awardType: text(row.award_type),
            year: Number(row.year),
            cover: text(row.cover_key),
            participants: Array.isArray(row.participants) ? row.participants : [],
            studentName: row.student_name == null ? null : text(row.student_name),
            ekskulId: row.ekskul_id == null ? null : text(row.ekskul_id),
            createdAt: row.created_at ? new Date(String(row.created_at)).toISOString() : null,
            newsSlug: row.news_slug == null ? null : text(row.news_slug),
            newsTitle: row.news_title == null ? null : text(row.news_title),
          })),
          source: "db",
        });
      }

      case "gallery": {
        const [albums, photos] = await Promise.all([
          sql`
            select id, title, category, cover_key from gallery_albums order by sort asc
          ` as Promise<Row[]>,
          sql`
            select album_id, image_key, caption from gallery_photos order by sort asc
          ` as Promise<Row[]>,
        ]);
        if (albums.length === 0 && photos.length === 0) break;
        return NextResponse.json({
          data: {
            albums: albums.map((a) => ({
              id: text(a.id),
              title: text(a.title),
              category: text(a.category),
              cover: text(a.cover_key),
            })),
            photos: photos.map((p, i) => ({
              id: `photo-${i + 1}`,
              src: text(p.image_key),
              caption: text(p.caption),
              albumId: (p.album_id as string | null) ?? undefined,
            })),
          },
          source: "db",
        });
      }

      case "facilities": {
        const [rows, highlightRows] = await Promise.all([
          sql`
            select id, name, category, floor, building, capacity, description, images
            from facilities order by sort asc
          ` as Promise<Row[]>,
          sql`
            select id, title, description, image_key from facility_highlights order by sort asc
          ` as Promise<Row[]>,
        ]);
        if (rows.length === 0 && highlightRows.length === 0) break;
        // Ruangan administrasi sekolah disaring di sini juga, bukan hanya di
        // UI, supaya /api/content tidak jadi jalan bocor data internal.
        const publicRows = filterPublicRooms(
          rows.map((row) => ({
            id: text(row.id),
            name: text(row.name),
            category: text(row.category),
            floor: text(row.floor),
            building: (row.building as string | null) ?? undefined,
            capacity: row.capacity == null ? undefined : Number(row.capacity),
            description: (row.description as string | null) ?? undefined,
            images: Array.isArray(row.images) ? (row.images as string[]) : [],
          }))
        );
        return NextResponse.json({
          data: {
            facilities: publicRows,
            highlights:
              highlightRows.length > 0
                ? highlightRows.map((row) => ({
                    id: text(row.id),
                    title: text(row.title),
                    description: text(row.description),
                    image: text(row.image_key),
                  }))
                : facilityHighlights,
          },
          source: "db",
        });
      }

      case "teachers": {
        const rows = (await sql`
          select id, name, subject, position, photo_key from teachers order by sort asc
        `) as Row[];
        if (rows.length === 0) break;
        return NextResponse.json({
          data: rows.map((row) => ({
            id: text(row.id),
            name: text(row.name),
            subject: text(row.subject),
            position: text(row.position),
            photo: text(row.photo_key),
          })),
          source: "db",
        });
      }

      case "testimonials": {
        const [rows, photoRows] = await Promise.all([
          sql`
            select id, name, role, quote, photo_key from testimonials order by sort asc
          ` as Promise<Row[]>,
          sql`
            select id, image_key, alt from people_photos order by sort asc
          ` as Promise<Row[]>,
        ]);
        if (rows.length === 0 && photoRows.length === 0) break;
        return NextResponse.json({
          data: {
            testimonials: rows.map((row) => ({
              id: text(row.id),
              name: text(row.name),
              role: text(row.role),
              quote: text(row.quote),
              photo: text(row.photo_key) || classInitials(text(row.name)),
            })),
            photos:
              photoRows.length > 0
                ? photoRows.map((row) => ({
                    src: text(row.image_key),
                    alt: text(row.alt),
                  }))
                : peoplePhotos,
          },
          source: "db",
        });
      }

      case "faqs": {
        const rows = (await sql`
          select id, question, answer, category from faqs order by sort asc
        `) as Row[];
        if (rows.length === 0) break;
        return NextResponse.json({
          data: rows.map((row) => ({
            id: text(row.id),
            question: text(row.question),
            answer: text(row.answer),
            category: text(row.category),
          })),
          source: "db",
        });
      }

      case "ppdb": {
        const rows = (await sql`
          select steps, schedule, fees, scholarships from ppdb_config where id = 'default'
        `) as Row[];
        const row = rows[0];
        if (!row) break;
        return NextResponse.json({
          data: {
            steps: row.steps ?? ppdbSteps,
            schedule: row.schedule ?? ppdbSchedule,
            fees: row.fees ?? ppdbFees,
            scholarships: row.scholarships ?? ppdbScholarships,
          },
          source: "db",
        });
      }

      case "ekskul": {
        const rows = (await sql`
          select id, name, category, logo_key, thumb_key, members, achievements, description, schedule, advisor
          from extracurriculars order by sort asc
        `) as Row[];
        if (rows.length === 0) break;
        return NextResponse.json({
          data: rows.map((row) => ({
            id: text(row.id),
            name: text(row.name),
            category: normalizeEkskulCategory(row.category),
            logo: (row.logo_key as string | null) ?? null,
            thumb: (row.thumb_key as string | null) ?? null,
            members: Number(row.members) || 0,
            achievements: Number(row.achievements) || 0,
            desc: text(row.description),
            schedule: text(row.schedule),
            advisor: text(row.advisor),
          })),
          source: "db",
        });
      }

      // Struktur organisasi sengaja tidak menyertakan NIP/kontak/tanggal lahir —
      // kolom itu tidak ada di org_members sama sekali.
      case "struktur": {
        const [unitRows, memberRows] = await Promise.all([
          sql`
            select id, name, kind, parent_id, subject, description, sort
            from org_units order by sort asc
          ` as Promise<Row[]>,
          sql`
            select id, unit_id, name, position, alumni, photo_key, sort
            from org_members order by sort asc
          ` as Promise<Row[]>,
        ]);
        if (unitRows.length === 0) break;
        return NextResponse.json({
          data: {
            units: unitRows.map((row) => ({
              id: text(row.id),
              name: text(row.name),
              kind: text(row.kind),
              parentId: (row.parent_id as string | null) ?? null,
              subject: (row.subject as string | null) ?? undefined,
              description: text(row.description) || undefined,
              sort: Number(row.sort) || 0,
            })),
            members: memberRows.map((row) => ({
              id: text(row.id),
              unitId: text(row.unit_id),
              name: text(row.name),
              position: text(row.position),
              alumni: text(row.alumni) || null,
              photo: text(row.photo_key) || null,
              sort: Number(row.sort) || 0,
            })),
          },
          source: "db",
        });
      }

      case "alumni": {
        const rows = (await sql`
          select a.id, a.name, a.graduation_year, a.photo_key, a.job_title, a.company,
                 a.city, a.linkedin_url, a.story, a.field, a.university,
                 u.id as university_id, u.name as university_name, u.logo_key as university_logo
          from alumni a
          left join alumni_educations ae on ae.alumni_id = a.id
          left join universities u on u.id = ae.university_id
          order by a.sort asc
        `) as Row[];
        if (rows.length === 0) break;
        return NextResponse.json({
          data: rows.map((row) => ({
            id: text(row.id),
            name: text(row.name),
            graduationYear: row.graduation_year == null ? null : Number(row.graduation_year),
            photo: text(row.photo_key),
            jobTitle: text(row.job_title),
            company: text(row.company),
            cityId: text(row.city),
            linkedin: text(row.linkedin_url),
            bio: text(row.story),
            field: text(row.field),
            universityId: (row.university_id as string | null) ?? null,
            universityName:
              (row.university as string | null) ?? (row.university_name as string | null) ?? null,
            universityLogo: (row.university_logo as string | null) ?? null,
          })),
          source: "db",
        });
      }

      case "universities": {
        const rows = (await sql`
          select u.id, u.name, u.city, u.logo_key, u.lat, u.lng,
                 count(ae.alumni_id)::int as alumni_count
          from universities u
          left join alumni_educations ae on ae.university_id = u.id
          group by u.id
          order by u.name asc
        `) as Row[];
        if (rows.length === 0) break;
        return NextResponse.json({
          data: rows.map((row) => ({
            id: text(row.id),
            name: text(row.name),
            city: text(row.city),
            logo: text(row.logo_key),
            lat: row.lat == null ? null : Number(row.lat),
            lng: row.lng == null ? null : Number(row.lng),
            alumniCount: Number(row.alumni_count) || 0,
          })),
          source: "db",
        });
      }

      case "hero": {
        const rows = (await sql`
          select id, image_key, alt, caption from hero_slides order by sort asc
        `) as Row[];
        if (rows.length === 0) break;
        return NextResponse.json({
          data: rows.map((row) => ({
            id: text(row.id),
            src: text(row.image_key),
            alt: text(row.alt),
            caption: text(row.caption),
          })),
          source: "db",
        });
      }

      case "events": {
        const rows = (await sql`
          select id, title, category, start_at, location from events order by start_at asc
        `) as Row[];
        if (rows.length === 0) break;
        return NextResponse.json({
          data: rows.map((row) => {
            const start = new Date(text(row.start_at));
            const pad = (n: number) => String(n).padStart(2, "0");
            const jakarta = new Date(start.getTime() + 7 * 3600000);
            return {
              id: text(row.id),
              title: text(row.title),
              date: jakarta.toISOString().slice(0, 10),
              time: `${pad(jakarta.getUTCHours())}.${pad(jakarta.getUTCMinutes())}`,
              location: text(row.location),
              category: text(row.category),
              color: "#0A5A66",
            };
          }),
          source: "db",
        });
      }

      default:
        return NextResponse.json({ error: `resource "${resource}" tidak dikenal.` }, { status: 400 });
    }

    return NextResponse.json({ data: fallback(), source: "static" });
  } catch {
    return NextResponse.json({
      data: fallback(),
      source: "static",
    });
  }
}
