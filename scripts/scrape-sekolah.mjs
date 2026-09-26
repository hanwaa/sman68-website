import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const SEKOLAH_ID = "0B39825A-6DE4-44BC-8742-7B06129634A8";
const BASE = "https://sekolah.data.kemendikdasmen.go.id/v1/sekolah-service/sekolah";
const FILE_BASE = "https://file.data.kemendikdasmen.go.id/sekolahkita/20/2010";

const ENDPOINTS = [
  "full-detail",
  "akreditasi",
  "peserta-didik",
  "rombongan-belajar",
  "sarana-prasarana",
  "sanitasi",
  "ptk",
];

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}

async function main() {
  const snapshot = { sekolahId: SEKOLAH_ID, diakses: new Date().toISOString(), data: {} };

  for (const ep of ENDPOINTS) {
    const url = ep === "full-detail" ? `${BASE}/${ep}/${SEKOLAH_ID}` : `${BASE}/${ep}/${SEKOLAH_ID}`;
    try {
      snapshot.data[ep] = (await getJson(url)).data ?? null;
      console.log(`OK   ${ep}`);
    } catch (err) {
      snapshot.data[ep] = null;
      console.warn(`SKIP ${ep}: ${err.message}`);
    }
  }

  const outDir = path.resolve("src", "lib");
  await mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, "sekolah-snapshot.json");
  await writeFile(outFile, JSON.stringify(snapshot, null, 2), "utf8");
  console.log(`\nSnapshot ditulis: ${outFile}`);

  if (process.argv.includes("--foto")) {
    const fotoDir = path.resolve("public", "assets", "sekolah-raw");
    await mkdir(fotoDir, { recursive: true });
    const list = snapshot.data?.["full-detail"]?.foto_sekolah ?? [];
    for (const item of list) {
      const nama = item.path_file.split("/").pop();
      const res = await fetch(item.path_file);
      if (!res.ok) {
        console.warn(`SKIP ${nama}: ${res.status}`);
        continue;
      }
      await writeFile(path.join(fotoDir, nama), Buffer.from(await res.arrayBuffer()));
      console.log(`FOTO ${nama}`);
    }
    console.log(`\nFoto diunduh ke: ${fotoDir}`);
  } else {
    console.log("Tambah flag --foto untuk mengunduh seluruh foto sekolah.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
