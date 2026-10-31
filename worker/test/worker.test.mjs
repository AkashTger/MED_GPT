import assert from "node:assert/strict";
import test from "node:test";
import worker from "../src/index.js";

const origin = "https://example.github.io";

function environment(overrides = {}) {
  return {
    ALLOWED_ORIGIN: origin,
    GEMINI_API_KEY: "test-key",
    GEMINI_MODEL: "test-model",
    MAX_LOOKUPS_PER_DAY: "10",
    QUOTA: {
      idFromName(name) { return name; },
      get() { return { async fetch() { return Response.json({ allowed: true }); } }; },
    },
    ...overrides,
  };
}

function lookupRequest(body, requestOrigin = origin) {
  return new Request("https://med-gpt-api.example.workers.dev/api/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: requestOrigin },
    body: JSON.stringify(body),
  });
}

const validLookup = {
  medicineName: "Example medicine",
  activeIngredient: "Example ingredient",
  confirmedIngredient: true,
  strength: '500 mg',
  dosageForm: 'Tablet',
};

test("rejects a request from an origin other than the configured site", async () => {
  const response = await worker.fetch(lookupRequest(validLookup, "https://untrusted.example"), environment());
  assert.equal(response.status, 403);
  assert.match((await response.json()).error, /origin/i);
});

test("requires package-confirmed active ingredient details", async () => {
  const incomplete = { ...validLookup, confirmedIngredient: false };
  const response = await worker.fetch(lookupRequest(incomplete), environment());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, 'needs_confirmation');
});

test("does not require an access code", async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async url => {
    assert.match(String(url), /api\.fda\.gov/);
    return Response.json({ results: [] });
  };
  try {
    const response = await worker.fetch(lookupRequest(validLookup), environment());
    assert.equal(response.status, 200);
    assert.equal((await response.json()).status, "unsupported");
  } finally { globalThis.fetch = realFetch; }
});

test("returns clarification when no verified label can be found", async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.match(String(url), /api\.fda\.gov/);
    return new Response(JSON.stringify({ results: [] }), { status: 200 });
  };
  try {
    const response = await worker.fetch(lookupRequest(validLookup), environment());
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, "unsupported");
  } finally {
    globalThis.fetch = realFetch;
  }
});
