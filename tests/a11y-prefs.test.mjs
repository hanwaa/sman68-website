import test from "node:test";
import assert from "node:assert/strict";
import {
  A11Y_BOOTSTRAP_SCRIPT,
  A11Y_CLASS_NAMES,
  A11Y_STORAGE_KEY,
  a11yClassesFor,
  defaultA11yPrefs,
  normalizeA11yPrefs,
  readStoredA11yPrefs,
  writeStoredA11yPrefs,
} from "../.test-build/lib/a11y.js";

const memoryStorage = (initial = {}) => {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, value),
    map,
  };
};

test("preferensi bawaan: tidak ada fitur aktif", () => {
  assert.deepEqual(a11yClassesFor(defaultA11yPrefs), []);
  for (const [key, value] of Object.entries(defaultA11yPrefs)) {
    if (key === "textSize") assert.equal(value, 0);
    else assert.equal(value, false, key);
  }
});

test("hanya preferensi aktif yang menghasilkan kelas", () => {
  assert.deepEqual(a11yClassesFor(defaultA11yPrefs), []);

  assert.deepEqual(a11yClassesFor({ ...defaultA11yPrefs, textSize: 1 }), ["a11y-text-lg"]);
  assert.deepEqual(a11yClassesFor({ ...defaultA11yPrefs, textSize: 2 }), ["a11y-text-xl"]);
  assert.deepEqual(
    a11yClassesFor({
      ...defaultA11yPrefs,
      highContrast: true,
      reduceMotion: true,
      touchTargets: true,
    }),
    ["a11y-contrast", "a11y-motion-off", "a11y-touch"]
  );
});

test("kelas yang dihasilkan selalu terdaftar di A11Y_CLASS_NAMES", () => {
  const everyPrefOn = {
    textSize: 2,
    highContrast: true,
    grayscale: true,
    colorBlind: true,
    reduceMotion: true,
    underlineLinks: true,
    wideSpacing: true,
    strongFocus: true,
    dyslexiaFont: true,
    touchTargets: true,
  };
  const produced = a11yClassesFor(everyPrefOn);

  // 9 preferensi boolean + 1 kelas ukuran teks (hanya satu yang aktif
  // sekaligus), sedangkan A11Y_CLASS_NAMES menyimpan kedua varian ukuran teks.
  assert.equal(produced.length, 10);
  for (const name of produced) assert.ok(A11Y_CLASS_NAMES.includes(name), name);
  assert.ok(A11Y_CLASS_NAMES.includes("a11y-text-lg"));
  assert.ok(A11Y_CLASS_NAMES.includes("a11y-text-xl"));
});

test("textSize 0 tidak menyisakan kelas ukuran teks", () => {
  assert.equal(
    a11yClassesFor({ ...defaultA11yPrefs, textSize: 0 }).some((c) => c.startsWith("a11y-text-")),
    false
  );
});

test("normalize mengabaikan nilai rusak dan tipe salah", () => {
  assert.deepEqual(normalizeA11yPrefs(null), defaultA11yPrefs);
  assert.deepEqual(normalizeA11yPrefs("a11y"), defaultA11yPrefs);
  assert.deepEqual(normalizeA11yPrefs(42), defaultA11yPrefs);

  const messy = normalizeA11yPrefs({
    textSize: 9,
    highContrast: "true",
    grayscale: true,
    reduceMotion: 1,
    touchTargets: false,
  });
  assert.equal(messy.textSize, 0);
  assert.equal(messy.highContrast, false, "hanya boolean true yang diaktifkan");
  assert.equal(messy.grayscale, true);
  assert.equal(messy.reduceMotion, false);
  assert.equal(messy.touchTargets, false);
});

test("normalize menerima ukuran teks sebagai string", () => {
  assert.equal(normalizeA11yPrefs({ textSize: "2" }).textSize, 2);
  assert.equal(normalizeA11yPrefs({ textSize: "1" }).textSize, 1);
  assert.equal(normalizeA11yPrefs({ textSize: "0" }).textSize, 0);
});

test("penyimpanan: baca-tulis-baca konsisten", () => {
  const storage = memoryStorage();
  assert.deepEqual(readStoredA11yPrefs(storage), defaultA11yPrefs);

  const prefs = { ...defaultA11yPrefs, dyslexiaFont: true, textSize: 2 };
  writeStoredA11yPrefs(storage, prefs);
  assert.deepEqual(readStoredA11yPrefs(storage), prefs);
  assert.equal(storage.map.get(A11Y_STORAGE_KEY) !== undefined, true);
});

test("penyimpanan: JSON rusak tidak membuat aplikasi crash", () => {
  const storage = memoryStorage({ [A11Y_STORAGE_KEY]: "{bukan json" });
  assert.deepEqual(readStoredA11yPrefs(storage), defaultA11yPrefs);
});

test("penyimpanan: storage yang menolak ditulis tidak melempar", () => {
  const hostile = {
    getItem: () => null,
    setItem: () => {
      throw new Error("QuotaExceededError");
    },
  };
  assert.deepEqual(readStoredA11yPrefs(hostile), defaultA11yPrefs);
  writeStoredA11yPrefs(hostile, { ...defaultA11yPrefs, grayscale: true });
});

test("penyimpanan: storage null ditoleransi", () => {
  assert.deepEqual(readStoredA11yPrefs(null), defaultA11yPrefs);
  writeStoredA11yPrefs(undefined, defaultA11yPrefs);
});

test("script bootstrap memasang semua kelas prefs aktif", () => {
  const classes = new Set();
  const documentElement = {
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
    },
  };
  const stored = {
    textSize: 1,
    highContrast: true,
    grayscale: true,
    colorBlind: true,
    reduceMotion: true,
    underlineLinks: true,
    wideSpacing: true,
    strongFocus: true,
    dyslexiaFont: true,
    touchTargets: true,
  };
  const document = { documentElement };
  const localStorage = { getItem: () => JSON.stringify(stored) };

  new Function("document", "localStorage", A11Y_BOOTSTRAP_SCRIPT)(document, localStorage);

  for (const name of a11yClassesFor(normalizeA11yPrefs(stored))) {
    assert.ok(classes.has(name), `kelas ${name} tidak dipasang script bootstrap`);
  }
});

test("script bootstrap tidak melempar saat storage tidak tersedia", () => {
  const documentElement = { classList: { add: () => {}, remove: () => {} } };
  const document = { documentElement };
  const localStorage = {
    getItem: () => {
      throw new Error("blocked");
    },
  };
  new Function("document", "localStorage", A11Y_BOOTSTRAP_SCRIPT)(document, localStorage);
});

test("script bootstrap hanya memasang ukuran teks yang sesuai", () => {
  const run = (textSize) => {
    const classes = new Set();
    const documentElement = { classList: { add: (n) => classes.add(n) } };
    const document = { documentElement };
    const localStorage = { getItem: () => JSON.stringify({ textSize }) };
    new Function("document", "localStorage", A11Y_BOOTSTRAP_SCRIPT)(document, localStorage);
    return classes;
  };
  assert.deepEqual([...run(0)], []);
  assert.deepEqual([...run(1)], ["a11y-text-lg"]);
  assert.deepEqual([...run(2)], ["a11y-text-xl"]);
});
