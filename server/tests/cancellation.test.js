const test = require("node:test");
const assert = require("node:assert");
const { evaluateCancellation, canCancel } = require("../src/utils/cancellation");

// --- evaluateCancellation: pure fee calculation ---

test("more than 2 hours before -> free", () => {
  const now = new Date("2026-09-17T14:00:00+05:30");
  const start = new Date("2026-09-17T17:00:00+05:30"); // 3h remaining
  const r = evaluateCancellation(start, now);
  assert.strictEqual(r.type, "EARLY");
  assert.strictEqual(r.fee, 0);
  assert.strictEqual(r.alreadyStarted, false);
});

test("exactly 2 hours before -> late, 200", () => {
  const now = new Date("2026-09-17T15:00:00+05:30");
  const start = new Date("2026-09-17T17:00:00+05:30"); // exactly 2h
  const r = evaluateCancellation(start, now);
  assert.strictEqual(r.type, "LATE");
  assert.strictEqual(r.fee, 200);
});

test("1 hour before -> late, 200", () => {
  const now = new Date("2026-09-17T16:00:00+05:30");
  const start = new Date("2026-09-17T17:00:00+05:30");
  const r = evaluateCancellation(start, now);
  assert.strictEqual(r.type, "LATE");
  assert.strictEqual(r.fee, 200);
});

test("one second before start -> still late, not alreadyStarted", () => {
  const now = new Date("2026-09-17T16:59:59+05:30");
  const start = new Date("2026-09-17T17:00:00+05:30");
  const r = evaluateCancellation(start, now);
  assert.strictEqual(r.alreadyStarted, false);
  assert.strictEqual(r.fee, 200);
});

test("appointment already started (now == start) -> alreadyStarted true", () => {
  const now = new Date("2026-09-17T17:00:00+05:30");
  const start = new Date("2026-09-17T17:00:00+05:30");
  const r = evaluateCancellation(start, now);
  assert.strictEqual(r.alreadyStarted, true);
});

test("appointment already started (now well after start) -> alreadyStarted true", () => {
  const now = new Date("2026-09-17T17:30:00+05:30");
  const start = new Date("2026-09-17T17:00:00+05:30");
  const r = evaluateCancellation(start, now);
  assert.strictEqual(r.alreadyStarted, true);
});

// --- canCancel: full route-level decision, including status checks ---

test("canCancel: SCHEDULED, >2h out -> allowed, fee 0", () => {
  const now = new Date("2026-09-17T14:00:00+05:30");
  const appointment = { status: "SCHEDULED", startTime: new Date("2026-09-17T17:00:00+05:30") };
  const d = canCancel(appointment, now);
  assert.strictEqual(d.allowed, true);
  assert.strictEqual(d.fee, 0);
  assert.strictEqual(d.type, "EARLY");
});

test("canCancel: SCHEDULED, <2h out -> allowed, fee 200", () => {
  const now = new Date("2026-09-17T16:00:00+05:30");
  const appointment = { status: "SCHEDULED", startTime: new Date("2026-09-17T17:00:00+05:30") };
  const d = canCancel(appointment, now);
  assert.strictEqual(d.allowed, true);
  assert.strictEqual(d.fee, 200);
  assert.strictEqual(d.type, "LATE");
});

test("canCancel: already started -> rejected", () => {
  const now = new Date("2026-09-17T17:30:00+05:30");
  const appointment = { status: "SCHEDULED", startTime: new Date("2026-09-17T17:00:00+05:30") };
  const d = canCancel(appointment, now);
  assert.strictEqual(d.allowed, false);
  assert.strictEqual(d.reason, "ALREADY_STARTED");
});

test("canCancel: already CANCELLED -> rejected regardless of timing", () => {
  const now = new Date("2026-09-17T10:00:00+05:30");
  const appointment = { status: "CANCELLED", startTime: new Date("2026-09-17T17:00:00+05:30") };
  const d = canCancel(appointment, now);
  assert.strictEqual(d.allowed, false);
  assert.strictEqual(d.reason, "ALREADY_CANCELLED");
});

test("canCancel: COMPLETED -> rejected regardless of timing", () => {
  const now = new Date("2026-09-17T10:00:00+05:30");
  const appointment = { status: "COMPLETED", startTime: new Date("2026-09-17T09:00:00+05:30") };
  const d = canCancel(appointment, now);
  assert.strictEqual(d.allowed, false);
  assert.strictEqual(d.reason, "ALREADY_COMPLETED");
});

// E. Cancelled 10:00-10:30 must not block a new 10:00-10:30 booking. That
// rule lives in the booking route (status: { not: "CANCELLED" } filter, see
// utils/overlap.js + routes/appointments.js), not in cancellation.js, and is
// exercised by the overlap tests plus the manual/API test plan in the report.
