import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, updateTag } from "next/cache";
import { dbConfigured, getDb } from "@/lib/db";
import { cmsResourceById, type CmsField } from "@/lib/cms";
import { requireRole } from "@/lib/api-auth";
import { guardMutation, readJsonLimited, CMS_BODY_LIMIT } from "@/lib/api-guard";
import { purgeContentCache } from "@/lib/content-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

const quoteIdent = (name: string) => `"${name.replace(/"/g, '""')}"`;

/** Segarkan cache halaman publik setelah ada perubahan konten dari CMS. */
const revalidatePublic = () => {
  revalidatePath("/", "layout");
  updateTag("cms");
  purgeContentCache();
};

function normalizeValue(field: CmsField, raw: unknown): unknown {
  if (raw === undefined || raw === null || raw === "") {
    return field.type === "images" ? "[]" : null;
  }
  switch (field.type) {
    case "number": {
      const numeric = Number(raw);
      return Number.isFinite(numeric) ? numeric : null;
    }
    case "select": {
      if (raw === true || raw === false) return raw;
      if (field.options?.includes("true") && field.options?.includes("false")) {
        return String(raw) === "true";
      }
      return String(raw);
    }
    case "checkbox": {
      if (raw === true) return true;
      if (raw === false) return false;
      const text = String(raw).trim().toLowerCase();
      return text === "true" || text === "1" || text === "ya" || text === "yes";
    }
    case "images":
    case "list": {
      const list = Array.isArray(raw)
        ? raw
        : String(raw)
            .split(/[\n,]+/)
            .map((item) => item.trim())
            .filter(Boolean);
      return JSON.stringify(list);
    }
    default:
      return String(raw);
  }
}

const placeholderFor = (field: CmsField, index: number) =>
  field.type === "images" || field.type === "list" ? `$${index + 1}::jsonb` : `$${index + 1}`;

async function guard(request: NextRequest) {
  const account = await requireRole(["admin"]);
  if (account instanceof NextResponse) return account;
  if (request.method !== "GET") {
    const rejected = guardMutation(request, { maxBytes: CMS_BODY_LIMIT });
    if (rejected) return rejected;
  }
  if (!dbConfigured()) {
    return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });
  }
  const resourceId = request.nextUrl.searchParams.get("resource");
  const resource = cmsResourceById(resourceId ?? "");
  if (!resource) {
    return NextResponse.json({ error: "Resource CMS tidak dikenal." }, { status: 400 });
  }
  return resource;
}

/** GET /api/admin/cms?resource=news */
export async function GET(request: NextRequest) {
  const resource = await guard(request);
  if (resource instanceof NextResponse) return resource;

  const rows = (await getDb().query(
    `select * from ${quoteIdent(resource.table)} order by ${resource.orderBy} limit 200`
  )) as Row[];

  return NextResponse.json({ resource: resource.id, data: rows });
}

/** POST /api/admin/cms { resource, values } */
export async function POST(request: NextRequest) {
  const resource = await guard(request);
  if (resource instanceof NextResponse) return resource;

  const body = (await readJsonLimited<{ values?: Record<string, unknown> }>(
    request,
    CMS_BODY_LIMIT
  )) as { values?: Record<string, unknown> } | null;
  const values = { ...(body?.values ?? {}) };

  // Jaring aman: tabel ber-PK teks wajib punya ID unik, buat otomatis bila kosong
  const hasTextIdField = resource.fields.some((field) => field.name === resource.primaryKey);
  if (hasTextIdField && !resource.singleton && !values[resource.primaryKey]) {
    values[resource.primaryKey] = `${resource.id.replace(/_/g, "-")}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;
  }

  const cols = resource.fields.filter(
    (field) => values[field.name] !== undefined && String(values[field.name]).trim() !== ""
  );
  if (cols.length === 0) {
    return NextResponse.json({ error: "Tidak ada data untuk disimpan." }, { status: 400 });
  }

  const params = cols.map((field) => normalizeValue(field, values[field.name]));
  const placeholders = cols.map((field, i) => placeholderFor(field, i)).join(", ");
  const query = `insert into ${quoteIdent(resource.table)} (${cols
    .map((c) => quoteIdent(c.name))
    .join(", ")}) values (${placeholders}) returning *`;

  const rows = (await getDb().query(query, params)) as Row[];
  revalidatePublic();
  return NextResponse.json({ data: rows[0] });
}

/** PATCH /api/admin/cms { resource, id, values } */
export async function PATCH(request: NextRequest) {
  const resource = await guard(request);
  if (resource instanceof NextResponse) return resource;

  const body = (await readJsonLimited<{ id?: string; values?: Record<string, unknown> }>(
    request,
    CMS_BODY_LIMIT
  )) as { id?: string; values?: Record<string, unknown> } | null;
  if (!body?.id) {
    return NextResponse.json({ error: "id wajib diisi." }, { status: 400 });
  }
  const values = body.values ?? {};
  const cols = resource.fields.filter(
    (field) => field.name !== resource.primaryKey && values[field.name] !== undefined
  );
  if (cols.length === 0) {
    return NextResponse.json({ error: "Tidak ada perubahan." }, { status: 400 });
  }

  const params = cols.map((field) => normalizeValue(field, values[field.name]));
  const assignments = cols
    .map((field, i) => `${quoteIdent(field.name)} = ${placeholderFor(field, i)}`)
    .join(", ");
  params.push(body.id);
  const query = `update ${quoteIdent(resource.table)} set ${assignments} where ${quoteIdent(
    resource.primaryKey
  )} = $${params.length} returning *`;

  const rows = (await getDb().query(query, params)) as Row[];
  revalidatePublic();
  return NextResponse.json({ data: rows[0] ?? null });
}

/** DELETE /api/admin/cms?resource=news&id=... */
export async function DELETE(request: NextRequest) {
  const resource = await guard(request);
  if (resource instanceof NextResponse) return resource;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id wajib diisi." }, { status: 400 });
  }
  await getDb().query(
    `delete from ${quoteIdent(resource.table)} where ${quoteIdent(resource.primaryKey)} = $1`,
    [id]
  );
  revalidatePublic();
  return NextResponse.json({ ok: true });
}
