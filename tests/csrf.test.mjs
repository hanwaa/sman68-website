import test from "node:test";
import assert from "node:assert/strict";
import { isSameOrigin } from "../.test-build/lib/csrf.js";

const request = (headers) => new Request("https://sman68-jkt.my.id/api/x", { headers });

test("menerima Origin yang sama dengan host", () => {
  assert.equal(
    isSameOrigin(request({ host: "sman68-jkt.my.id", origin: "https://sman68-jkt.my.id" })),
    true
  );
});

test("menerima Origin dengan port yang sama", () => {
  assert.equal(
    isSameOrigin(request({ host: "sman68-jkt.my.id:443", origin: "https://sman68-jkt.my.id" })),
    false
  );
});

test("menolak Origin dari domain lain", () => {
  assert.equal(
    isSameOrigin(request({ host: "sman68-jkt.my.id", origin: "https://evil.example.com" })),
    false
  );
  assert.equal(
    isSameOrigin(request({ host: "sman68-jkt.my.id", origin: "https://sman68-jkt.my.id.evil.com" })),
    false
  );
});

test("tanpa Origin tetap diizinkan (permintaan same-origin non-CORS)", () => {
  assert.equal(isSameOrigin(request({ host: "sman68-jkt.my.id" })), true);
});

test("Origin tidak valid ditolak", () => {
  assert.equal(isSameOrigin(request({ host: "sman68-jkt.my.id", origin: "bukan-url" })), false);
  assert.equal(isSameOrigin(request({ origin: "https://sman68-jkt.my.id" })), false);
});

test("menghormati x-forwarded-host di belakang proxy", () => {
  assert.equal(
    isSameOrigin(
      request({
        host: "127.0.0.1:30000",
        "x-forwarded-host": "sman68-jkt.my.id",
        origin: "https://sman68-jkt.my.id",
      })
    ),
    true
  );
});
