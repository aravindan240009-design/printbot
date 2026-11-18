import assert from "node:assert/strict";
import test from "node:test";
import {
  constantTimeEqual,
  hashText,
  hmacSha256Hex,
  normalizeHex,
} from "./test_checkout.ts";

test("hashes customer capabilities with SHA-256", async () => {
  assert.equal(
    await hashText("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});

test("computes Razorpay-compatible HMAC-SHA256 signatures", async () => {
  assert.equal(
    await hmacSha256Hex("key", "The quick brown fox jumps over the lazy dog"),
    "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8",
  );
});

test("normalizes the provider signature header and compares full values", () => {
  const signature = "a".repeat(64);
  assert.equal(normalizeHex(`sha256=${signature.toUpperCase()}`), signature);
  assert.equal(constantTimeEqual(signature, signature), true);
  assert.equal(constantTimeEqual(signature, "b".repeat(64)), false);
  assert.equal(constantTimeEqual(signature, "short"), false);
});
