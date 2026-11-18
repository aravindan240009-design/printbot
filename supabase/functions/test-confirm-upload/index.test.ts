import assert from "node:assert/strict";
import test from "node:test";
import { matchesFileSignature } from "../_shared/test_checkout.ts";

test("accepts only matching PDF, JPEG, and PNG file signatures", () => {
  assert.equal(matchesFileSignature(new TextEncoder().encode("%PDF-1.7"), "application/pdf"), true);
  assert.equal(matchesFileSignature(new Uint8Array([0xff, 0xd8, 0xff, 0]), "image/jpeg"), true);
  assert.equal(matchesFileSignature(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png"), true);
  assert.equal(matchesFileSignature(new TextEncoder().encode("%PDF-1.7"), "image/png"), false);
  assert.equal(matchesFileSignature(new TextEncoder().encode("not a PDF"), "application/pdf"), false);
});
