import { NextRequest, NextResponse } from "next/server";
import { dbConfigured, getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
const text = (v: unknown) => (v == null ? "" : String(v));

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function statusFor(startTime: string, endTime: string): string {
  const now = new Date(Date.now() + 7 * 3600000); // WIB
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const toMinutes = (value: string) => {
    const [h, m] = value.replace(".", ":").split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  if (minutes > end) return "Selesai";
  if (minutes >= start && minutes <= end) return "Sedang Berlangsung";
  return "Akan Datang";
}

/** GET /api/schedule?class=XI IPA 3   atau   ?teacher=Pak Budi Santoso, S.Pd. */
export async function GET(request: NextRequest) {
  if (!dbConfigured()) {
    return NextResponse.json({ data: [], source: "none" });
  }
  const className = request.nextUrl.searchParams.get("class");
  const teacher = request.nextUrl.searchParams.get("teacher");
  const sql = getDb();

  if (!teacher && !className) {
    const today = DAYS[new Date(Date.now() + 7 * 3600000).getUTCDay()];
    return NextResponse.json({ data: [], today, source: "none" });
  }

  const rows = (teacher
    ? await sql`
        select id, day, start_time, end_time, subject, class_name, room, teacher
        from class_schedules
        where teacher = ${teacher}
        order by case day
          when 'Senin' then 1 when 'Selasa' then 2 when 'Rabu' then 3
          when 'Kamis' then 4 when 'Jumat' then 5 else 6 end, start_time asc
      `
    : await sql`
        select id, day, start_time, end_time, subject, class_name, room, teacher
        from class_schedules
        where audience = 'student' and class_name = ${className}
        order by case day
          when 'Senin' then 1 when 'Selasa' then 2 when 'Rabu' then 3
          when 'Kamis' then 4 when 'Jumat' then 5 else 6 end, start_time asc
      `) as Row[];

  const data = rows.map((row) => {
    const start = text(row.start_time);
    const end = text(row.end_time);
    return {
      id: text(row.id),
      day: text(row.day),
      time: `${start} - ${end}`,
      startTime: start,
      endTime: end,
      subject: text(row.subject),
      className: text(row.class_name),
      room: text(row.room),
      teacher: text(row.teacher),
      status: statusFor(start, end),
    };
  });

  const today = DAYS[new Date(Date.now() + 7 * 3600000).getUTCDay()];
  return NextResponse.json({ data, today, source: "db" });
}
