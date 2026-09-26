import { NextRequest, NextResponse } from "next/server";
import { dbConfigured, getDb } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
const text = (value: unknown) => (value == null ? "" : String(value));

/** GET /api/students?class=X.1  atau  ?nisn=0068100101  atau  ?id=siswa-10-1-1 */
export async function GET(request: NextRequest) {
  const account = await requireRole(["teacher", "admin"]);
  if (account instanceof NextResponse) return account;

  if (!dbConfigured()) {
    return NextResponse.json({ data: [], source: "none" });
  }

  const className = request.nextUrl.searchParams.get("class");
  const nisn = request.nextUrl.searchParams.get("nisn");
  const id = request.nextUrl.searchParams.get("id");
  const homeClass = account.role === "teacher" ? account.className : null;
  const sql = getDb();

  const mapRow = (row: Row) => ({
    id: text(row.id),
    name: text(row.name),
    nisn: text(row.nisn),
    className: text(row.class_name),
  });

  if (id) {
    const rows = (homeClass
      ? await sql`
          select id, name, nisn, class_name from students
          where id = ${id} and class_name = ${homeClass} limit 1
        `
      : await sql`
          select id, name, nisn, class_name from students where id = ${id} limit 1
        `) as Row[];
    return NextResponse.json({ data: rows.map(mapRow), source: "db" });
  }

  if (nisn) {
    const rows = (homeClass
      ? await sql`
          select id, name, nisn, class_name from students
          where nisn = ${nisn} and class_name = ${homeClass} limit 1
        `
      : await sql`
          select id, name, nisn, class_name from students where nisn = ${nisn} limit 1
        `) as Row[];
    return NextResponse.json({ data: rows.map(mapRow), source: "db" });
  }

  if (className) {
    if (homeClass && className !== homeClass) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    const rows = (await sql`
      select id, name, nisn, class_name
      from students
      where class_name = ${className}
      order by name asc
    `) as Row[];
    return NextResponse.json({ data: rows.map(mapRow), source: "db" });
  }

  return NextResponse.json(
    { error: "Parameter class, nisn, atau id wajib diisi." },
    { status: 400 }
  );
}
